const { normalizeContent } = require("../utils/normalize-content");

function analyzeTitle(currentTitle, baselineTitle) {
  const current = normalizeContent(currentTitle).toLowerCase();
  const baseline = normalizeContent(baselineTitle).toLowerCase();

  if (!baseline || current === baseline) {
    return null;
  }

  return {
    type: "title_mismatch",
    detected: true,
    description: "Judul halaman berbeda dari baseline.",
  };
}

module.exports = { analyzeTitle };
