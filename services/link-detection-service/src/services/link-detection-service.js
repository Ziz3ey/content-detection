const { analyzeCredentials } = require("../detectors/credentials-detector");
const {
  analyzeEncodedStructure,
} = require("../detectors/encoded-structure-detector");
const { analyzeIpHostname } = require("../detectors/ip-hostname-detector");
const { analyzeSubdomainCount } = require("../detectors/subdomain-detector");
const {
  analyzeSuspiciousHostname,
} = require("../detectors/suspicious-hostname-detector");
const {
  analyzeSuspiciousPath,
} = require("../detectors/suspicious-path-detector");
const { analyzeUrlLength } = require("../detectors/url-length-detector");

function analyzeUrl(inputUrl, parsedUrl) {
  const indicators = [
    analyzeUrlLength(inputUrl),
    analyzeSubdomainCount(parsedUrl),
    analyzeIpHostname(parsedUrl),
    analyzeSuspiciousHostname(parsedUrl),
    analyzeEncodedStructure(parsedUrl),
    analyzeCredentials(parsedUrl),
    ...analyzeSuspiciousPath(parsedUrl),
  ].filter(Boolean);

  return {
    detected: indicators.length > 0,
    indicators,
  };
}

module.exports = { analyzeUrl };
