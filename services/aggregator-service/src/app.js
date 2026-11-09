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
const { createSchedulerService } = require("./services/scheduler-service");
const { createNotificationService } = require("./services/notification-service");
const { createScanWorkerService } = require("./services/scan-worker-service");
const { createAuthService } = require("./services/auth-service");
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
  const auth = options.auth || createAuthService(config.auth);
  const ownsDataAccess = options.dataAccess === undefined;
  const dataAccess =
    options.dataAccess ||
    createDataAccess(resolveDatabasePath(config.databasePath));
  const notificationService =
    options.notificationService ||
    createNotificationService({
      config: config.smtp,
      notifications: dataAccess.notifications,
      sites: dataAccess.sites,
      scans: dataAccess.scans,
      transporter: options.transporter,
      logger,
    });
  const scan =
    options.scan ||
    createScanService({
      crawlerClient: clients.crawler,
      analyze,
      scans: dataAccess.scans,
      notificationService,
      logger,
    });
  const scanWorker =
    options.scanWorker ||
    createScanWorkerService({
      scanJobs: dataAccess.scanJobs,
      scan,
      sites: dataAccess.sites,
      notificationService,
      logger,
    });
  const scheduler =
    options.scheduler ||
    createSchedulerService({
      dataAccess,
      scan,
      logger,
      enabled: options.enableScheduler !== false,
    });

  if (options.enableScheduler !== false) {
    scheduler.start();
  }

  const server = createServer((request, response) => {
    const origin = request.headers.origin;
    const isHealthCheck =
      request.url === "/health" || request.url.startsWith("/health?");
    response.setHeader("Vary", "Origin");
    if (
      origin &&
      origin !== config.dashboardOrigin &&
      !isHealthCheck
    ) {
      response.writeHead(403);
      response.end();
      return;
    }
    if (origin === config.dashboardOrigin) {
      response.setHeader("Access-Control-Allow-Origin", config.dashboardOrigin);
      response.setHeader("Access-Control-Allow-Credentials", "true");
    }

    if (request.method === "OPTIONS") {
      const reqMethod = request.headers["access-control-request-method"]?.toUpperCase();
      if (origin !== config.dashboardOrigin) {
        response.writeHead(403);
        response.end();
        return;
      }

      response.writeHead(204, {
        "Access-Control-Allow-Methods": reqMethod === "PUT" ? "GET, POST, PUT, DELETE, OPTIONS" : "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "600",
      });
      response.end();
      return;
    }

    routeRequest(
      request,
      response,
      analyze,
      scan,
      dataAccess.scans,
      dataAccess.sites,
      auth,
      dataAccess.schedules,
      scheduler,
      notificationService,
      dataAccess.notifications,
      scanWorker,
    ).catch((error) => handleError(error, response, logger));
  });

  server.scheduler = scheduler;
  server.notificationService = notificationService;
  server.scanWorker = scanWorker;

  server.once("close", () => {
    scheduler.stop();
    if (ownsDataAccess) {
      dataAccess.close();
    }
  });

  return server;
}

module.exports = { createApp, createClients };
