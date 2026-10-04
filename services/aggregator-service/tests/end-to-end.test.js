const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { after, before, beforeEach, test } = require("node:test");
const { once } = require("node:events");
const {
  createDataAccess,
  DataAccessError,
} = require("content-detection-data-access");
const {
  createApp: createCrawlerApp,
} = require("../../crawler-service/src/app");
const {
  createApp: createDefacementApp,
} = require("../../defacement-service/src/app");
const {
  createApp: createLinkApp,
} = require("../../link-detection-service/src/app");
const {
  createApp: createTextApp,
} = require("../../text-detection-service/src/app");
const { createApp: createAggregatorApp } = require("../src/app");
const { loadAggregatorConfig } = require("../src/config/aggregator-config");

const logger = { info() {}, warn() {}, error() {} };
const fixtureDirectory = path.join(__dirname, "fixtures");
const fixtures = {
  normal: fs.readFileSync(path.join(fixtureDirectory, "normal.html"), "utf8"),
  text: fs.readFileSync(
    path.join(fixtureDirectory, "text-pattern.html"),
    "utf8",
  ),
  link: fs.readFileSync(
    path.join(fixtureDirectory, "link-pattern.html"),
    "utf8",
  ),
  defacement: fs.readFileSync(
    path.join(fixtureDirectory, "defacement-change.html"),
    "utf8",
  ),
};

let fixtureServer;
let serviceServers;
let serviceUrls;
let dataAccess;
let config;
let testDirectory;
let aggregatorUrl;
let pageUrls;

async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return `http://127.0.0.1:${server.address().port}`;
}

async function closeServer(server) {
  if (!server?.listening) {
    return;
  }
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function sendHtml(response, html) {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(html);
}

before(async () => {
  fixtureServer = http.createServer((request, response) => {
    if (request.url === "/robots.txt") {
      response.writeHead(200, { "Content-Type": "text/plain" });
      response.end("User-agent: *\nAllow: /");
      return;
    }

    if (request.url === "/") {
      sendHtml(response, fixtures.normal);
    } else if (request.url === "/fixture-text") {
      sendHtml(response, fixtures.text);
    } else if (request.url === "/fixture-link") {
      sendHtml(response, fixtures.link);
    } else if (request.url === "/fixture-defacement") {
      sendHtml(response, fixtures.defacement);
    } else {
      response.writeHead(404);
      response.end();
    }
  });
  const fixtureUrl = await listen(fixtureServer);
  pageUrls = {
    normal: `${fixtureUrl}/`,
    text: `${fixtureUrl}/fixture-text`,
    link: `${fixtureUrl}/fixture-link`,
    defacement: `${fixtureUrl}/fixture-defacement`,
  };

  serviceServers = {
    textDetection: createTextApp({ logger }),
    defacement: createDefacementApp({ logger }),
    linkDetection: createLinkApp({ logger }),
    crawler: createCrawlerApp({ logger }),
  };
  serviceUrls = {};
  for (const [name, server] of Object.entries(serviceServers)) {
    serviceUrls[name] = await listen(server);
  }

  testDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "content-detection-e2e-"),
  );
  const databasePath = path.join(testDirectory, "e2e-scans.sqlite");
  dataAccess = createDataAccess(databasePath);
  config = loadAggregatorConfig({
    DATABASE_PATH: databasePath,
    CRAWLER_SERVICE_URL: serviceUrls.crawler,
    CRAWLER_TIMEOUT_MS: "10000",
    TEXT_DETECTION_URL: serviceUrls.textDetection,
    TEXT_DETECTION_TIMEOUT_MS: "3000",
    DEFACEMENT_SERVICE_URL: serviceUrls.defacement,
    DEFACEMENT_SERVICE_TIMEOUT_MS: "3000",
    LINK_DETECTION_SERVICE_URL: serviceUrls.linkDetection,
    LINK_DETECTION_SERVICE_TIMEOUT_MS: "3000",
  });
  const aggregatorServer = createAggregatorApp({
    config,
    dataAccess,
    logger,
  }).listen(0, "127.0.0.1");
  await once(aggregatorServer, "listening");
  serviceServers.aggregator = aggregatorServer;
  aggregatorUrl = `http://127.0.0.1:${aggregatorServer.address().port}`;
});

beforeEach(() => {
  dataAccess.database.exec("DELETE FROM scans");
});

after(async () => {
  for (const server of Object.values(serviceServers).reverse()) {
    await closeServer(server);
  }
  await closeServer(fixtureServer);
  dataAccess.close();
  fs.rmSync(testDirectory, { recursive: true, force: true });
});

