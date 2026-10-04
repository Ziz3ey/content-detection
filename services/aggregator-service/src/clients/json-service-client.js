class DownstreamError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "DownstreamError";
    this.code = code;
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasDetectedData(payload) {
  return (
    isObject(payload) &&
    payload.success === true &&
    isObject(payload.data) &&
    typeof payload.data.detected === "boolean"
  );
}

class JsonServiceClient {
  constructor(config, options = {}) {
    this.config = config;
    this.fetchImpl = options.fetchImpl || globalThis.fetch;
  }

  async post(path, body, validateResponse) {
    let response;
    try {
      response = await this.fetchImpl(`${this.config.url}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (error) {
      const timedOut =
        error.name === "TimeoutError" || error.name === "AbortError";
      throw new DownstreamError(
        timedOut ? "SERVICE_TIMEOUT" : "SERVICE_UNAVAILABLE",
        timedOut
          ? "Downstream service timed out."
          : "Downstream service is unavailable.",
      );
    }

    if (!response.ok) {
      try {
        await response.body?.cancel();
      } catch {
        // The response body may already be closed.
      }
      throw new DownstreamError(
        response.status >= 500
          ? "SERVICE_UNAVAILABLE"
          : "DOWNSTREAM_HTTP_ERROR",
        "Downstream service returned an HTTP error.",
      );
    }

    const contentType = (response.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (contentType !== "application/json") {
      throw new DownstreamError(
        "INVALID_DOWNSTREAM_RESPONSE",
        "Downstream response is invalid.",
      );
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new DownstreamError(
        "INVALID_DOWNSTREAM_RESPONSE",
        "Downstream response is invalid.",
      );
    }

    if (!validateResponse(payload)) {
      throw new DownstreamError(
        "INVALID_DOWNSTREAM_RESPONSE",
        "Downstream response is invalid.",
      );
    }

    return payload;
  }
}

module.exports = {
  DownstreamError,
  hasDetectedData,
  isObject,
  JsonServiceClient,
};
