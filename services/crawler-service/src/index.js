const { crawl } = require("./crawler/crawler");
const { parseHtml } = require("./parser/html-parser");
const { isAllowedByRobots, parseRobotsTxt } = require("./crawler/robots-txt");
const {
  isAllowedUrl,
  normalizeAllowedHost,
  normalizeUrl,
} = require("./utils/url");
const { validateCrawlerConfig } = require("./config/crawler-config");
const { loadTextDetectionConfig } = require("./config/text-detection-config");
const { TextDetectionClient } = require("./client/text-detection-client");

module.exports = {
  crawl,
  isAllowedByRobots,
  isAllowedUrl,
  loadTextDetectionConfig,
  normalizeAllowedHost,
  normalizeUrl,
  parseHtml,
  parseRobotsTxt,
  validateCrawlerConfig,
  TextDetectionClient,
};
