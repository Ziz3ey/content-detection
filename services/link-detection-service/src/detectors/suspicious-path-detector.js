const {
  REDIRECT_QUERY_PARAMETERS,
  SUSPICIOUS_PATH_PATTERNS,
} = require("../config/link-detection-config");

function analyzeSuspiciousPath(parsedUrl) {
  const indicators = [];
  const pathRule = SUSPICIOUS_PATH_PATTERNS.find(({ pattern }) =>
    pattern.test(parsedUrl.pathname),
  );
  if (pathRule) {
    indicators.push({
      type: "suspicious_path",
      description:
        "Path URL mengandung nama file atau direktori konfigurasi yang perlu ditinjau.",
    });
  }

  for (const [name, value] of parsedUrl.searchParams) {
    if (!REDIRECT_QUERY_PARAMETERS.includes(name.toLowerCase())) {
      continue;
    }

    if (!/^https?:\/\//i.test(value)) {
      continue;
    }

    try {
      const target = new URL(value);
      if (target.origin !== parsedUrl.origin) {
        indicators.push({
          type: "external_redirect_parameter",
          description:
            "Parameter redirect mengandung URL dengan origin berbeda.",
        });
        break;
      }
    } catch {
      // Invalid parameter values are not treated as a confirmed indicator by this rule.
    }
  }

  return indicators;
}

module.exports = { analyzeSuspiciousPath };
