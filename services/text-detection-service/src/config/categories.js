const DETECTION_CATEGORIES = Object.freeze([
  "gambling",
  "fraud",
  "pornography",
]);

function isValidCategory(category) {
  return DETECTION_CATEGORIES.includes(category);
}

function assertValidCategory(category) {
  if (!isValidCategory(category)) {
    throw new RangeError(`Unsupported detection category: ${category}`);
  }
}

module.exports = {
  DETECTION_CATEGORIES,
  assertValidCategory,
  isValidCategory,
};
