const DEFAULT_TEXT_DETECTION_URL = "http://localhost:3000";
const DEFAULT_TEXT_DETECTION_TIMEOUT_MS = 5000;
const DEFAULT_TEXT_DETECTION_MAX_RETRIES = 1;
const MAX_TEXT_DETECTION_RETRIES = 3;

function validateTextDetectionConfig(config) {
  let url;
  try {
    url = new URL(config.url);
  } catch {
    throw new TypeError(
      "TEXT_DETECTION_URL must be a valid HTTP or HTTPS URL.",
    );
  }

  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new TypeError(
      "TEXT_DETECTION_URL must be an HTTP or HTTPS base URL without credentials.",
    );
  }

  if (!Number.isSafeInteger(config.timeoutMs) || config.timeoutMs < 1) {
    throw new TypeError(
      "TEXT_DETECTION_TIMEOUT_MS must be a positive integer.",
    );
  }

  if (
    !Number.isSafeInteger(config.maxRetries) ||
    config.maxRetries < 0 ||
    config.maxRetries > MAX_TEXT_DETECTION_RETRIES
  ) {
    throw new TypeError(
      `TEXT_DETECTION_MAX_RETRIES must be between 0 and ${MAX_TEXT_DETECTION_RETRIES}.`,
    );
  }

  const basePath = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");
  return {
    url: `${url.origin}${basePath}`,
    timeoutMs: config.timeoutMs,
    maxRetries: config.maxRetries,
  };
}

function loadTextDetectionConfig(environment = process.env) {
  const config = {
    url: environment.TEXT_DETECTION_URL || DEFAULT_TEXT_DETECTION_URL,
    timeoutMs:
      environment.TEXT_DETECTION_TIMEOUT_MS === undefined
        ? DEFAULT_TEXT_DETECTION_TIMEOUT_MS
        : Number(environment.TEXT_DETECTION_TIMEOUT_MS),
    maxRetries:
      environment.TEXT_DETECTION_MAX_RETRIES === undefined
        ? DEFAULT_TEXT_DETECTION_MAX_RETRIES
        : Number(environment.TEXT_DETECTION_MAX_RETRIES),
  };

  return validateTextDetectionConfig(config);
}

module.exports = {
  DEFAULT_TEXT_DETECTION_MAX_RETRIES,
  DEFAULT_TEXT_DETECTION_TIMEOUT_MS,
  DEFAULT_TEXT_DETECTION_URL,
  loadTextDetectionConfig,
  validateTextDetectionConfig,
};
