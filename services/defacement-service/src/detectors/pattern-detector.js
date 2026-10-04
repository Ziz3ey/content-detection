const { DEFACEMENT_PATTERNS } = require("../config/defacement-config");
const { normalizeContent } = require("../utils/normalize-content");

function analyzeDefacementPatterns(content, patterns = DEFACEMENT_PATTERNS) {
  const normalizedContent = normalizeContent(content).toLowerCase();

  return patterns.flatMap((pattern) => {
    if (!normalizedContent.includes(pattern.value.toLowerCase())) {
      return [];
    }

    return [
      {
        type: "defacement_pattern",
        detected: true,
        pattern: pattern.id,
        description: "Text memuat pattern indikator yang dikonfigurasi.",
      },
    ];
  });
}

module.exports = { analyzeDefacementPatterns };
