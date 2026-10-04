function validateText(text) {
  if (typeof text !== "string") {
    throw new TypeError("Text input must be a string.");
  }

  if (text.trim().length === 0) {
    throw new RangeError("Text input must not be empty.");
  }

  return text;
}

module.exports = { validateText };
