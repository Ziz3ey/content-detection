const {
  DOMAIN_LABEL_COUNT,
  MAX_SUBDOMAIN_COUNT,
} = require("../config/link-detection-config");
const { isIP } = require("node:net");

function analyzeSubdomainCount(parsedUrl) {
  const hostname = parsedUrl.hostname.replace(/^\[|\]$/g, "");
  if (isIP(hostname) !== 0) {
    return null;
  }

  const labels = hostname.split(".").filter(Boolean);
  const subdomainCount = Math.max(0, labels.length - DOMAIN_LABEL_COUNT);
  if (subdomainCount <= MAX_SUBDOMAIN_COUNT) {
    return null;
  }

  return {
    type: "many_subdomains",
    description: `Hostname memiliki lebih dari ${MAX_SUBDOMAIN_COUNT} label subdomain berdasarkan pemisahan sederhana.`,
  };
}

module.exports = { analyzeSubdomainCount };