test("all service health endpoints are available over their independent HTTP boundaries", async () => {
  for (const [serviceName, serviceUrl] of Object.entries({
    ...serviceUrls,
    aggregator: aggregatorUrl,
  })) {
    const response = await fetch(`${serviceUrl}/health`);
    const payload = await response.json();

    assert.equal(response.status, 200, serviceName);
    assert.equal(payload.success, true, serviceName);
    assert.equal(payload.status, "ok", serviceName);
  }
});

test("end-to-end scan crawls fixtures, calls detectors, aggregates, and persists each page", async () => {
  const response = await fetch(`${aggregatorUrl}/api/v1/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      crawler: {
        startUrl: pageUrls.normal,
        allowedHosts: ["127.0.0.1"],
        maxDepth: 1,
        maxPages: 10,
        requestDelayMs: 0,
        requestTimeoutMs: 1000,
      },
      baselinesByUrl: {
        [pageUrls.normal]: fixtures.normal,
        [pageUrls.text]: fixtures.text,
        [pageUrls.link]: fixtures.link,
        [pageUrls.defacement]: fixtures.normal,
      },
    }),
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.pages.length, 4);

  const pagesByUrl = new Map(
    payload.data.pages.map((page) => [page.url, page]),
  );
  const textPage = pagesByUrl.get(pageUrls.text);
  const linkPage = pagesByUrl.get(pageUrls.link);
  const changedPage = pagesByUrl.get(pageUrls.defacement);

  assert.equal(textPage.crawl.success, true);
  assert.equal(textPage.textDetection.success, true);
  assert.equal(textPage.textDetection.data.detected, true);
  assert.equal(textPage.textDetection.data.categories[0].category, "gambling");

  assert.equal(linkPage.linkDetection.success, true);
  assert.equal(linkPage.linkDetection.data.detected, true);
  assert.equal(linkPage.linkDetection.data.links.length, 1);
  assert.equal(
    linkPage.linkDetection.data.links[0].url,
    "https://example.com/login?next=https://evil.example/path",
  );
  assert.equal(
    linkPage.linkDetection.data.links[0].indicators[0].type,
    "external_redirect_parameter",
  );

  assert.equal(changedPage.defacementDetection.success, true);
  assert.equal(changedPage.defacementDetection.data.detected, true);
  assert.ok(changedPage.defacementDetection.data.indicators.length > 0);

  const saved = dataAccess.scans.findRecent(10);
  assert.equal(saved.length, 4);
  const persistedTextPage = dataAccess.scans.findById(textPage.id);
  assert.equal(persistedTextPage.url, pageUrls.text);
  assert.equal(persistedTextPage.crawlStatus, "success");
  assert.equal(persistedTextPage.httpStatus, 200);
  assert.equal(persistedTextPage.contentType, "text/html");
  assert.equal(persistedTextPage.textDetectionStatus, "success");
  assert.equal(persistedTextPage.textDetection.data.detected, true);
  assert.equal(persistedTextPage.defacementDetectionStatus, "success");
  assert.equal(persistedTextPage.linkDetectionStatus, "success");
  assert.deepEqual(persistedTextPage.crawlMetadata.links, []);

  const recentResponse = await fetch(
    `${aggregatorUrl}/api/v1/scans/recent?limit=4`,
  );
  const recentPayload = await recentResponse.json();
  assert.equal(recentResponse.status, 200);
  assert.equal(recentPayload.data.scans.length, 4);

  const detailResponse = await fetch(
    `${aggregatorUrl}/api/v1/scans/${textPage.id}`,
  );
  const detailPayload = await detailResponse.json();
  assert.equal(detailResponse.status, 200);
  assert.deepEqual(detailPayload.data.scan, persistedTextPage);
});

test("missing page baseline is explicit skipped status, not a false detector result", async () => {
  const response = await fetch(`${aggregatorUrl}/api/v1/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      crawler: {
        startUrl: pageUrls.text,
        allowedHosts: ["127.0.0.1"],
        maxDepth: 0,
        maxPages: 1,
        requestDelayMs: 0,
        requestTimeoutMs: 1000,
      },
      baselinesByUrl: {},
    }),
  });
  const payload = await response.json();
  const page = payload.data.pages[0];
  const saved = dataAccess.scans.findById(page.id);

  assert.equal(page.textDetection.data.detected, true);
  assert.equal(page.defacementDetection.success, false);
  assert.equal(page.defacementDetection.error.code, "BASELINE_NOT_PROVIDED");
  assert.equal(saved.defacementDetectionStatus, "skipped");
  assert.equal(saved.defacementDetection, null);
});

