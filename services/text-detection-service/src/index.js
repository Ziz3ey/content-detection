const {
  DETECTION_CATEGORIES,
  isValidCategory,
} = require("./config/categories");
const { normalizeText } = require("./utils/normalize-text");
const {
  createPendingResult,
  prepareDetection,
} = require("./detectors/text-detector");
const { AhoCorasick } = require("./detectors/aho-corasick");
const { PATTERN_REGISTRY } = require("./config/patterns");
const { createApp } = require("./app");
const { detectText } = require("./services/detection-service");

module.exports = {
  AhoCorasick,
  DETECTION_CATEGORIES,
  PATTERN_REGISTRY,
  createPendingResult,
  createApp,
  detectText,
  isValidCategory,
  normalizeText,
  prepareDetection,
};
