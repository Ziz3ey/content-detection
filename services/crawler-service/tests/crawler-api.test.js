const assert = require("node:assert/strict");
const http = require("node:http");
const { after, before, test } = require("node:test");
const { once } = require("node:events");
const { createApp } = require("../src/app");

const logger = { info() {}, warn() {}, error() {} };
let fixtureServer;
let crawlerServer;
let fixtureUrl;
let crawlerUrl;
let pageHtml;

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

before(async () => {
  pageHtml =
    '<html><title>Local Fixture</title><body><p>alpha fixture</p><a href="/next">Next</a></body></html>';
  fixtureServer = http.createServer((request, response) => {
    if (request.url === "/robots.txt") {
      response.writeHead(200, { "Content-Type": "text/plain" });
      response.end("User-agent: *\nAllow: /");
      return;
    }
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(pageHtml);
  });
  fixtureUrl = await listen(fixtureServer);
  crawlerServer = createApp({ logger }).listen(0, "127.0.0.1");
  await once(crawlerServer, "listening");
  crawlerUrl = `http://127.0.0.1:${crawlerServer.address().port}`;
});

after(async () => {
  await closeServer(crawlerServer);
  await closeServer(fixtureServer);
});

test("crawler health endpoint is available", async () => {
  const response = await fetch(`${crawlerUrl}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    service: "crawler-service",
    status: "ok",
  });
});

test("POST /api/v1/crawl returns parsed fields and raw HTML without calling Text Detection", async () => {
  const response = await fetch(`${crawlerUrl}/api/v1/crawl`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      startUrl: `${fixtureUrl}/page`,
      allowedHosts: ["127.0.0.1"],
      maxDepth: 0,
      maxPages: 1,
      requestDelayMs: 0,
      requestTimeoutMs: 500,
    }),
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.pages.length, 1);
  assert.equal(payload.data.pages[0].url, `${fixtureUrl}/page`);
  assert.equal(payload.data.pages[0].title, "Local Fixture");
  assert.equal(payload.data.pages[0].text, "alpha fixture Next");
  assert.equal(payload.data.pages[0].html, pageHtml);
  assert.deepEqual(payload.data.pages[0].links, [`${fixtureUrl}/next`]);
  assert.equal(Object.hasOwn(payload.data.pages[0], "detection"), false);
});

test("crawler API validates JSON and crawler configuration", async () => {
  const malformed = await fetch(`${crawlerUrl}/api/v1/crawl`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{bad json",
  });
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).error.code, "INVALID_JSON");

  const invalid = await fetch(`${crawlerUrl}/api/v1/crawl`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startUrl: "https://outside.invalid" }),
  });
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).error.code, "INVALID_CRAWL_CONFIG");
});
