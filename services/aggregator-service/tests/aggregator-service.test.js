const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, before, test } = require("node:test");
const { once } = require("node:events");
const { createApp } = require("../src/app");
const { loadAggregatorConfig } = require("../src/config/aggregator-config");
const { createDataAccess } = require("content-detection-data-access");

const modes = {
  textDetection: "success",
  defacement: "success",
  linkDetection: "success",
};
const requests = {
  textDetection: [],
  defacement: [],
  linkDetection: [],
};
const linkRequestModes = new Map();
const logger = { info() {}, warn() {}, error() {} };
const testAuth = {
  authenticate: () => ({ username: "test-admin" }),
  authenticateCredentials: () => true,
  createSession: () => ({
    token: "a".repeat(64),
    cookie: "content_detection_session=test",
  }),
  revokeSession() {},
  clearCookie: "content_detection_session=; Max-Age=0",
};
let downstreamServers;
let aggregatorServer;
let config;
let baseUrl;
let testDirectory;
let dataAccess;

async function readRequestJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function responseFor(serviceName, body) {
  if (serviceName === "textDetection") {
    return {
      success: true,
      data: {
        detected: true,
        categories: [
          {
            category: "gambling",
            matches: [{ pattern: "alpha", start: 0, end: 4 }],
          },
        ],
      },
    };
  }

  if (serviceName === "defacement") {
    return {
      success: true,
      data: {
        detected: false,
        indicators: [],
      },
    };
  }

  return {
    success: true,
    data: {
      detected: body?.url.includes("/login?") || false,
      indicators: body?.url.includes("/login?")
        ? [
            {
              type: "external_redirect_parameter",
              description: "URL contains an external redirect parameter.",
            },
          ]
        : [],
    },
  };
}

function aggregatedLinkResponse(urls) {
  const links = urls.map((url) => ({
    url,
    ...responseFor("linkDetection", { url }).data,
  }));
  return {
    success: true,
    data: {
      detected: links.some((link) => link.detected),
      links,
    },
  };
}

function createDownstreamServer(serviceName, endpoint) {
  return http.createServer((request, response) => {
    if (request.method !== "POST" || request.url !== endpoint) {
      response.writeHead(404);
      response.end();
      return;
    }

    readRequestJson(request)
      .then((body) => {
        requests[serviceName].push(body);
        const mode =
          serviceName === "linkDetection"
            ? linkRequestModes.get(body.url) || modes[serviceName]
            : modes[serviceName];

        if (mode === "failure") {
          response.writeHead(500, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ success: false }));
          return;
        }

        if (mode === "malformed-json") {
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end("{malformed");
          return;
        }

        if (mode === "malformed-shape") {
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end(
            JSON.stringify({ success: true, data: { detected: "yes" } }),
          );
          return;
        }

        if (mode === "timeout") {
          setTimeout(() => {
            if (!response.destroyed) {
              response.writeHead(200, { "Content-Type": "application/json" });
              response.end(JSON.stringify(responseFor(serviceName, body)));
            }
          }, 150);
          return;
        }

        response.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
        });
        response.end(JSON.stringify(responseFor(serviceName, body)));
      })
      .catch(() => {
        response.writeHead(400);
        response.end();
      });
  });
}

async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return `http://127.0.0.1:${server.address().port}`;
}

