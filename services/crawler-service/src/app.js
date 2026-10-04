const { createServer } = require("node:http");
const {
  HTTP_PORT,
  MAX_CRAWL_REQUEST_BYTES,
} = require("./config/crawler-config");
const { crawl } = require("./crawler/crawler");
const { CrawlerError } = require("./utils/crawler-error");

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(body));
}

async function readJsonBody(request) {
  const chunks = [];
  let bytesRead = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytesRead += buffer.length;
    if (bytesRead > MAX_CRAWL_REQUEST_BYTES) {
      const error = new Error("Request body exceeds limit.");
      error.statusCode = 413;
      error.code = "PAYLOAD_TOO_LARGE";
      throw error;
    }
    chunks.push(buffer);
  }

  if (bytesRead === 0) {
    return undefined;
  }

  const contentType = request.headers["content-type"]
    ?.split(";")[0]
    .trim()
    .toLowerCase();
  if (contentType !== "application/json") {
    const error = new Error("Content-Type must be application/json.");
    error.statusCode = 415;
    error.code = "UNSUPPORTED_MEDIA_TYPE";
    throw error;
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Body must be valid JSON.");
    error.statusCode = 400;
    error.code = "INVALID_JSON";
    throw error;
  }
}

function publicError(error, response, logger) {
  if (error.statusCode) {
    sendJson(response, error.statusCode, {
      success: false,
      error: { code: error.code, message: error.message },
    });
    return;
  }

  if (error instanceof TypeError || error instanceof CrawlerError) {
    sendJson(response, 400, {
      success: false,
      error: { code: "INVALID_CRAWL_CONFIG", message: error.message },
    });
    return;
  }

  logger.error("Unhandled crawler API error:", error);
  sendJson(response, 500, {
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan internal." },
  });
}

function createApp(options = {}) {
  const logger = options.logger || console;
  const crawlPages = options.crawl || crawl;

  return createServer((request, response) => {
    const { pathname } = new URL(request.url, "http://localhost");
    const operation = (async () => {
      if (pathname === "/health" && request.method === "GET") {
        sendJson(response, 200, {
          success: true,
          service: "crawler-service",
          status: "ok",
        });
        return;
      }

      if (pathname !== "/api/v1/crawl" || request.method !== "POST") {
        const error = new Error("Endpoint tidak ditemukan.");
        error.statusCode = 404;
        error.code = "NOT_FOUND";
        throw error;
      }

      const config = await readJsonBody(request);
      if (
        config === null ||
        typeof config !== "object" ||
        Array.isArray(config)
      ) {
        const error = new Error(
          "Body harus berupa object JSON konfigurasi crawler.",
        );
        error.statusCode = 400;
        error.code = "INVALID_INPUT";
        throw error;
      }

      const pages = await crawlPages(config, {
        fetchImpl: options.fetchImpl,
        logger,
        skipTextDetection: true,
      });
      sendJson(response, 200, { success: true, data: { pages } });
    })();

    operation.catch((error) => publicError(error, response, logger));
  });
}

module.exports = { createApp, HTTP_PORT };
