function normalizeContent(content) {
  return content
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = { normalizeContent };
