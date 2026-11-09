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
const { hashPassword } = require("../src/services/auth-service");

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
let sessionCookie;

const testAuth = {
  authenticate: () => ({ username: "test-admin" }),
};

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

function fetchWithSession(pathname, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (sessionCookie) headers.Cookie = sessionCookie;
  return fetch(`${aggregatorUrl}${pathname}`, { ...options, headers });
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
    ADMIN_USERNAME: "test-admin",
    ADMIN_PASSWORD_HASH: hashPassword(
      "test-admin-password",
      Buffer.alloc(16, 1),
    ),
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
  dataAccess.database.exec("DELETE FROM sites");
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

test("API membutuhkan sesi Admin dan cookie sesi tidak dapat dibaca JavaScript", async () => {
  const unauthenticated = await fetchWithSession(
    "/api/v1/scans/recent?limit=1",
  );
  assert.equal(unauthenticated.status, 401);

  const invalidLogin = await fetch(`${aggregatorUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "test-admin",
      password: "kata-sandi-salah",
    }),
  });
  assert.equal(invalidLogin.status, 401);
  assert.equal((await invalidLogin.json()).error.code, "INVALID_CREDENTIALS");

  const login = await fetch(`${aggregatorUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "test-admin",
      password: "test-admin-password",
    }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie");
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Strict/i);
  sessionCookie = cookie.split(";")[0];

  const session = await fetchWithSession("/api/v1/auth/session");
  assert.deepEqual((await session.json()).data, {
    authenticated: true,
    username: "test-admin",
  });

  const logout = await fetchWithSession("/api/v1/auth/logout", {
    method: "POST",
  });
  assert.equal(logout.status, 200);
  const staleCookie = sessionCookie;
  sessionCookie = null;
  const afterLogout = await fetch(`${aggregatorUrl}/api/v1/scans/recent`, {
    headers: { Cookie: staleCookie },
  });
  assert.equal(afterLogout.status, 401);

  const nextLogin = await fetch(`${aggregatorUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "test-admin",
      password: "test-admin-password",
    }),
  });
  sessionCookie = nextLogin.headers.get("set-cookie").split(";")[0];
});

test("GET /api/v1/sites memerlukan autentikasi sesi Admin", async () => {
  // 1. Tanpa sesi -> 401 UNAUTHORIZED
  const unauthenticated = await fetch(`${aggregatorUrl}/api/v1/sites`);
  assert.equal(unauthenticated.status, 401);
  const unauthPayload = await unauthenticated.json();
  assert.equal(unauthPayload.success, false);
  assert.equal(unauthPayload.error.code, "UNAUTHORIZED");
  assert.equal(unauthPayload.error.message, "Silakan login sebagai Admin.");

  // Percobaan POST tanpa sesi juga harus ditolak 401
  const unauthPost = await fetch(`${aggregatorUrl}/api/v1/sites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Situs Liar", url: "https://evil.example" }),
  });
  assert.equal(unauthPost.status, 401);

  // 2. Buat data situs di database
  const site = dataAccess.sites.create({
    name: "Situs Uji Keamanan",
    url: pageUrls.normal,
    allowedHost: "127.0.0.1",
    status: "active",
    maxDepth: 1,
    maxPages: 5,
    baselineHtml: "<html>Acuan Rahasia</html>",
  });

  // 3. Login untuk mendapatkan sesi valid
  const login = await fetch(`${aggregatorUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "test-admin",
      password: "test-admin-password",
    }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie").split(";")[0];

  // 4. Dengan sesi valid -> 200 OK dan mengembalikan daftar situs yang tersimpan
  const authenticated = await fetch(`${aggregatorUrl}/api/v1/sites`, {
    headers: { Cookie: cookie },
  });
  assert.equal(authenticated.status, 200);
  const authPayload = await authenticated.json();
  assert.equal(authPayload.success, true);
  assert.ok(Array.isArray(authPayload.data.sites));
  const found = authPayload.data.sites.find((s) => s.id === site.id);
  assert.ok(found);
  assert.equal(found.name, "Situs Uji Keamanan");
  assert.equal(found.baselineHtml, "<html>Acuan Rahasia</html>");
});

test("DELETE scan riwayat dilindungi autentikasi dan menghapus record terpilih", async () => {
  const login = await fetch(`${aggregatorUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "test-admin",
      password: "test-admin-password",
    }),
  });
  assert.equal(login.status, 200);
  sessionCookie = login.headers.get("set-cookie").split(";")[0];

  const saved = dataAccess.scans.create({
    url: pageUrls.normal,
    scannedAt: "2026-10-01T12:00:00.000Z",
    crawlStatus: "success",
  });

  const unauthorizedDelete = await fetch(
    `${aggregatorUrl}/api/v1/scans/${saved.id}`,
    { method: "DELETE" },
  );
  assert.equal(unauthorizedDelete.status, 401);
  assert.notEqual(dataAccess.scans.findById(saved.id), null);

  const deleted = await fetchWithSession(`/api/v1/scans/${saved.id}`, {
    method: "DELETE",
  });
  assert.equal(deleted.status, 200);
  assert.deepEqual((await deleted.json()).data, { deleted: true });

  const recent = await fetchWithSession("/api/v1/scans/recent");
  assert.deepEqual((await recent.json()).data.scans, []);
  const detail = await fetchWithSession(`/api/v1/scans/${saved.id}`);
  assert.equal(detail.status, 404);

  const missingDelete = await fetchWithSession(
    `/api/v1/scans/${saved.id}`,
    { method: "DELETE" },
  );
  assert.equal(missingDelete.status, 404);
  const invalidDelete = await fetchWithSession(
    `/api/v1/scans/${encodeURIComponent("invalid/id")}`,
    { method: "DELETE" },
  );
  assert.equal(invalidDelete.status, 400);
});

test("end-to-end scan crawls fixtures, calls detectors, aggregates, and persists each page", async () => {
  const response = await fetchWithSession("/api/v1/scan", {
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

  const recentResponse = await fetchWithSession("/api/v1/scans/recent?limit=4");
  const recentPayload = await recentResponse.json();
  assert.equal(recentResponse.status, 200);
  assert.equal(recentPayload.data.scans.length, 4);

  const detailResponse = await fetchWithSession(`/api/v1/scans/${textPage.id}`);
  const detailPayload = await detailResponse.json();
  assert.equal(detailResponse.status, 200);
  assert.deepEqual(detailPayload.data.scan, persistedTextPage);
});

test("missing page baseline is explicit skipped status, not a false detector result", async () => {
  const response = await fetchWithSession("/api/v1/scan", {
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
    auth: testAuth,
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
    auth: testAuth,
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
