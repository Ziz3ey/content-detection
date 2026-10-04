const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { once } = require("node:events");
const {
  analyzeCredentials,
  analyzeEncodedStructure,
  analyzeIpHostname,
  analyzeSubdomainCount,
  analyzeSuspiciousHostname,
  analyzeSuspiciousPath,
  analyzeUrl,
  analyzeUrlLength,
  createApp,
  MAX_URL_LENGTH,
} = require("../src");
const {
  REDIRECT_QUERY_PARAMETERS,
} = require("../src/config/link-detection-config");

let server;
let baseUrl;

function parseUrl(value) {
  return new URL(value);
}

async function startServer(app) {
  const runningServer = app.listen(0, "127.0.0.1");
  await once(runningServer, "listening");
  return {
    server: runningServer,
    url: `http://127.0.0.1:${runningServer.address().port}`,
  };
}

async function closeServer(runningServer) {
  if (!runningServer.listening) {
    return;
  }
  await new Promise((resolve, reject) => {
    runningServer.close((error) => (error ? reject(error) : resolve()));
  });
}

async function postJson(body) {
  return fetch(`${baseUrl}/api/v1/detect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

before(async () => {
  const running = await startServer(createApp());
  server = running.server;
  baseUrl = running.url;
});

after(async () => {
  await closeServer(server);
});

test("IP hostname rule returns an indicator only for IP literals", () => {
  assert.equal(
    analyzeIpHostname(parseUrl("https://192.0.2.10/page")).type,
    "ip_hostname",
  );
  assert.equal(
    analyzeIpHostname(parseUrl("https://portal.example.test/page")),
    null,
  );
});

test("URL length rule flags a long URL as an indicator", () => {
  const longUrl = `https://example.test/${"a".repeat(Math.floor(MAX_URL_LENGTH * 0.75))}`;

  assert.equal(analyzeUrlLength(longUrl).type, "long_url");
  assert.equal(analyzeUrlLength("https://example.test/short"), null);
});

test("subdomain rule flags only counts above its configured threshold", () => {
  assert.equal(
    analyzeSubdomainCount(parseUrl("https://a.b.c.example.test")).type,
    "many_subdomains",
  );
  assert.equal(
    analyzeSubdomainCount(parseUrl("https://www.example.test")),
    null,
  );
  assert.equal(analyzeSubdomainCount(parseUrl("https://192.0.2.10")), null);
});

test("hostname rule reports punycode and repeated-hyphen labels for review", () => {
  assert.equal(
    analyzeSuspiciousHostname(parseUrl("https://xn--bcher-kva.example")).type,
    "unusual_hostname",
  );
  assert.equal(
    analyzeSuspiciousHostname(parseUrl("https://portal.example.test")),
    null,
  );
});

test("encoded structure rule flags encoded reserved URL characters", () => {
  assert.equal(
    analyzeEncodedStructure(parseUrl("https://example.test/path%2fpart")).type,
    "encoded_url_structure",
  );
  assert.equal(
    analyzeEncodedStructure(parseUrl("https://example.test/path")),
    null,
  );
});

test("credentials rule detects URL user information without fetching it", () => {
  assert.equal(
    analyzeCredentials(parseUrl("https://user:password@example.test/path"))
      .type,
    "url_credentials",
  );
  assert.equal(analyzeCredentials(parseUrl("https://example.test/path")), null);
});

test("path/query rule flags configured sensitive paths and external redirect values", () => {
  assert.deepEqual(
    analyzeSuspiciousPath(parseUrl("https://example.test/.env")).map(
      (indicator) => indicator.type,
    ),
    ["suspicious_path"],
  );
  assert.equal(
    analyzeSuspiciousPath(
      parseUrl("https://example.test/login?next=https%3A%2F%2Foutside.test%2F"),
    )[0].type,
    "external_redirect_parameter",
  );
  assert.deepEqual(
    analyzeSuspiciousPath(parseUrl("https://example.test/about")),
    [],
  );
  assert.ok(REDIRECT_QUERY_PARAMETERS.includes("next"));
});

