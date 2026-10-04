const {
  assertValidCategory,
  DETECTION_CATEGORIES,
} = require("../config/categories");
const { normalizeText } = require("../utils/normalize-text");

function createPendingResult(category) {
  assertValidCategory(category);

  return {
    category,
    detected: null,
    matches: [],
    confidence: null,
  };
}

function prepareDetection(text) {
  const normalizedText = normalizeText(text);

  return {
    normalizedText,
    results: DETECTION_CATEGORIES.map(createPendingResult),
  };
}

module.exports = {
  createPendingResult,
  prepareDetection,
};
