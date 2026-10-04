const test = require("node:test");
const assert = require("node:assert/strict");
const { AhoCorasick, PATTERN_REGISTRY } = require("../src");

function createPattern(pattern, category = "gambling") {
  return { pattern, category };
}

test("finds a single pattern", () => {
  const matcher = new AhoCorasick([createPattern("alpha")]);

  assert.deepEqual(matcher.search("xxalpha"), [
    { pattern: "alpha", category: "gambling", start: 2, end: 6 },
  ]);
});

test("returns no matches when patterns are absent from text", () => {
  const matcher = new AhoCorasick([createPattern("alpha")]);

  assert.deepEqual(matcher.search("unrelated text"), []);
});

test("returns no matches when every pattern is longer than the text", () => {
  const matcher = new AhoCorasick([createPattern("alpha")]);

  assert.deepEqual(matcher.search("alp"), []);
});

test("matches a pattern that is the entire text", () => {
  const matcher = new AhoCorasick([createPattern("alpha")]);

  assert.deepEqual(matcher.search("alpha"), [
    { pattern: "alpha", category: "gambling", start: 0, end: 4 },
  ]);
});

test("finds a pattern at the beginning of the text", () => {
  const matcher = new AhoCorasick([createPattern("alpha")]);

  assert.equal(matcher.search("alpha beta")[0].start, 0);
});

test("finds a pattern at the end of the text", () => {
  const matcher = new AhoCorasick([createPattern("beta")]);

  assert.deepEqual(matcher.search("alpha beta"), [
    { pattern: "beta", category: "gambling", start: 6, end: 9 },
  ]);
});

test("finds several different patterns", () => {
  const matcher = new AhoCorasick([
    createPattern("alpha", "gambling"),
    createPattern("beta", "fraud"),
  ]);

  assert.deepEqual(matcher.search("alpha and beta"), [
    { pattern: "alpha", category: "gambling", start: 0, end: 4 },
    { pattern: "beta", category: "fraud", start: 10, end: 13 },
  ]);
});

test("returns multiple patterns in one category and across categories", () => {
  const matcher = new AhoCorasick([
    createPattern("alpha", "gambling"),
    createPattern("beta", "gambling"),
    createPattern("gamma", "fraud"),
  ]);

  assert.deepEqual(matcher.search("alpha beta gamma"), [
    { pattern: "alpha", category: "gambling", start: 0, end: 4 },
    { pattern: "beta", category: "gambling", start: 6, end: 9 },
    { pattern: "gamma", category: "fraud", start: 11, end: 15 },
  ]);
});

test("finds every occurrence of a pattern", () => {
  const matcher = new AhoCorasick([createPattern("alpha")]);

  assert.deepEqual(matcher.search("alpha alpha"), [
    { pattern: "alpha", category: "gambling", start: 0, end: 4 },
    { pattern: "alpha", category: "gambling", start: 6, end: 10 },
  ]);
});

test("supports overlapping matches", () => {
  const matcher = new AhoCorasick([
    createPattern("aba"),
    createPattern("bab", "fraud"),
  ]);

  assert.deepEqual(matcher.search("ababa"), [
    { pattern: "aba", category: "gambling", start: 0, end: 2 },
    { pattern: "bab", category: "fraud", start: 1, end: 3 },
    { pattern: "aba", category: "gambling", start: 2, end: 4 },
  ]);
});

test("finds a pattern that is a prefix of another pattern", () => {
  const matcher = new AhoCorasick([
    createPattern("he", "fraud"),
    createPattern("hers", "pornography"),
  ]);

  assert.deepEqual(matcher.search("hers"), [
    { pattern: "he", category: "fraud", start: 0, end: 1 },
    { pattern: "hers", category: "pornography", start: 0, end: 3 },
  ]);
});

test("rejects empty text using the existing text validation", () => {
  const matcher = new AhoCorasick([createPattern("alpha")]);

  assert.throws(() => matcher.search("  \n "), { name: "RangeError" });
});

test("rejects an empty pattern", () => {
  assert.throws(() => new AhoCorasick([createPattern(" ")]), {
    name: "RangeError",
  });
});

test("supports an empty pattern registry", () => {
  const matcher = new AhoCorasick([]);

  assert.deepEqual(matcher.search("alpha"), []);
});

test("matches case-insensitively through the shared normalizer", () => {
  const matcher = new AhoCorasick([createPattern("ALPHA")]);

  assert.deepEqual(matcher.search("  Alpha  "), [
    { pattern: "alpha", category: "gambling", start: 0, end: 4 },
  ]);
});

test("reports the correct start index", () => {
  const matcher = new AhoCorasick([createPattern("beta")]);

  assert.equal(matcher.search("alpha beta")[0].start, 6);
});

test("reports an inclusive end index", () => {
  const matcher = new AhoCorasick([createPattern("beta")]);

  assert.equal(matcher.search("alpha beta")[0].end, 9);
});

test("uses failure links for the classic he, she, his, hers example", () => {
  const matcher = new AhoCorasick([
    createPattern("he", "fraud"),
    createPattern("she", "gambling"),
    createPattern("his", "fraud"),
    createPattern("hers", "pornography"),
  ]);

  assert.deepEqual(matcher.search("ushers"), [
    { pattern: "she", category: "gambling", start: 1, end: 3 },
    { pattern: "he", category: "fraud", start: 2, end: 3 },
    { pattern: "hers", category: "pornography", start: 2, end: 5 },
  ]);
});

test("preserves the configured category on each match", () => {
  const matcher = new AhoCorasick([createPattern("gamma", "pornography")]);

  assert.equal(matcher.search("gamma")[0].category, "pornography");
});

test("deduplicates identical normalized pattern-category pairs", () => {
  const matcher = new AhoCorasick([
    createPattern("alpha", "gambling"),
    createPattern(" ALPHA ", "gambling"),
  ]);

  assert.deepEqual(matcher.search("alpha"), [
    { pattern: "alpha", category: "gambling", start: 0, end: 4 },
  ]);
});

test("provides the categorized sample pattern registry", () => {
  assert.deepEqual(PATTERN_REGISTRY, [
    { pattern: "alpha", category: "gambling" },
    { pattern: "beta", category: "fraud" },
    { pattern: "gamma", category: "pornography" },
  ]);
});
