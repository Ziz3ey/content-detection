const { DETECTION_CATEGORIES } = require("../config/categories");
const { PATTERN_REGISTRY } = require("../config/patterns");
const { AhoCorasick } = require("../detectors/aho-corasick");

const matcher = new AhoCorasick(PATTERN_REGISTRY);

function detectText(text) {
  const matchedPatterns = matcher.search(text);
  const matchesByCategory = new Map();

  for (const match of matchedPatterns) {
    if (!matchesByCategory.has(match.category)) {
      matchesByCategory.set(match.category, []);
    }

    matchesByCategory.get(match.category).push({
      pattern: match.pattern,
      start: match.start,
      end: match.end,
    });
  }

  const categories = DETECTION_CATEGORIES.flatMap((category) => {
    const matches = matchesByCategory.get(category);
    return matches ? [{ category, matches }] : [];
  });

  return {
    detected: categories.length > 0,
    categories,
  };
}

module.exports = { detectText };
