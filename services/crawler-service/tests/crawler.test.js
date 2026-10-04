const assert = require("node:assert/strict");
const http = require("node:http");
const { after, before, beforeEach, test } = require("node:test");
const { once } = require("node:events");
const {
  crawl,
  isAllowedByRobots,
  isAllowedUrl,
  normalizeAllowedHost,
  normalizeUrl,
  parseHtml,
  parseRobotsTxt,
} = require("../src");
const { createRateLimitedFetch } = require("../src/fetcher/rate-limited-fetch");

const requestCounts = new Map();
const silentLogger = { error() {} };
const noDetectionClient = {
  async detect() {
    return { success: true, data: { detected: false, categories: [] } };
  },
};
let server;
let baseUrl;
let robotsStatus;
let robotsBody;

function incrementRequest(pathname) {
  requestCounts.set(pathname, (requestCounts.get(pathname) || 0) + 1);
}

function sendHtml(response, html) {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(html);
}

function handleRequest(request, response) {
  const { pathname } = new URL(request.url, baseUrl);
  incrementRequest(pathname);

  if (pathname === "/robots.txt") {
    response.writeHead(robotsStatus, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end(robotsStatus === 200 ? robotsBody : "robots unavailable");
    return;
  }

  if (pathname === "/redirect-external") {
    const redirectTarget = new URL("/redirect-target", baseUrl);
    redirectTarget.hostname = "localhost";
    response.writeHead(302, { Location: redirectTarget.href });
    response.end();
    return;
  }

  if (pathname === "/redirect-internal") {
    response.writeHead(302, { Location: "/destination" });
    response.end();
    return;
  }

  if (pathname === "/redirect-target") {
    sendHtml(response, "<title>Redirect target</title><body>Reached</body>");
    return;
  }

  if (pathname === "/non-html") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ html: "not a page" }));
    return;
  }

  if (pathname === "/fail") {
    response.writeHead(503, { "Content-Type": "text/plain" });
    response.end("temporarily unavailable");
    return;
  }

  if (pathname === "/timeout") {
    setTimeout(() => {
      if (!response.destroyed) {
        sendHtml(response, "<title>Late</title><body>Late response</body>");
      }
    }, 500);
    return;
  }

  const pages = {
    "/start": `
      <html><head><title>Local Fixture</title></head><body>
        <h1>Hello</h1><p>crawler text</p><script>not visible text</script>
        <a href="/about">About</a>
        <a href="/about#section">About fragment</a>
        <a href="/about/">About trailing slash</a>
        <a href="http://localhost:${new URL(baseUrl).port}/external-alias">External</a>
        <a href="mailto:research@example.invalid">Email</a>
      </body></html>`,
    "/duplicate":
      '<title>Duplicate links</title><a href="/dup">One</a><a href="/dup#part">Two</a><a href="/dup/">Three</a>',
    "/depth-root": '<title>Depth 0</title><a href="/depth-one">Next</a>',
    "/depth-one": '<title>Depth 1</title><a href="/depth-two">Next</a>',
    "/depth-two": "<title>Depth 2</title>",
    "/page-limit":
      '<title>Start</title><a href="/page-a">A</a><a href="/page-b">B</a>',
    "/failure-flow":
      '<title>Start</title><a href="/fail">Fail</a><a href="/healthy">Continue</a>',
    "/timeout-flow":
      '<title>Start</title><a href="/timeout">Slow</a><a href="/healthy">Continue</a>',
    "/robots-flow": '<title>Start</title><a href="/private">Private</a>',
    "/robots-down-flow": "<title>Should be blocked</title>",
    "/about": "<title>About</title><body>About content</body>",
    "/destination": "<title>Destination</title><body>Redirected</body>",
    "/healthy": "<title>Healthy</title><body>Still crawling</body>",
    "/private": "<title>Private</title><body>Disallowed</body>",
    "/dup": "<title>Duplicate target</title><body>Fetched once</body>",
    "/page-a": "<title>Page A</title>",
    "/page-b": "<title>Page B</title>",
  };

  sendHtml(
    response,
    pages[pathname] || "<title>Fixture</title><body>Local HTML</body>",
  );
}

