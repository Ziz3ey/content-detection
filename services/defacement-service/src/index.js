const { createApp } = require("./app");
const {
  DEFACEMENT_PATTERNS,
  MAX_HTML_LENGTH,
  MAX_REQUEST_BYTES,
} = require("./config/defacement-config");
const { analyzeContentHash } = require("./detectors/content-hash-detector");
const { analyzeDefacementPatterns } = require("./detectors/pattern-detector");
const { analyzeTitle } = require("./detectors/title-detector");
const { analyzePage } = require("./services/defacement-detection-service");
const { hashContent } = require("./utils/hash-content");
const { normalizeContent } = require("./utils/normalize-content");

module.exports = {
  analyzeContentHash,
  analyzeDefacementPatterns,
  analyzePage,
  analyzeTitle,
  createApp,
  DEFACEMENT_PATTERNS,
  hashContent,
  MAX_HTML_LENGTH,
  MAX_REQUEST_BYTES,
  normalizeContent,
};
