const { createApp } = require("./app");
const { analyzeUrl } = require("./services/link-detection-service");
const {
  DOMAIN_LABEL_COUNT,
  LONG_URL_INDICATOR_RATIO,
  MAX_REQUEST_BYTES,
  MAX_SUBDOMAIN_COUNT,
  MAX_URL_LENGTH,
} = require("./config/link-detection-config");
const { analyzeCredentials } = require("./detectors/credentials-detector");
const {
  analyzeEncodedStructure,
} = require("./detectors/encoded-structure-detector");
const { analyzeIpHostname } = require("./detectors/ip-hostname-detector");
const { analyzeSubdomainCount } = require("./detectors/subdomain-detector");
const {
  analyzeSuspiciousHostname,
} = require("./detectors/suspicious-hostname-detector");
const {
  analyzeSuspiciousPath,
} = require("./detectors/suspicious-path-detector");
const { analyzeUrlLength } = require("./detectors/url-length-detector");
const { validateDetectionInput } = require("./utils/validate-detection-input");

module.exports = {
  analyzeCredentials,
  analyzeEncodedStructure,
  analyzeIpHostname,
  analyzeSubdomainCount,
  analyzeSuspiciousHostname,
  analyzeSuspiciousPath,
  analyzeUrl,
  analyzeUrlLength,
  createApp,
  DOMAIN_LABEL_COUNT,
  LONG_URL_INDICATOR_RATIO,
  MAX_REQUEST_BYTES,
  MAX_SUBDOMAIN_COUNT,
  MAX_URL_LENGTH,
  validateDetectionInput,
};