async function runCrawler(path, overrides = {}, dependencies = {}) {
  return crawl(
    {
      startUrl: `${baseUrl}${path}`,
      allowedHosts: [new URL(baseUrl).hostname],
      maxDepth: 2,
      maxPages: 20,
      requestDelayMs: 0,
      requestTimeoutMs: 500,
      ...overrides,
    },
    {
      logger: silentLogger,
      textDetectionClient: noDetectionClient,
      ...dependencies,
    },
  );
}

before(async () => {
  server = http.createServer(handleRequest).listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(() => {
  requestCounts.clear();
  robotsStatus = 200;
  robotsBody = "User-agent: *\nAllow: /";
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("fetches an HTML page successfully from the local test server", async () => {
  const pages = await runCrawler("/start", { maxDepth: 0 });

  assert.equal(pages[0].success, true);
  assert.equal(pages[0].status, 200);
  assert.equal(pages[0].contentType, "text/html");
  assert.equal(pages[0].url, `${baseUrl}/start`);
});

test("parses the page title", () => {
  assert.equal(
    parseHtml("<html><head><title>Page title</title></head></html>").title,
    "Page title",
  );
});

test("extracts visible text without script contents", () => {
  const page = parseHtml(
    "<body><p>Hello <b>crawler</b></p><script>secret()</script></body>",
  );

  assert.equal(page.text, "Hello crawler");
});

test("extracts link href values from HTML", () => {
  const page = parseHtml(
    '<a href="/one">One</a><a href="https://example.invalid/two">Two</a>',
  );

  assert.deepEqual(page.links, ["/one", "https://example.invalid/two"]);
});

test("normalizes relative URLs, fragments, and trailing slashes", () => {
  assert.equal(
    normalizeUrl("../about/#section", "http://fixture.invalid/docs/start/"),
    "http://fixture.invalid/docs/about",
  );
});

test("uses exact host allowlisting and requires subdomains to be listed", () => {
  const allowedHosts = new Set([normalizeAllowedHost("example.invalid")]);

  assert.equal(
    isAllowedUrl("https://example.invalid/page", allowedHosts),
    true,
  );
  assert.equal(
    isAllowedUrl("https://sub.example.invalid/page", allowedHosts),
    false,
  );
  assert.equal(
    isAllowedUrl("https://outside.invalid/page", allowedHosts),
    false,
  );
});

test("preserves external links for analysis without crawling them", async () => {
  const pages = await runCrawler("/start", { maxDepth: 1 });

  assert.deepEqual(pages[0].links, [
    `${baseUrl}/about`,
    `http://localhost:${new URL(baseUrl).port}/external-alias`,
  ]);
  assert.equal(requestCounts.get("/external-alias") || 0, 0);
  assert.equal(requestCounts.get("/about"), 1);
});

test("does not fetch duplicate URLs", async () => {
  const pages = await runCrawler("/duplicate", { maxDepth: 1 });

  assert.equal(pages.length, 2);
  assert.equal(requestCounts.get("/dup"), 1);
});

test("enforces maxDepth starting at depth zero", async () => {
  const pages = await runCrawler("/depth-root", { maxDepth: 1 });

  assert.deepEqual(
    pages.map((page) => page.depth),
    [0, 1],
  );
  assert.equal(requestCounts.has("/depth-two"), false);
});

test("does not fetch beyond maxPages", async () => {
  const pages = await runCrawler("/page-limit", { maxPages: 2 });

  assert.equal(pages.length, 2);
  assert.equal(requestCounts.get("/page-a"), 1);
  assert.equal(requestCounts.has("/page-b"), false);
});

test("applies request delay between all HTTP requests", async () => {
  let clock = 0;
  const requestTimes = [];
  const rateLimitedFetch = createRateLimitedFetch(
    async (url) => {
      requestTimes.push({ url, time: clock });
      return "ok";
    },
    25,
    () => clock,
    async (milliseconds) => {
      clock += milliseconds;
    },
  );

  await rateLimitedFetch("first");
  await rateLimitedFetch("second");

  assert.deepEqual(requestTimes, [
    { url: "first", time: 0 },
    { url: "second", time: 25 },
  ]);
});

test("records a timeout and continues to the next queued URL", async () => {
  const pages = await runCrawler("/timeout-flow", { requestTimeoutMs: 200 });

  assert.equal(pages[0].success, true);
  assert.equal(pages[1].success, false);
  assert.equal(pages[1].error.code, "REQUEST_TIMEOUT");
  assert.equal(pages[2].url, `${baseUrl}/healthy`);
  assert.equal(pages[2].success, true);
});

test("rejects non-HTML responses without parsing them", async () => {
  const pages = await runCrawler("/non-html", { maxDepth: 0 });

  assert.equal(pages[0].success, false);
  assert.equal(pages[0].contentType, "application/json");
  assert.equal(pages[0].error.code, "UNSUPPORTED_CONTENT_TYPE");
});

test("blocks redirects to hosts outside the allowlist before requesting them", async () => {
  const pages = await runCrawler("/redirect-external", { maxDepth: 0 });

  assert.equal(pages[0].success, false);
  assert.equal(pages[0].error.code, "REDIRECT_HOST_NOT_ALLOWED");
  assert.equal(requestCounts.get("/redirect-target") || 0, 0);
});

test("follows redirects within the configured host and reports the final URL", async () => {
  const pages = await runCrawler("/redirect-internal", { maxDepth: 0 });

  assert.equal(pages[0].success, true);
  assert.equal(pages[0].url, `${baseUrl}/destination`);
  assert.equal(pages[0].text, "Redirected");
});

test("does not fetch paths disallowed by robots.txt", async () => {
  robotsBody = "User-agent: *\nDisallow: /private";
  const pages = await runCrawler("/robots-flow", { maxDepth: 1 });

  assert.equal(pages[0].success, true);
  assert.equal(pages[1].success, false);
  assert.equal(pages[1].error.code, "ROBOTS_DISALLOWED");
  assert.equal(requestCounts.has("/private"), false);
});

test("fails closed when robots.txt cannot be checked", async () => {
  robotsStatus = 503;
  const pages = await runCrawler("/robots-down-flow", { maxDepth: 0 });

  assert.equal(pages[0].success, false);
  assert.equal(pages[0].error.code, "ROBOTS_UNAVAILABLE");
  assert.equal(requestCounts.has("/robots-down-flow"), false);
});

test("treats a missing robots.txt as having no published restrictions", async () => {
  robotsStatus = 404;
  const pages = await runCrawler("/healthy", { maxDepth: 0 });

  assert.equal(pages[0].success, true);
  assert.equal(requestCounts.get("/healthy"), 1);
});

test("continues crawling after an HTTP failure", async () => {
  const pages = await runCrawler("/failure-flow", { maxDepth: 1 });

  assert.equal(pages[0].success, true);
  assert.equal(pages[1].success, false);
  assert.equal(pages[1].status, 503);
  assert.equal(pages[2].url, `${baseUrl}/healthy`);
  assert.equal(pages[2].success, true);
});

test("applies the most specific robots rule and prefers Allow on a tie", () => {
  const rules = parseRobotsTxt(
    "User-agent: *\nDisallow: /private\nAllow: /private/public\nDisallow: /same\nAllow: /same\nDisallow: /files/*/private$",
  );

  assert.equal(
    isAllowedByRobots("http://fixture.invalid/private/area", rules),
    false,
  );
  assert.equal(
    isAllowedByRobots("http://fixture.invalid/private/public/page", rules),
    true,
  );
  assert.equal(isAllowedByRobots("http://fixture.invalid/same", rules), true);
  assert.equal(
    isAllowedByRobots("http://fixture.invalid/files/a/private", rules),
    false,
  );
  assert.equal(
    isAllowedByRobots("http://fixture.invalid/files/a/private/more", rules),
    true,
  );
});
