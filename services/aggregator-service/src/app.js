const { createServer } = require("node:http");
const {
  createDataAccess,
  resolveDatabasePath,
} = require("content-detection-data-access");
const { CrawlerClient } = require("./clients/crawler-client");
const { DefacementClient } = require("./clients/defacement-client");
const { LinkDetectionClient } = require("./clients/link-detection-client");
const { TextDetectionClient } = require("./clients/text-detection-client");
const { loadAggregatorConfig } = require("./config/aggregator-config");
const { createAggregatorService } = require("./services/aggregator-service");
const { createScanService } = require("./services/scan-service");
const { handleError } = require("./middleware/error-handler");
const { routeRequest } = require("./routes");

function createClients(config, options = {}) {
  return {
    crawler: new CrawlerClient(config.services.crawler, options),
    textDetection: new TextDetectionClient(
      config.services.textDetection,
      options,
    ),
    defacement: new DefacementClient(config.services.defacement, options),
    linkDetection: new LinkDetectionClient(
      config.services.linkDetection,
      options,
    ),
  };
}

function createApp(options = {}) {
  const config = options.config || loadAggregatorConfig(options.environment);
  const logger = options.logger || console;
  const clients =
    options.clients || createClients(config, { fetchImpl: options.fetchImpl });
  const analyze = options.analyze || createAggregatorService(clients, logger);
  const ownsDataAccess = options.dataAccess === undefined;
  const dataAccess =
    options.dataAccess ||
    createDataAccess(resolveDatabasePath(config.databasePath));
  const scan =
    options.scan ||
    createScanService({
      crawlerClient: clients.crawler,
      analyze,
      scans: dataAccess.scans,
      logger,
    });

  const server = createServer((request, response) => {
    const origin = request.headers.origin;
    response.setHeader("Vary", "Origin");
    if (origin === config.dashboardOrigin) {
      response.setHeader("Access-Control-Allow-Origin", config.dashboardOrigin);
    }

    if (request.method === "OPTIONS") {
      if (origin !== config.dashboardOrigin) {
        response.writeHead(403);
        response.end();
        return;
      }

      response.writeHead(204, {
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "600",
      });
      response.end();
      return;
    }

    routeRequest(request, response, analyze, scan, dataAccess.scans).catch(
      (error) => {
        handleError(error, response, logger);
      },
    );
  });
  if (ownsDataAccess) {
    server.once("close", () => dataAccess.close());
  }
  return server;
}

module.exports = { createApp, createClients };
