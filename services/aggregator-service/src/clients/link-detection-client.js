const { hasDetectedData, JsonServiceClient } = require("./json-service-client");

class LinkDetectionClient extends JsonServiceClient {
  detect(url) {
    return this.post(
      "/api/v1/detect",
      { url },
      (payload) =>
        hasDetectedData(payload) && Array.isArray(payload.data.indicators),
    );
  }
}

module.exports = { LinkDetectionClient };
