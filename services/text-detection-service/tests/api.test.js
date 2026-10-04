const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { once } = require("node:events");
const {
  AhoCorasick,
  DETECTION_CATEGORIES,
  PATTERN_REGISTRY,
} = require("../src");
const { createApp } = require("../src/app");
const { MAX_TEXT_LENGTH } = require("../src/config/server");

let server;
let baseUrl;

async function startServer(app) {
  const listeningServer = app.listen(0, "127.0.0.1");
  await once(listeningServer, "listening");
  const { port } = listeningServer.address();

  return {
    server: listeningServer,
    url: `http://127.0.0.1:${port}`,
  };
}

async function closeServer(listeningServer) {
  if (!listeningServer.listening) {
    return;
  }

  await new Promise((resolve, reject) => {
    listeningServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
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

test("GET /health reports service health", async () => {
  const response = await fetch(`${baseUrl}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    service: "text-detection-service",
    status: "ok",
  });
});

test("POST /api/v1/detect returns actual categorized matches", async () => {
  const text = "ALPHA and beta";
  const response = await postJson({ text });
  const payload = await response.json();
  const actualMatches = new AhoCorasick(PATTERN_REGISTRY).search(text);
  const expectedCategories = DETECTION_CATEGORIES.flatMap((category) => {
    const matches = actualMatches
      .filter((match) => match.category === category)
      .map(({ pattern, start, end }) => ({ pattern, start, end }));
    return matches.length > 0 ? [{ category, matches }] : [];
  });

  assert.equal(response.status, 200);
  assert.deepEqual(payload, {
    success: true,
    data: { detected: true, categories: expectedCategories },
  });
});

test("POST without a request body returns invalid input", async () => {
  const response = await fetch(`${baseUrl}/api/v1/detect`, { method: "POST" });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.error.code, "INVALID_INPUT");
});

test("POST without the text field returns invalid input", async () => {
  const response = await postJson({});
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.error.code, "INVALID_INPUT");
});

test("rejects request bodies that are not JSON objects", async () => {
  for (const body of [null, [], "text"]) {
    const response = await postJson(body);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.error.code, "INVALID_INPUT");
  }
});

test("rejects null text", async () => {
  const response = await postJson({ text: null });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "INVALID_INPUT");
});

test("rejects text that is not a string", async () => {
  const response = await postJson({ text: 123 });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "INVALID_INPUT");
});

test("rejects boolean text", async () => {
  const response = await postJson({ text: true });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "INVALID_INPUT");
});

test("rejects array text", async () => {
  const response = await postJson({ text: ["alpha"] });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "INVALID_INPUT");
});

test("rejects object text", async () => {
  const response = await postJson({ text: { value: "alpha" } });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "INVALID_INPUT");
});

test("rejects empty text", async () => {
  const response = await postJson({ text: "" });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "INVALID_INPUT");
});

test("rejects whitespace-only text", async () => {
  const response = await postJson({ text: " \n\t " });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "INVALID_INPUT");
});

test("returns detected false when no registered pattern matches", async () => {
  const response = await postJson({
    text: "ordinary content without a fixture",
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    data: { detected: false, categories: [] },
  });
});

test("groups a matching fixture under its configured category", async () => {
  const response = await postJson({ text: "gamma" });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.data.detected, true);
  assert.deepEqual(payload.data.categories, [
    {
      category: "pornography",
      matches: [{ pattern: "gamma", start: 0, end: 4 }],
    },
  ]);
});

test("normalizes case and surrounding whitespace through the full API flow", async () => {
  const response = await postJson({ text: "  ALPHA  " });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload.data.categories, [
    {
      category: "gambling",
      matches: [{ pattern: "alpha", start: 0, end: 4 }],
    },
  ]);
});

test("returns a consistent JSON error for malformed JSON", async () => {
  const response = await fetch(`${baseUrl}/api/v1/detect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{invalid json",
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(payload, {
    success: false,
    error: {
      code: "INVALID_JSON",
      message: "Body harus berupa JSON yang valid.",
    },
  });
});

test("rejects text longer than the configured maximum", async () => {
  const response = await postJson({ text: "a".repeat(MAX_TEXT_LENGTH + 1) });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.error.code, "INVALID_INPUT");
  assert.match(payload.error.message, /10000 karakter/);
});

test("accepts text exactly at the configured maximum", async () => {
  const text = `alpha${"x".repeat(MAX_TEXT_LENGTH - "alpha".length)}`;
  const response = await postJson({ text });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.data.detected, true);
  assert.deepEqual(payload.data.categories, [
    {
      category: "gambling",
      matches: [{ pattern: "alpha", start: 0, end: 4 }],
    },
  ]);
});

test("rejects a non-JSON request body", async () => {
  const response = await fetch(`${baseUrl}/api/v1/detect`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "text=alpha",
  });

  assert.equal(response.status, 415);
  assert.equal((await response.json()).error.code, "UNSUPPORTED_MEDIA_TYPE");
});

test("hides internal error details from the response and logs them server-side", async () => {
  const loggedErrors = [];
  const running = await startServer(
    createApp({
      detectionService() {
        throw new Error("private filesystem detail");
      },
      logger: { error: (...values) => loggedErrors.push(values) },
    }),
  );

  try {
    const response = await fetch(`${running.url}/api/v1/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "alpha" }),
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
    assert.equal(
      JSON.stringify(payload).includes("private filesystem detail"),
      false,
    );
    assert.equal(loggedErrors.length, 1);
  } finally {
    await closeServer(running.server);
  }
});