async function closeServer(server) {
  if (!server.listening) {
    return;
  }
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function resetMocks() {
  for (const serviceName of Object.keys(modes)) {
    modes[serviceName] = "success";
    requests[serviceName].length = 0;
  }
  linkRequestModes.clear();
}

async function postAnalyze(body) {
  return fetch(`${baseUrl}/api/v1/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validInput = {
  url: "https://192.0.2.10/example",
  text: "alpha is a test fixture",
  html: "<title>Current</title><p>alpha</p>",
  links: [
    "https://example.com/about",
    "https://example.com/login?next=https://evil.example/path",
    "https://example.com/contact",
  ],
  baseline: { html: "<title>Baseline</title><p>baseline</p>" },
};

before(async () => {
  testDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "aggregator-service-tests-"),
  );
  const definitions = [
    ["textDetection", "/api/v1/detect"],
    ["defacement", "/api/v1/detect"],
    ["linkDetection", "/api/v1/detect"],
  ];
  downstreamServers = {};
  const serviceUrls = {};

  for (const [serviceName, endpoint] of definitions) {
    downstreamServers[serviceName] = createDownstreamServer(
      serviceName,
      endpoint,
    );
    serviceUrls[serviceName] = await listen(downstreamServers[serviceName]);
  }

  config = loadAggregatorConfig({
    DATABASE_PATH: path.join(testDirectory, "aggregator-tests.sqlite"),
    TEXT_DETECTION_URL: serviceUrls.textDetection,
    TEXT_DETECTION_TIMEOUT_MS: "500",
    DEFACEMENT_SERVICE_URL: serviceUrls.defacement,
    DEFACEMENT_SERVICE_TIMEOUT_MS: "500",
    LINK_DETECTION_SERVICE_URL: serviceUrls.linkDetection,
    LINK_DETECTION_SERVICE_TIMEOUT_MS: "500",
    ADMIN_USERNAME: "test-admin",
    ADMIN_PASSWORD_HASH: `scrypt$${"a".repeat(32)}$${"b".repeat(128)}`,
  });
  dataAccess = createDataAccess(config.databasePath);

  const running = createApp({ config, logger, dataAccess, auth: testAuth }).listen(
    0,
    "127.0.0.1",
  );
  await once(running, "listening");
  aggregatorServer = running;
  baseUrl = `http://127.0.0.1:${running.address().port}`;
});

after(async () => {
  await closeServer(aggregatorServer);
  await Promise.all(Object.values(downstreamServers).map(closeServer));
  dataAccess.close();
  fs.rmSync(testDirectory, { recursive: true, force: true });
});

test("GET /health stays healthy without checking downstream services", async () => {
  modes.textDetection = "failure";
  modes.defacement = "failure";
  modes.linkDetection = "failure";
  const response = await fetch(`${baseUrl}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    service: "aggregator-service",
    status: "ok",
  });
  assert.deepEqual(requests.textDetection, []);
  assert.deepEqual(requests.defacement, []);
  assert.deepEqual(requests.linkDetection, []);
});

test("allows the configured dashboard origin and preflights JSON API requests", async () => {
  const origin = "http://localhost:5173";
  const preflight = await fetch(`${baseUrl}/api/v1/scan`, {
    method: "OPTIONS",
    headers: {
      Origin: origin,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });

  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), origin);
  assert.equal(
    preflight.headers.get("access-control-allow-credentials"),
    "true",
  );
  assert.equal(
    preflight.headers.get("access-control-allow-methods"),
    "GET, POST, DELETE, OPTIONS",
  );
  assert.equal(
    preflight.headers.get("access-control-allow-headers"),
    "Content-Type",
  );

  const dashboardHealth = await fetch(`${baseUrl}/health`, {
    headers: { Origin: origin },
  });
  assert.equal(
    dashboardHealth.headers.get("access-control-allow-origin"),
    origin,
  );

  const otherOrigin = await fetch(`${baseUrl}/health`, {
    headers: { Origin: "http://other.example" },
  });
  assert.equal(otherOrigin.status, 200);
  assert.equal(otherOrigin.headers.get("access-control-allow-origin"), null);
});

test("analyzes every href and preserves the three downstream responses", async () => {
  resetMocks();
  const response = await postAnalyze(validInput);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.url, validInput.url);
  assert.deepEqual(payload.data.textDetection, responseFor("textDetection"));
  assert.deepEqual(payload.data.defacementDetection, responseFor("defacement"));
  assert.deepEqual(
    payload.data.linkDetection,
    aggregatedLinkResponse(validInput.links),
  );
  assert.deepEqual(requests.textDetection, [{ text: validInput.text }]);
  assert.deepEqual(requests.defacement, [
    { html: validInput.html, baseline: validInput.baseline },
  ]);
  assert.equal(requests.linkDetection.length, 3);
  assert.deepEqual(
    requests.linkDetection.map((request) => request.url).sort(),
    [...validInput.links].sort(),
  );
});

test("empty or missing href lists return an empty result without requests", async () => {
  const inputs = [
    { ...validInput, links: [] },
    Object.fromEntries(
      Object.entries(validInput).filter(([key]) => key !== "links"),
    ),
  ];

  for (const input of inputs) {
    resetMocks();
    const response = await postAnalyze(input);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload.data.linkDetection, {
      success: true,
      data: { detected: false, links: [] },
    });
    assert.deepEqual(requests.linkDetection, []);
  }
});

test("a failed href does not erase successful Link Detection results", async () => {
  resetMocks();
  linkRequestModes.set(validInput.links[1], "failure");
  const response = await postAnalyze(validInput);
  const payload = await response.json();
  const results = payload.data.linkDetection.data.links;

  assert.equal(response.status, 200);
  assert.equal(requests.linkDetection.length, 3);
  assert.equal(results[0].detected, false);
  assert.equal(results[1].success, false);
  assert.equal(results[1].error.code, "SERVICE_UNAVAILABLE");
  assert.equal(results[2].detected, false);
  assert.equal(payload.data.linkDetection.data.detected, false);
});

test("rejects empty body, invalid URL, non-HTTP scheme, and non-string text", async () => {
  const invalidInputs = [
    undefined,
    { ...validInput, url: "not a URL" },
    { ...validInput, url: "javascript:alert(1)" },
    { ...validInput, url: 12 },
    { ...validInput, text: true },
  ];

  for (const input of invalidInputs) {
    const response =
      input === undefined
        ? await fetch(`${baseUrl}/api/v1/analyze`, { method: "POST" })
        : await postAnalyze(input);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.error.code, "INVALID_INPUT");
  }
});

test("Text Detection failure does not erase successful Link Detection", async () => {
  resetMocks();
  modes.textDetection = "failure";
  const response = await postAnalyze(validInput);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.data.textDetection.success, false);
  assert.equal(payload.data.textDetection.error.code, "SERVICE_UNAVAILABLE");
  assert.deepEqual(
    payload.data.linkDetection,
    aggregatedLinkResponse(validInput.links),
  );
  assert.equal(Object.hasOwn(payload.data.textDetection, "data"), false);
});

test("Defacement failure does not become detected=false in another result", async () => {
  resetMocks();
  modes.defacement = "failure";
  const response = await postAnalyze(validInput);
  const payload = await response.json();

  assert.equal(payload.data.defacementDetection.success, false);
  assert.equal(
    payload.data.defacementDetection.error.code,
    "SERVICE_UNAVAILABLE",
  );
  assert.deepEqual(payload.data.textDetection, responseFor("textDetection"));
  assert.notEqual(payload.data.textDetection.data.detected, false);
});

test("Link Detection failure leaves other service results intact", async () => {
  resetMocks();
  modes.linkDetection = "failure";
  const response = await postAnalyze(validInput);
  const payload = await response.json();

  assert.equal(payload.data.linkDetection.success, true);
  assert.ok(
    payload.data.linkDetection.data.links.every(
      (link) => link.success === false,
    ),
  );
  assert.deepEqual(payload.data.textDetection, responseFor("textDetection"));
  assert.deepEqual(payload.data.defacementDetection, responseFor("defacement"));
});

test("preserves partial results when two downstream services fail", async () => {
  resetMocks();
  modes.textDetection = "failure";
  modes.defacement = "failure";
  const response = await postAnalyze(validInput);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.data.textDetection.success, false);
  assert.equal(payload.data.defacementDetection.success, false);
  assert.deepEqual(
    payload.data.linkDetection,
    aggregatedLinkResponse(validInput.links),
  );
});

test("returns explicit per-service errors when all downstream services fail", async () => {
  resetMocks();
  modes.textDetection = "failure";
  modes.defacement = "failure";
  modes.linkDetection = "failure";
  const response = await postAnalyze(validInput);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  for (const serviceName of ["textDetection", "defacementDetection"]) {
    assert.equal(payload.data[serviceName].success, false);
    assert.equal(payload.data[serviceName].error.code, "SERVICE_UNAVAILABLE");
    assert.equal(Object.hasOwn(payload.data[serviceName], "data"), false);
  }
  assert.equal(payload.data.linkDetection.success, true);
  assert.ok(
    payload.data.linkDetection.data.links.every(
      (link) => link.success === false,
    ),
  );
});

test("maps downstream timeout to a per-service timeout result", async () => {
  resetMocks();
  modes.defacement = "timeout";
  const timeoutConfig = {
    ...config,
    services: {
      ...config.services,
      defacement: { ...config.services.defacement, timeoutMs: 20 },
    },
  };
  const timeoutServer = createApp({
    config: timeoutConfig,
    logger,
    dataAccess,
    auth: testAuth,
  }).listen(0, "127.0.0.1");
  await once(timeoutServer, "listening");

  try {
    const response = await fetch(
      `http://127.0.0.1:${timeoutServer.address().port}/api/v1/analyze`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validInput),
      },
    );
    const payload = await response.json();

    assert.equal(payload.data.defacementDetection.success, false);
    assert.equal(
      payload.data.defacementDetection.error.code,
      "SERVICE_TIMEOUT",
    );
    assert.deepEqual(payload.data.textDetection, responseFor("textDetection"));
  } finally {
    await closeServer(timeoutServer);
  }
});

