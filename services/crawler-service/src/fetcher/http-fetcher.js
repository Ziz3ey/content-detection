const dns = require("node:dns/promises");
const net = require("node:net");
const {
  CRAWLER_USER_AGENT,
  MAX_RESPONSE_BYTES,
} = require("../config/crawler-config");
const { CrawlerError } = require("../utils/crawler-error");
const { isAllowedUrl, normalizeUrl } = require("../utils/url");

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 5;

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    if (parts[0] === 10) return true; // 10.0.0.0/8
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // 172.16.0.0/12
    if (parts[0] === 192 && parts[1] === 168) return true; // 192.168.0.0/16
    if (parts[0] === 127) return true; // 127.0.0.0/8 loopback
    if (parts[0] === 169 && parts[1] === 254) return true; // 169.254.0.0/16 link-local
    if (parts[0] === 0) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") return true;
    if (lower.startsWith("fe80:")) return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    return false;
  }
  return false;
}

async function validateDnsResolution(hostname, blockPrivateIps = false) {
  if (!blockPrivateIps) return;
  try {
    const lookup = await dns.lookup(hostname, { all: true });
    for (const record of lookup) {
      if (isPrivateIp(record.address)) {
        throw new CrawlerError(
          "SSRF_BLOCKED",
          `Resolving host ${hostname} points to private/restricted IP ${record.address}.`,
        );
      }
    }
  } catch (err) {
    if (err instanceof CrawlerError) throw err;
    // Let network errors be handled naturally by fetchImpl
  }
}

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
    blockPrivateIps = process.env.BLOCK_PRIVATE_IPS === "true",
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

    if (blockPrivateIps) {
      const parsed = new URL(currentUrl);
      await validateDnsResolution(parsed.hostname, true);
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

      let nextUrl;
      try {
        const parsedRedirect = new URL(location, currentUrl);
        parsedRedirect.hash = "";
        nextUrl = parsedRedirect.href;
      } catch {
        nextUrl = normalizeUrl(location, currentUrl);
      }
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
      const isAccessDenied = status === 403 || status === 401;
      return {
        ok: false,
        status,
        contentType,
        finalUrl: currentUrl,
        error: {
          code: isAccessDenied ? "ACCESS_DENIED" : "HTTP_STATUS",
          message: isAccessDenied
            ? `Akses ditolak oleh server target (HTTP ${status}).`
            : `Gagal mengambil halaman (HTTP status ${status}).`,
        },
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
          message: `Tipe konten '${contentType || "tidak dikenal"}' tidak didukung (diharapkan ${expectedContentType}).`,
        },
      };
    }

    const body = await readResponseBody(response);
    return { ok: true, status, contentType, finalUrl: currentUrl, body };
  }
}

module.exports = {
  fetchResource,
  isPrivateIp,
  validateDnsResolution,
};
