const {
  loadTextDetectionConfig,
  validateTextDetectionConfig,
} = require("../config/text-detection-config");

class TextDetectionClientError extends Error {
  constructor(code, message, retryable = false) {
    super(message);
    this.name = "TextDetectionClientError";
    this.code = code;
    this.retryable = retryable;
  }
}

function isDetectionResponse(payload) {
  return (
    payload !== null &&
    typeof payload === "object" &&
    payload.success === true &&
    payload.data !== null &&
    typeof payload.data === "object" &&
    typeof payload.data.detected === "boolean" &&
    Array.isArray(payload.data.categories) &&
    payload.data.categories.every(
      (category) =>
        category !== null &&
        typeof category === "object" &&
        typeof category.category === "string" &&
        Array.isArray(category.matches) &&
        category.matches.every(
          (match) =>
            match !== null &&
            typeof match === "object" &&
            typeof match.pattern === "string" &&
            Number.isInteger(match.start) &&
            Number.isInteger(match.end),
        ),
    )
  );
}

function classifyRequestError(error) {
  if (error instanceof TextDetectionClientError) {
    return error;
  }

  if (error.name === "TimeoutError" || error.name === "AbortError") {
    return new TextDetectionClientError(
      "TEXT_DETECTION_TIMEOUT",
      "Text Detection Service request timed out.",
      true,
    );
  }

  return new TextDetectionClientError(
    "TEXT_DETECTION_UNAVAILABLE",
    "Text Detection Service is unavailable.",
    true,
  );
}

class TextDetectionClient {
  constructor(config = loadTextDetectionConfig(), options = {}) {
    this.config = validateTextDetectionConfig(config);
    this.fetchImpl = options.fetchImpl || globalThis.fetch;
    this.logger = options.logger || console;
    this.endpoint = `${this.config.url}/api/v1/detect`;
  }

  async detect(text) {
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt += 1) {
      this.logger.info?.("Text detection request started.");

      try {
        const response = await this.fetchImpl(this.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: AbortSignal.timeout(this.config.timeoutMs),
        });

        if (!response.ok) {
          try {
            await response.body?.cancel();
          } catch {
            // The response body may already be closed.
          }

          const retryable = response.status >= 500;
          throw new TextDetectionClientError(
            "TEXT_DETECTION_HTTP_ERROR",
            "Text Detection Service returned an HTTP error.",
            retryable,
          );
        }

        const contentType = (response.headers.get("content-type") || "")
          .split(";")[0]
          .trim()
          .toLowerCase();
        if (contentType !== "application/json") {
          throw new TextDetectionClientError(
            "TEXT_DETECTION_INVALID_RESPONSE",
            "Text Detection Service returned an invalid response.",
          );
        }

        let payload;
        try {
          payload = await response.json();
        } catch {
          throw new TextDetectionClientError(
            "TEXT_DETECTION_INVALID_RESPONSE",
            "Text Detection Service returned an invalid response.",
          );
        }

        if (!isDetectionResponse(payload)) {
          throw new TextDetectionClientError(
            "TEXT_DETECTION_INVALID_RESPONSE",
            "Text Detection Service returned an invalid response.",
          );
        }

        this.logger.info?.("Text detection response received.");
        return payload;
      } catch (error) {
        const clientError = classifyRequestError(error);
        if (clientError.retryable && attempt < this.config.maxRetries) {
          this.logger.warn?.(`Text detection request retry ${attempt + 1}.`);
          continue;
        }

        this.logger.error?.(
          `Text detection request failed: ${clientError.code}.`,
        );
        throw clientError;
      }
    }

    throw new TextDetectionClientError(
      "TEXT_DETECTION_UNAVAILABLE",
      "Text Detection Service is unavailable.",
      false,
    );
  }
}

module.exports = { TextDetectionClient, TextDetectionClientError };
