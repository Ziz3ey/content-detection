const { createServer } = require("node:http");
const { analyzeUrl } = require("./services/link-detection-service");
const { handleError } = require("./middleware/error-handler");
const { routeRequest } = require("./routes");

function createApp(options = {}) {
  const analyze = options.analyze || analyzeUrl;
  const logger = options.logger || console;

  return createServer((request, response) => {
    routeRequest(request, response, analyze).catch((error) => {
      handleError(error, response, logger);
    });
  });
}

module.exports = { createApp };
