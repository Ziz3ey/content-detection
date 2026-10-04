const { MIN_SUSPICIOUS_HYPHENS } = require("../config/link-detection-config");

function analyzeSuspiciousHostname(parsedUrl) {
  const labels = parsedUrl.hostname.toLowerCase().split(".");
  const hasPunycodeLabel = labels.some((label) => label.startsWith("xn--"));
  const hasManyHyphens = labels.some(
    (label) => (label.match(/-/g) || []).length >= MIN_SUSPICIOUS_HYPHENS,
  );

  if (!hasPunycodeLabel && !hasManyHyphens) {
    return null;
  }

  return {
    type: "unusual_hostname",
    description:
      "Hostname memiliki label punycode atau banyak tanda hubung yang perlu ditinjau.",
  };
}

module.exports = { analyzeSuspiciousHostname };
