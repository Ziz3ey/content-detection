const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { after, before, test } = require("node:test");
const { once } = require("node:events");
const {
  analyzeContentHash,
  analyzeDefacementPatterns,
  analyzePage,
  analyzeTitle,
  createApp,
  hashContent,
  MAX_HTML_LENGTH,
  normalizeContent,
} = require("../src");
const { extractPageContent } = require("../src/utils/extract-page-content");

const normalHtml = readFileSync(
  path.join(__dirname, "fixtures", "normal.html"),
  "utf8",
);
const changedHtml = readFileSync(
  path.join(__dirname, "fixtures", "changed.html"),
  "utf8",
);
let server;
let baseUrl;

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

test("normalizes line endings and whitespace without changing content meaning", () => {
  assert.equal(normalizeContent("  alpha\r\n\t beta  "), "alpha beta");
  assert.equal(hashContent("alpha\r\n beta"), hashContent(" alpha\n  beta "));
});

test("does not report content change for whitespace-only noise", () => {
  assert.equal(analyzeContentHash("alpha\n beta", " alpha\r\nbeta "), null);
});

test("compares title with the baseline case-insensitively", () => {
  assert.equal(analyzeTitle(" Local Portal ", "local portal"), null);
  assert.deepEqual(analyzeTitle("Changed title", "Local Portal"), {
    type: "title_mismatch",
    detected: true,
    description: "Judul halaman berbeda dari baseline.",
  });
});

test("reports a content hash change separately from a title change", () => {
  assert.deepEqual(analyzeContentHash("new content", "old content"), {
    type: "content_change",
    detected: true,
    description: "Representasi text halaman berbeda dari baseline.",
  });
});

test("detects configured defacement indicator patterns", () => {
  const indicators = analyzeDefacementPatterns(
    "A page says HACKED BY a test fixture.",
  );

  assert.deepEqual(indicators, [
    {
      type: "defacement_pattern",
      detected: true,
      pattern: "hacked_by",
      description: "Text memuat pattern indikator yang dikonfigurasi.",
    },
  ]);
});

test("returns no indicators for the unchanged normal fixture", () => {
  assert.deepEqual(analyzePage(normalHtml, normalHtml), {
    detected: false,
    indicators: [],
  });
});

test("combines title, content hash, and pattern indicators for the changed fixture", () => {
  const result = analyzePage(changedHtml, normalHtml);

  assert.equal(result.detected, true);
  assert.deepEqual(
    result.indicators.map((indicator) => indicator.type),
    [
      "title_mismatch",
      "content_change",
      "defacement_pattern",
      "defacement_pattern",
    ],
  );
});

test("ignores equivalent HTML structure with head metadata differences", () => {
  const currentHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Baseline Page</title>
  </head>
  <body>
    <h1>Official Local Page</h1>
    <p>This is the original baseline content.</p>
  </body>
</html>`;

  const baselineHtml = `<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Baseline Page</title>
</head>
<body>
    <h1>Official Local Page</h1>
    <p>This is the original baseline content.</p>
</body>
</html>`;

  const current = extractPageContent(currentHtml);
  const baseline = extractPageContent(baselineHtml);

  assert.equal(current.title, baseline.title);
  assert.equal(current.text, baseline.text);
  assert.equal(analyzePage(currentHtml, baselineHtml).detected, false);
});

test("GET /health returns the expected service status", async () => {
  const response = await fetch(`${baseUrl}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    service: "defacement-service",
    status: "ok",
  });
});

test("POST returns detected false when current page matches baseline", async () => {
  const response = await postJson({
    html: normalHtml,
    baseline: { html: normalHtml },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    data: { detected: false, indicators: [] },
  });
});

test("POST returns separate indicators when current page differs from baseline", async () => {
  const response = await postJson({
    html: changedHtml,
    baseline: { html: normalHtml },
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.detected, true);
  assert.deepEqual(
    payload.data.indicators.map((indicator) => indicator.type),
    [
      "title_mismatch",
      "content_change",
      "defacement_pattern",
      "defacement_pattern",
    ],
  );
  assert.equal(Object.hasOwn(payload.data, "confidence"), false);
});

test("ignores formatting-only HTML changes through the complete API flow", async () => {
  const compactHtml = normalHtml.replace(/\s+/g, " ");
  assert.equal(
    normalizeContent(extractPageContent(compactHtml).text),
    normalizeContent(extractPageContent(normalHtml).text),
  );
  const response = await postJson({
    html: compactHtml,
    baseline: { html: normalHtml },
  });

  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data, {
    detected: false,
    indicators: [],
  });
});

test("rejects an empty body and malformed JSON consistently", async () => {
  const emptyResponse = await fetch(`${baseUrl}/api/v1/detect`, {
    method: "POST",
  });
  assert.equal(emptyResponse.status, 400);
  assert.deepEqual(await emptyResponse.json(), {
    success: false,
    error: { code: "INVALID_INPUT", message: "Body harus berupa object JSON." },
  });

  const malformedResponse = await fetch(`${baseUrl}/api/v1/detect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{bad json",
  });
  assert.equal(malformedResponse.status, 400);
  assert.equal((await malformedResponse.json()).error.code, "INVALID_JSON");
});

test("rejects invalid HTML and baseline fields", async () => {
  const invalidBodies = [
    {},
    { html: null, baseline: { html: normalHtml } },
    { html: 123, baseline: { html: normalHtml } },
    { html: " ", baseline: { html: normalHtml } },
    { html: normalHtml },
    { html: normalHtml, baseline: null },
    { html: normalHtml, baseline: { html: "" } },
  ];

  for (const body of invalidBodies) {
    const response = await postJson(body);
    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.error.code, "INVALID_INPUT");
  }
});

test("rejects HTML exceeding the configured input limit", async () => {
  const oversizedHtml = `<!doctype html><p>${"x".repeat(MAX_HTML_LENGTH)}</p>`;
  const response = await postJson({
    html: oversizedHtml,
    baseline: { html: normalHtml },
  });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "INVALID_INPUT");
});

test("accepts HTML exactly at the configured input limit", async () => {
  const prefix = "<title>Local Portal</title><p>";
  const suffix = "</p>";
  const html = `${prefix}${"x".repeat(MAX_HTML_LENGTH - prefix.length - suffix.length)}${suffix}`;
  const response = await postJson({ html, baseline: { html } });

  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data, {
    detected: false,
    indicators: [],
  });
});

test("hides unexpected internal details in a consistent JSON error", async () => {
  const errors = [];
  const temporary = await startServer(
    createApp({
      analyze() {
        throw new Error("private filesystem path C:\\secret\\state");
      },
      logger: { error: (...values) => errors.push(values) },
    }),
  );

  try {
    const response = await fetch(`${temporary.url}/api/v1/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        html: normalHtml,
        baseline: { html: normalHtml },
      }),
    });
    const payload = await response.json();

    assert.equal(response.status, 500);
    assert.deepEqual(payload, {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Terjadi kesalahan internal.",
      },
    });
    assert.equal(JSON.stringify(payload).includes("filesystem"), false);
    assert.equal(errors.length, 1);
  } finally {
    await closeServer(temporary.server);
  }
});
