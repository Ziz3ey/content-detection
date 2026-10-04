const { hashContent } = require("../utils/hash-content");

function analyzeContentHash(currentText, baselineText) {
  const currentHash = hashContent(currentText);
  const baselineHash = hashContent(baselineText);

  if (currentHash === baselineHash) {
    return null;
  }

  return {
    type: "content_change",
    detected: true,
    description: "Representasi text halaman berbeda dari baseline.",
  };
}

module.exports = { analyzeContentHash };
