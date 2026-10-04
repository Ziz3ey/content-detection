const { createHash } = require("node:crypto");
const { normalizeContent } = require("./normalize-content");

function hashContent(content) {
  return createHash("sha256")
    .update(normalizeContent(content), "utf8")
    .digest("hex");
}

module.exports = { hashContent };
