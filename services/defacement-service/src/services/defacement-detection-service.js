const { analyzeContentHash } = require("../detectors/content-hash-detector");
const { analyzeDefacementPatterns } = require("../detectors/pattern-detector");
const { analyzeTitle } = require("../detectors/title-detector");
const { extractPageContent } = require("../utils/extract-page-content");

function analyzePage(html, baselineHtml) {
  const currentPage = extractPageContent(html);
  const baselinePage = extractPageContent(baselineHtml);
  const indicators = [
    analyzeTitle(currentPage.title, baselinePage.title),
    analyzeContentHash(currentPage.text, baselinePage.text),
    ...analyzeDefacementPatterns(`${currentPage.title}\n${currentPage.text}`),
  ].filter(Boolean);

  return {
    detected: indicators.length > 0,
    indicators,
  };
}

module.exports = { analyzePage };
