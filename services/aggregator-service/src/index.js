const { createApp, createClients } = require("./app");
const { loadAggregatorConfig } = require("./config/aggregator-config");
const { createAggregatorService } = require("./services/aggregator-service");
const { createScanService } = require("./services/scan-service");
const { validateAnalyzeInput } = require("./utils/validate-analyze-input");
const { validateScanInput } = require("./utils/validate-scan-input");

module.exports = {
  createAggregatorService,
  createApp,
  createClients,
  createScanService,
  loadAggregatorConfig,
  validateAnalyzeInput,
  validateScanInput,
};