test("normal HTTPS URL has no excessive false-positive indicators", () => {
  assert.deepEqual(
    analyzeUrl(
      "https://portal.example.test/about",
      parseUrl("https://portal.example.test/about"),
    ),
    {
      detected: false,
      indicators: [],
    },
  );
});

test("aggregates multiple distinct indicators without declaring a URL malicious", () => {
  const value =
    "https://user:pass@192.0.2.10/.env?next=https%3A%2F%2Foutside.test%2F";
  const result = analyzeUrl(value, parseUrl(value));

  assert.equal(result.detected, true);
  assert.deepEqual(
    result.indicators.map((indicator) => indicator.type),
    [
      "ip_hostname",
      "encoded_url_structure",
      "url_credentials",
      "suspicious_path",
      "external_redirect_parameter",
    ],
  );
  assert.equal(
    result.indicators.every(
      (indicator) => typeof indicator.description === "string",
    ),
    true,
  );
  assert.equal(Object.hasOwn(result, "riskScore"), false);
});

test("GET /health returns the expected service status", async () => {
  const response = await fetch(`${baseUrl}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    service: "link-detection-service",
    status: "ok",
  });
});

test("POST accepts valid HTTP and HTTPS URLs", async () => {
  for (const url of ["http://example.test/page", "https://example.test/page"]) {
    const response = await postJson({ url });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.detected, false);
    assert.deepEqual(payload.data.indicators, []);
  }
});

test("POST returns a consistent invalid-input response for absent or invalid URLs", async () => {
  const invalidBodies = [
    undefined,
    {},
    { url: "" },
    { url: "   " },
    { url: null },
    { url: 123 },
    { url: true },
    { url: ["https://example.test"] },
    { url: { value: "https://example.test" } },
    { url: "not a valid url" },
    { url: "javascript:alert(1)" },
    { url: "data:text/plain,hello" },
    { url: "file:///etc/passwd" },
    { url: "ftp://example.test/file" },
  ];

  for (const body of invalidBodies) {
    const response =
      body === undefined
        ? await fetch(`${baseUrl}/api/v1/detect`, { method: "POST" })
        : await postJson(body);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(typeof payload.error.code, "string");
    assert.equal(typeof payload.error.message, "string");
  }
});

test("POST returns the IP hostname indicator from a valid URL", async () => {
  const response = await postJson({ url: "https://192.0.2.10/page" });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.data.detected, true);
  assert.deepEqual(
    payload.data.indicators.map((indicator) => indicator.type),
    ["ip_hostname"],
  );
});

test("POST rejects URLs above the configured length limit", async () => {
  const url = `https://example.test/${"a".repeat(MAX_URL_LENGTH)}`;
  const response = await postJson({ url });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(payload, {
    success: false,
    error: {
      code: "INVALID_INPUT",
      message: `Field 'url' tidak boleh melebihi ${MAX_URL_LENGTH} karakter.`,
    },
  });
});

test("handles malformed JSON as a consistent JSON error", async () => {
  const response = await fetch(`${baseUrl}/api/v1/detect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{bad json",
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    success: false,
    error: {
      code: "INVALID_JSON",
      message: "Body harus berupa JSON yang valid.",
    },
  });
});

test("does not disclose internal errors to the client", async () => {
  const loggedErrors = [];
  const temporary = await startServer(
    createApp({
      analyze() {
        throw new Error("private path C:\\internal\\secret");
      },
      logger: { error: (...values) => loggedErrors.push(values) },
    }),
  );

  try {
    const response = await fetch(`${temporary.url}/api/v1/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.test/" }),
    });
    const payload = await response.json();

    assert.equal(response.status, 500);
    assert.deepEqual(payload, {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan internal." },
    });
    assert.equal(JSON.stringify(payload).includes("private path"), false);
    assert.equal(loggedErrors.length, 1);
  } finally {
    await closeServer(temporary.server);
  }
});
