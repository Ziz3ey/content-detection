const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { mkdtemp, rm, writeFile } = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { after, before, beforeEach, test } = require("node:test");
const { once } = require("node:events");
const { crawl, loadTextDetectionConfig } = require("../src");

const detectionRequests = [];
const quietLogger = { info() {}, warn() {}, error() {} };
let websiteServer;
let detectionMockServer;
let websiteUrl;
let detectionMockUrl;
let detectionMode;

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body));
}

async function readRequestJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function handleDetectionRequest(request, response) {
  if (request.method !== "POST" || request.url !== "/api/v1/detect") {
    sendJson(response, 404, { error: "not found" });
    return;
  }

  readRequestJson(request)
    .then((body) => {
      detectionRequests.push(body);
      const requestNumber = detectionRequests.length;

      if (
        detectionMode === "http-500" ||
        (detectionMode === "first-500" && requestNumber === 1)
      ) {
        sendJson(response, 500, { success: false });
        return;
      }

      if (detectionMode === "malformed-json") {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end("{not valid json");
        return;
      }

      if (detectionMode === "malformed-shape") {
        sendJson(response, 200, {
          success: true,
          data: { detected: "yes", categories: [] },
        });
        return;
      }

      if (detectionMode === "slow-first" && requestNumber === 1) {
        setTimeout(() => {
          if (!response.destroyed) {
            sendJson(response, 200, {
              success: true,
              data: { detected: false, categories: [] },
            });
          }
        }, 250);
        return;
      }

      if (
        detectionMode === "detected" ||
        (detectionMode === "first-500" && requestNumber > 1)
      ) {
        sendJson(response, 200, {
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
        });
        return;
      }

      sendJson(response, 200, {
        success: true,
        data: { detected: false, categories: [] },
      });
    })
    .catch(() => {
      sendJson(response, 400, { success: false });
    });
}

async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return `http://127.0.0.1:${server.address().port}`;
}

async function stopServer(server) {
  if (!server.listening) {
    return;
  }
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function reservePort() {
  const probe = http.createServer();
  const url = await listen(probe);
  const port = new URL(url).port;
  await stopServer(probe);
  return port;
}

async function runFixtureCrawl(options = {}) {
  return crawl(
    {
      startUrl: `${websiteUrl}${options.startPath || "/page"}`,
      allowedHosts: ["127.0.0.1"],
      maxDepth: options.maxDepth ?? 0,
      maxPages: options.maxPages ?? 5,
      requestDelayMs: 0,
      requestTimeoutMs: 500,
    },
    {
      logger: quietLogger,
      textDetectionConfig: {
        url: options.detectionUrl || detectionMockUrl,
        timeoutMs: options.timeoutMs ?? 500,
        maxRetries: options.maxRetries ?? 0,
      },
    },
  );
}

async function findFreeTextDetectionPort() {
  return reservePort();
}

async function waitForTextDetectionService(child, url) {
  const deadline = Date.now() + 7000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error("Text Detection Service exited before becoming ready.");
    }

    try {
      const response = await fetch(`${url}/health`, {
        signal: AbortSignal.timeout(300),
      });
      if (response.status === 200) {
        return;
      }
    } catch {
      // The service may still be starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error("Text Detection Service did not become ready in time.");
}

function runCrawlerCli(configPath, environment) {
  const crawlerDirectory = path.resolve(__dirname, "..");
  const cliPath = path.join(crawlerDirectory, "src", "cli.js");
  const child = spawn(process.execPath, [cliPath, configPath], {
    cwd: crawlerDirectory,
    env: { ...process.env, ...environment },
    stdio: ["ignore", "pipe", "pipe"],
  });

  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.setEncoding("utf8").on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", reject);
    child.once("exit", (exitCode) => resolve({ exitCode, stdout, stderr }));
  });
}

before(async () => {
  websiteServer = http.createServer((request, response) => {
    if (request.url === "/robots.txt") {
      response.writeHead(200, { "Content-Type": "text/plain" });
      response.end("User-agent: *\nAllow: /");
      return;
    }

   const html =
  request.url === "/second"
    ? "<title>Second Fixture</title><p>beta</p>"
    : request.url === "/page"
      ? '<html><head><title>Integration Fixture</title></head><body><p>judi online</p><a href="/second">Next</a></body></html>'
      : '<html><head><title>Integration Fixture</title></head><body><p>alpha</p><a href="/second">Next</a></body></html>';
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(html);
  });
  websiteUrl = await listen(websiteServer);

  detectionMockServer = http.createServer(handleDetectionRequest);
  detectionMockUrl = await listen(detectionMockServer);
});

beforeEach(() => {
  detectionRequests.length = 0;
  detectionMode = "false";
});

after(async () => {
  await stopServer(detectionMockServer);
  await stopServer(websiteServer);
});

test("posts extracted text and preserves a detected=false response", async () => {
  const pages = await runFixtureCrawl();

  assert.equal(pages[0].text, "judi online Next");
assert.deepEqual(detectionRequests, [{ text: "judi online Next" }]);
  assert.deepEqual(pages[0].detection, {
    success: true,
    data: { detected: false, categories: [] },
  });
  assert.deepEqual(pages[0].crawl, {
    status: 200,
    contentType: "text/html",
    title: "Integration Fixture",
  });
});

test("passes through detected categories and matches unchanged", async () => {
  detectionMode = "detected";
  const pages = await runFixtureCrawl();

  assert.equal(pages[0].detection.success, true);
  assert.deepEqual(pages[0].detection.data, {
    detected: true,
    categories: [
      {
        category: "gambling",
        matches: [{ pattern: "alpha", start: 0, end: 4 }],
      },
    ],
  });
});

