const { sendJson } = require("../utils/send-json");

function healthController(_request, response) {
  sendJson(response, 200, {
    success: true,
    service: "link-detection-service",
    status: "ok",
  });
}

module.exports = { healthController };
