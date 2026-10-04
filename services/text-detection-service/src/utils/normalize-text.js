const { validateText } = require("./validate-text");

function normalizeText(text) {
  const validatedText = validateText(text);

  return validatedText.toLowerCase().trim().replace(/\s+/g, " ");
}

module.exports = { normalizeText };
