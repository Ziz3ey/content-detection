class CrawlerError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "CrawlerError";
    this.code = code;
  }
}

module.exports = { CrawlerError };
