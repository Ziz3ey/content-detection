const {
  CRAWLER_USER_AGENT,
  MAX_RESPONSE_BYTES,
} = require("../config/crawler-config");
const { CrawlerError } = require("../utils/crawler-error");
const { isAllowedUrl, normalizeUrl } = require("../utils/url");

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 5;

async function discardBody(response) {
  try {
    await response.body?.cancel();
  } catch {
    // The response body may already be closed.
  }
}

async function readResponseBody(response) {
  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const chunks = [];
  let bytesRead = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      bytesRead += value.byteLength;
      if (bytesRead > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new CrawlerError(
          "RESPONSE_TOO_LARGE",
          "Response exceeds the configured size limit.",
        );
      }
      chunks.push(Buffer.from(value));
    }
  } catch (error) {
    try {
      await reader.cancel();
    } catch {
      // Ignore cancellation errors while preserving the original error.
    }
    throw error;
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function fetchResource(url, options) {
  const {
    allowedHosts,
    timeoutMs,
    fetchImpl = globalThis.fetch,
    expectedContentType,
  } = options;
  let currentUrl = normalizeUrl(url);
  const redirectChain = new Set([currentUrl]);

  for (let redirectCount = 0; ; redirectCount += 1) {
    if (!isAllowedUrl(currentUrl, allowedHosts)) {
      throw new CrawlerError(
        "HOST_NOT_ALLOWED",
        "Request host is not in allowedHosts.",
      );
    }

    const response = await fetchImpl(currentUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "User-Agent": CRAWLER_USER_AGENT,
        Accept: "text/html, text/plain;q=0.9, */*;q=0.1",
      },
    });
    const status = response.status;
    const contentType = (response.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();

    if (REDIRECT_STATUSES.has(status)) {
      const location = response.headers.get("location");
      await discardBody(response);

      if (!location) {
        return {
          ok: false,
          status,
          contentType,
          finalUrl: currentUrl,
          error: {
            code: "REDIRECT_WITHOUT_LOCATION",
            message: "Redirect response has no Location header.",
          },
        };
      }

      const nextUrl = normalizeUrl(location, currentUrl);
      if (!isAllowedUrl(nextUrl, allowedHosts)) {
        return {
          ok: false,
          status,
          contentType,
          finalUrl: currentUrl,
          error: {
            code: "REDIRECT_HOST_NOT_ALLOWED",
            message: "Redirect to a host outside allowedHosts was blocked.",
          },
        };
      }

      if (redirectCount >= MAX_REDIRECTS || redirectChain.has(nextUrl)) {
        return {
          ok: false,
          status,
          contentType,
          finalUrl: currentUrl,
          error: {
            code: "REDIRECT_LIMIT",
            message: "Redirect limit or loop detected.",
          },
        };
      }

      redirectChain.add(nextUrl);
      currentUrl = nextUrl;
      continue;
    }

    if (!response.ok) {
      await discardBody(response);
      return {
        ok: false,
        status,
        contentType,
        finalUrl: currentUrl,
        error: { code: "HTTP_STATUS", message: `HTTP status ${status}.` },
      };
    }

    if (expectedContentType && contentType !== expectedContentType) {
      await discardBody(response);
      return {
        ok: false,
        status,
        contentType,
        finalUrl: currentUrl,
        error: {
          code: "UNSUPPORTED_CONTENT_TYPE",
          message: `Expected ${expectedContentType}.`,
        },
      };
    }

    const body = await readResponseBody(response);
    return { ok: true, status, contentType, finalUrl: currentUrl, body };
  }
}

module.exports = { fetchResource };
