const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeText } = require("../src");

test("rejects empty text", () => {
  assert.throws(() => normalizeText(" \n\t "), {
    name: "RangeError",
    message: "Text input must not be empty.",
  });
});

test("rejects input that is not a string", () => {
  assert.throws(() => normalizeText(123), {
    name: "TypeError",
    message: "Text input must be a string.",
  });
});

test("keeps normal text after basic normalization", () => {
  assert.equal(normalizeText("text normal"), "text normal");
});

test("converts uppercase text to lowercase", () => {
  assert.equal(normalizeText("TEXT KAPITAL"), "text kapital");
});

test("trims and collapses excessive whitespace", () => {
  assert.equal(
    normalizeText("  teks   dengan\n whitespace  "),
    "teks dengan whitespace",
  );
});
