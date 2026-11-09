const {
  DETECTION_CATEGORIES,
  isValidCategory,
} = require("./config/categories");
const { normalizeText } = require("./utils/normalize-text");
const {
  createPendingResult,
  prepareDetection,
} = require("./detectors/text-detector");
const { AhoCorasick, isWordBoundary } = require("./detectors/aho-corasick");
const { CATEGORY_PATTERNS, PATTERN_REGISTRY } = require("./config/patterns");
const { createApp } = require("./app");
const { detectText } = require("./services/detection-service");

module.exports = {
  AhoCorasick,
  CATEGORY_PATTERNS,
  DETECTION_CATEGORIES,
  PATTERN_REGISTRY,
  createPendingResult,
  createApp,
  detectText,
  isWordBoundary,
  isValidCategory,
  normalizeText,
  prepareDetection,
};

