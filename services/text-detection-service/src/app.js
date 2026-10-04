const { createServer } = require("node:http");
const { detectText } = require("./services/detection-service");
const { handleError } = require("./middleware/error-handler");
const { routeRequest } = require("./routes");

function createApp(options = {}) {
  const detectionService = options.detectionService || detectText;
  const logger = options.logger || console;

  return createServer((request, response) => {
    routeRequest(request, response, detectionService).catch((error) => {
      handleError(error, response, logger);
    });
  });
}

module.exports = { createApp };