test("maps malformed and structurally invalid downstream responses to errors", async () => {
  resetMocks();
  modes.textDetection = "malformed-json";
  let response = await postAnalyze(validInput);
  let payload = await response.json();
  assert.equal(
    payload.data.textDetection.error.code,
    "INVALID_DOWNSTREAM_RESPONSE",
  );

  resetMocks();
  modes.linkDetection = "malformed-shape";
  response = await postAnalyze(validInput);
  payload = await response.json();
  assert.equal(payload.data.linkDetection.success, true);
  assert.ok(
    payload.data.linkDetection.data.links.every(
      (link) =>
        link.success === false &&
        link.error.code === "INVALID_DOWNSTREAM_RESPONSE",
    ),
  );
  assert.deepEqual(payload.data.textDetection, responseFor("textDetection"));
});

test("loads downstream URL and timeout configuration from environment", () => {
  const configured = loadAggregatorConfig({
    DASHBOARD_ORIGIN: "https://dashboard.example/",
    ADMIN_USERNAME: "test-admin",
    ADMIN_PASSWORD_HASH: `scrypt$${"a".repeat(32)}$${"b".repeat(128)}`,
    CRAWLER_SERVICE_URL: "http://127.0.0.1:4000",
    CRAWLER_TIMEOUT_MS: "1100",
    TEXT_DETECTION_URL: "http://127.0.0.1:4001",
    TEXT_DETECTION_TIMEOUT_MS: "1200",
    DEFACEMENT_SERVICE_URL: "http://127.0.0.1:4002",
    DEFACEMENT_SERVICE_TIMEOUT_MS: "2300",
    LINK_DETECTION_SERVICE_URL: "http://127.0.0.1:4003",
    LINK_DETECTION_SERVICE_TIMEOUT_MS: "3400",
  });

  assert.equal(configured.dashboardOrigin, "https://dashboard.example");
  assert.equal(configured.auth.username, "test-admin");
  assert.equal(configured.auth.secureCookie, false);
  assert.deepEqual(configured.services, {
    textDetection: { url: "http://127.0.0.1:4001", timeoutMs: 1200 },
    crawler: { url: "http://127.0.0.1:4000", timeoutMs: 1100 },
    defacement: { url: "http://127.0.0.1:4002", timeoutMs: 2300 },
    linkDetection: { url: "http://127.0.0.1:4003", timeoutMs: 3400 },
  });
});
