const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createPendingResult,
  DETECTION_CATEGORIES,
  isValidCategory,
  prepareDetection,
} = require("../src");

test("prepares normalized text with unevaluated results", () => {
  const prepared = prepareDetection("  Teks   untuk diperiksa ");

  assert.equal(prepared.normalizedText, "teks untuk diperiksa");
  assert.deepEqual(prepared.results, [
    { category: "gambling", detected: null, matches: [], confidence: null },
    { category: "fraud", detected: null, matches: [], confidence: null },
    { category: "pornography", detected: null, matches: [], confidence: null },
  ]);
});

test("accepts configured detection categories", () => {
  assert.deepEqual(DETECTION_CATEGORIES, ["gambling", "fraud", "pornography"]);

  for (const category of DETECTION_CATEGORIES) {
    assert.equal(isValidCategory(category), true);
    assert.deepEqual(createPendingResult(category), {
      category,
      detected: null,
      matches: [],
      confidence: null,
    });
  }
});

test("rejects a category that is not configured", () => {
  assert.equal(isValidCategory("malware"), false);
  assert.throws(() => createPendingResult("malware"), {
    name: "RangeError",
    message: "Unsupported detection category: malware",
  });
});
