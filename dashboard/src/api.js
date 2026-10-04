export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3004"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, code = "API_ERROR", status = null) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export function validateTargetUrl(value) {
  const input = value.trim();
  if (!input) {
    throw new ApiError("URL wajib diisi.", "INVALID_URL");
  }

  let url;
  try {
    url = new URL(input);
  } catch {
    throw new ApiError("Masukkan URL absolut yang valid.", "INVALID_URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ApiError(
      "URL hanya boleh menggunakan HTTP atau HTTPS.",
      "INVALID_URL",
    );
  }

  url.hash = "";
  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  }
  return url.href;
}

export async function requestApi(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new ApiError(
      "Server analisis tidak dapat dihubungi.",
      "API_UNAVAILABLE",
    );
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(
      "Server mengembalikan response yang tidak valid.",
      "INVALID_RESPONSE",
      response.status,
    );
  }

  if (!response.ok || payload?.success !== true) {
    throw new ApiError(
      payload?.error?.message || "Permintaan analisis gagal.",
      payload?.error?.code || "API_ERROR",
      response.status,
    );
  }

  return payload.data;
}

export function submitScan({ url, maxDepth, maxPages, baselineHtml }) {
  const targetUrl = validateTargetUrl(url);
  const parsedUrl = new URL(targetUrl);
  const baselinesByUrl = baselineHtml.trim()
    ? { [targetUrl]: baselineHtml }
    : {};

  return requestApi("/api/v1/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      crawler: {
        startUrl: targetUrl,
        allowedHosts: [parsedUrl.hostname],
        maxDepth,
        maxPages,
        requestDelayMs: 250,
        requestTimeoutMs: 10000,
      },
      baselinesByUrl,
    }),
  });
}

export function fetchRecentScans(limit = 10) {
  return requestApi(`/api/v1/scans/recent?limit=${limit}`);
}

export function fetchScanById(id) {
  return requestApi(`/api/v1/scans/${encodeURIComponent(id)}`);
}
