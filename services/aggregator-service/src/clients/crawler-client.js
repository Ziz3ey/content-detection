const { isObject, JsonServiceClient } = require("./json-service-client");

class CrawlerClient extends JsonServiceClient {
  crawl(config) {
    return this.post(
      "/api/v1/crawl",
      config,
      (payload) =>
        isObject(payload) &&
        payload.success === true &&
        isObject(payload.data) &&
        Array.isArray(payload.data.pages) &&
        payload.data.pages.every(
          (page) =>
            isObject(page) &&
            typeof page.url === "string" &&
            typeof page.success === "boolean",
        ),
    );
  }
}

module.exports = { CrawlerClient };
