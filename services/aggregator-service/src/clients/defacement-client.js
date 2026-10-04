const { hasDetectedData, JsonServiceClient } = require("./json-service-client");

class DefacementClient extends JsonServiceClient {
  detect(html, baseline) {
    return this.post(
      "/api/v1/detect",
      { html, baseline },
      (payload) =>
        hasDetectedData(payload) && Array.isArray(payload.data.indicators),
    );
  }
}

module.exports = { DefacementClient };