test("maps an unavailable Text Detection Service to a page-level error", async () => {
  const unavailablePort = await findFreeTextDetectionPort();
  const pages = await runFixtureCrawl({
    detectionUrl: `http://127.0.0.1:${unavailablePort}`,
  });

  assert.equal(pages[0].success, true);
  assert.deepEqual(pages[0].detection, {
    success: false,
    error: {
      code: "TEXT_DETECTION_UNAVAILABLE",
      message: "Text Detection Service is unavailable.",
    },
  });
});

test("maps Text Detection timeout and continues to the next page", async () => {
  detectionMode = "slow-first";
  const pages = await runFixtureCrawl({ maxDepth: 1, timeoutMs: 80 });

  assert.equal(pages.length, 2);
  assert.equal(pages[0].detection.success, false);
  assert.equal(pages[0].detection.error.code, "TEXT_DETECTION_TIMEOUT");
  assert.equal(pages[1].url, `${websiteUrl}/second`);
  assert.equal(pages[1].detection.success, true);
    assert.deepEqual(detectionRequests, [
    { text: "judi online Next" },
    { text: "beta" },
  ]);
});

test("handles HTTP 500 without failing the crawl", async () => {
  detectionMode = "http-500";
  const pages = await runFixtureCrawl();

  assert.equal(pages[0].success, true);
  assert.equal(pages[0].detection.success, false);
  assert.equal(pages[0].detection.error.code, "TEXT_DETECTION_HTTP_ERROR");
  assert.equal(detectionRequests.length, 1);
});

test("handles malformed JSON and malformed response shapes", async () => {
  detectionMode = "malformed-json";
  const malformedJsonPages = await runFixtureCrawl();
  assert.equal(
    malformedJsonPages[0].detection.error.code,
    "TEXT_DETECTION_INVALID_RESPONSE",
  );

  detectionRequests.length = 0;
  detectionMode = "malformed-shape";
  const malformedShapePages = await runFixtureCrawl();
  assert.equal(
    malformedShapePages[0].detection.error.code,
    "TEXT_DETECTION_INVALID_RESPONSE",
  );
});

test("retries a transient HTTP 500 only up to the configured retry count", async () => {
  detectionMode = "first-500";
  const pages = await runFixtureCrawl({ maxRetries: 1 });

  assert.equal(detectionRequests.length, 2);
  assert.equal(pages[0].detection.success, true);
  assert.equal(pages[0].detection.data.detected, true);
});

test("continues processing pages after one detection error", async () => {
  detectionMode = "first-500";
  const pages = await runFixtureCrawl({ maxDepth: 1, maxRetries: 0 });

  assert.equal(pages.length, 2);
  assert.equal(pages[0].detection.success, false);
  assert.equal(pages[1].detection.success, true);
  assert.equal(pages[1].detection.data.detected, true);
});

test("loads endpoint, timeout, and retry settings from environment configuration", () => {
  assert.deepEqual(
    loadTextDetectionConfig({
      TEXT_DETECTION_URL: "http://127.0.0.1:4321/",
      TEXT_DETECTION_TIMEOUT_MS: "2500",
      TEXT_DETECTION_MAX_RETRIES: "2",
    }),
    {
      url: "http://127.0.0.1:4321",
      timeoutMs: 2500,
      maxRetries: 2,
    },
  );
});

test("end-to-end: local crawler sends fixture text to the real Text Detection Service", async () => {
  const port = await findFreeTextDetectionPort();
  const textDetectionUrl = `http://127.0.0.1:${port}`;
  const textDetectionDirectory = path.resolve(
    __dirname,
    "../../text-detection-service",
  );
  const serverScript = path.join(textDetectionDirectory, "src", "server.js");
  const temporaryDirectory = await mkdtemp(
    path.join(os.tmpdir(), "crawler-e2e-"),
  );
  const configPath = path.join(temporaryDirectory, "crawler-config.json");
  const textDetectionProcess = spawn(process.execPath, [serverScript], {
    cwd: textDetectionDirectory,
    env: { ...process.env, PORT: String(port) },
    stdio: "ignore",
  });

  try {
    await waitForTextDetectionService(textDetectionProcess, textDetectionUrl);
    await writeFile(
      configPath,
      JSON.stringify({
        startUrl: `${websiteUrl}/page`,
        allowedHosts: ["127.0.0.1"],
        maxDepth: 0,
        maxPages: 1,
        requestDelayMs: 0,
        requestTimeoutMs: 1000,
      }),
    );
    const result = await runCrawlerCli(configPath, {
      TEXT_DETECTION_URL: textDetectionUrl,
      TEXT_DETECTION_TIMEOUT_MS: "1000",
      TEXT_DETECTION_MAX_RETRIES: "0",
    });
    const pages = JSON.parse(result.stdout);

        assert.equal(result.exitCode, 0, result.stderr);
    assert.equal(pages[0].text, "judi online Next");
    assert.equal(pages[0].detection.success, true);
    assert.equal(pages[0].detection.data.detected, true);
    assert.deepEqual(pages[0].detection.data.categories, [
      {
        category: "gambling",
        matches: [
          { pattern: "judi", start: 0, end: 3 },
          { pattern: "judi online", start: 0, end: 10 },
        ],
      },
    ]);
  } finally {
    if (
      textDetectionProcess.exitCode === null &&
      textDetectionProcess.signalCode === null
    ) {
      const exited = once(textDetectionProcess, "exit");
      textDetectionProcess.kill();
      await exited;
    }
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