async function runScanWithMockFailure(serviceName, mode, timeoutMs = 1000) {
  const pageUrl = serviceName === "linkDetection" ? pageUrls.link : pageUrls.text;
  const mockServer = http.createServer((_request, response) => {
    if (mode === "timeout") {
      setTimeout(() => {
        if (!response.destroyed) {
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end(
            JSON.stringify({
              success: true,
              data: { detected: false, indicators: [], categories: [] },
            }),
          );
        }
      }, 200);
      return;
    }

    response.writeHead(500, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({ success: false, error: { code: "TEST_FAILURE" } }),
    );
  });
  const mockUrl = await listen(mockServer);
  const overriddenConfig = {
    ...config,
    services: {
      ...config.services,
      [serviceName]: { url: mockUrl, timeoutMs },
    },
  };
  const aggregatorServer = createAggregatorApp({
    config: overriddenConfig,
    dataAccess,
    logger,
  }).listen(0, "127.0.0.1");
  await once(aggregatorServer, "listening");

  try {
    const response = await fetch(
      `http://127.0.0.1:${aggregatorServer.address().port}/api/v1/scan`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crawler: {
            startUrl: pageUrl,
            allowedHosts: ["127.0.0.1"],
            maxDepth: 0,
            maxPages: 1,
            requestDelayMs: 0,
            requestTimeoutMs: 1000,
          },
          baselinesByUrl: {
            [pageUrl]:
              serviceName === "linkDetection" ? fixtures.link : fixtures.text,
          },
        }),
      },
    );
    return { response, payload: await response.json() };
  } finally {
    await closeServer(aggregatorServer);
    await closeServer(mockServer);
  }
}

test("Text Detection timeout stays a detector error and preserves other results in SQLite", async () => {
  const { response, payload } = await runScanWithMockFailure(
    "textDetection",
    "timeout",
    30,
  );
  const page = payload.data.pages[0];
  const saved = dataAccess.scans.findById(page.id);

  assert.equal(response.status, 200);
  assert.equal(page.textDetection.success, false);
  assert.equal(page.textDetection.error.code, "SERVICE_TIMEOUT");
  assert.equal(Object.hasOwn(page.textDetection, "data"), false);
  assert.equal(page.defacementDetection.success, true);
  assert.equal(page.linkDetection.success, true);
  assert.equal(saved.textDetectionStatus, "failed");
  assert.equal(saved.defacementDetectionStatus, "success");
  assert.equal(saved.linkDetectionStatus, "success");
});

test("Defacement failure is stored separately from successful text detection", async () => {
  const { response, payload } = await runScanWithMockFailure(
    "defacement",
    "failure",
  );
  const page = payload.data.pages[0];
  const saved = dataAccess.scans.findById(page.id);

  assert.equal(response.status, 200);
  assert.equal(page.defacementDetection.success, false);
  assert.equal(page.defacementDetection.error.code, "SERVICE_UNAVAILABLE");
  assert.equal(page.textDetection.data.detected, true);
  assert.equal(saved.defacementDetectionStatus, "failed");
  assert.equal(saved.textDetectionStatus, "success");
});

test("Link Detection failure does not change text or defacement results", async () => {
  const { response, payload } = await runScanWithMockFailure(
    "linkDetection",
    "failure",
  );
  const page = payload.data.pages[0];
  const saved = dataAccess.scans.findById(page.id);

  assert.equal(response.status, 200);
  assert.equal(page.linkDetection.success, true);
  assert.equal(page.linkDetection.data.detected, false);
  assert.equal(page.linkDetection.data.links[0].success, false);
  assert.equal(
    page.linkDetection.data.links[0].error.code,
    "SERVICE_UNAVAILABLE",
  );
  assert.equal(page.textDetection.success, true);
  assert.equal(page.defacementDetection.success, true);
  assert.equal(saved.linkDetectionStatus, "success");
});

test("database failure returns HTTP 500 and never claims a completed scan", async () => {
  const brokenAccess = {
    scans: {
      createMany() {
        throw new DataAccessError(
          "Could not create scan records.",
          new Error("SQL /private/database/path"),
        );
      },
    },
  };
  const failingAggregator = createAggregatorApp({
    config,
    dataAccess: brokenAccess,
    logger,
  }).listen(0, "127.0.0.1");
  await once(failingAggregator, "listening");

  try {
    const response = await fetch(
      `http://127.0.0.1:${failingAggregator.address().port}/api/v1/scan`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crawler: {
            startUrl: pageUrls.text,
            allowedHosts: ["127.0.0.1"],
            maxDepth: 0,
            maxPages: 1,
            requestDelayMs: 0,
            requestTimeoutMs: 1000,
          },
          baselinesByUrl: { [pageUrls.text]: fixtures.text },
        }),
      },
    );
    const payload = await response.json();

    assert.equal(response.status, 500);
    assert.deepEqual(payload, {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan internal." },
    });
    assert.equal(JSON.stringify(payload).includes("database/path"), false);
    assert.equal(dataAccess.scans.findRecent().length, 0);
  } finally {
    await closeServer(failingAggregator);
  }
});
