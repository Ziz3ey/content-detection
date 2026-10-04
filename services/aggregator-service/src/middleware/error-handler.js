const { HttpError } = require("../utils/http-error");
const { sendJson } = require("../utils/send-json");

function handleError(error, response, logger = console) {
  if (response.writableEnded || response.destroyed) {
    return;
  }

  if (error instanceof HttpError) {
    sendJson(response, error.statusCode, {
      success: false,
      error: { code: error.code, message: error.message },
    });
    return;
  }

  logger.error("Unhandled aggregator-service error:", error);
  sendJson(response, 500, {
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan internal." },
  });
}

module.exports = { handleError };
