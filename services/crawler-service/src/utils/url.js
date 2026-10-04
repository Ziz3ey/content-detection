const { CrawlerError } = require("./crawler-error");

function normalizeUrl(value, baseUrl) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new CrawlerError("INVALID_URL", "URL must be a non-empty string.");
  }

  let url;
  try {
    url = baseUrl ? new URL(value, baseUrl) : new URL(value);
  } catch {
    throw new CrawlerError("INVALID_URL", "URL could not be parsed.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new CrawlerError(
      "UNSUPPORTED_PROTOCOL",
      "Only HTTP and HTTPS URLs are supported.",
    );
  }

  if (url.username || url.password) {
    throw new CrawlerError(
      "URL_CREDENTIALS_NOT_ALLOWED",
      "URLs with credentials are not allowed.",
    );
  }

  url.hash = "";
  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  }

  return url.href;
}

function normalizeAllowedHost(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError("Each allowed host must be a non-empty hostname.");
  }

  let url;
  try {
    url = new URL(`http://${value.trim()}`);
  } catch {
    throw new TypeError("Each allowed host must be a valid hostname.");
  }

  if (
    url.username ||
    url.password ||
    url.port ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new TypeError("allowedHosts entries must contain hostnames only.");
  }

  return url.hostname.toLowerCase();
}

function isAllowedUrl(value, allowedHosts) {
  try {
    const url = value instanceof URL ? value : new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    return allowedHosts.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function sanitizeUrlForLog(value) {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.href;
  } catch {
    return "[invalid-url]";
  }
}

module.exports = {
  isAllowedUrl,
  normalizeAllowedHost,
  normalizeUrl,
  sanitizeUrlForLog,
};
