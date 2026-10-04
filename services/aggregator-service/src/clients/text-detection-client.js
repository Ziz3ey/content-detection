const { hasDetectedData, JsonServiceClient } = require("./json-service-client");

class TextDetectionClient extends JsonServiceClient {
  detect(text) {
    return this.post(
      "/api/v1/detect",
      { text },
      (payload) =>
        hasDetectedData(payload) && Array.isArray(payload.data.categories),
    );
  }
}

module.exports = { TextDetectionClient };
