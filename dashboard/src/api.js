export const API_BASE_URL = (
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:3004"
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
  const input = String(value || "").trim();
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

export function validateOfficerEmail(value) {
  const input = String(value || "").trim();
  if (!input) {
    throw new ApiError(
      "Email petugas wajib diisi untuk menerima notifikasi hasil pemindaian.",
      "INVALID_EMAIL",
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
    throw new ApiError(
      "Masukkan format alamat email yang valid (contoh: nama@domain.go.id).",
      "INVALID_EMAIL",
    );
  }
  return input.toLowerCase();
}

export async function requestApi(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
      ...options,
    });
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

export function loginAdmin(username, password) {
  return requestApi("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

export function fetchAuthSession() {
  return requestApi("/api/v1/auth/session");
}

export function logoutAdmin() {
  return requestApi("/api/v1/auth/logout", {
    method: "POST",
  });
}

export function submitScan({
  url,
  maxDepth,
  maxPages,
  baselineHtml,
  officerEmail,
  background = true,
}) {
  const targetUrl = validateTargetUrl(url);
  const parsedUrl = new URL(targetUrl);
  const baselinesByUrl =
    baselineHtml && baselineHtml.trim()
      ? { [targetUrl]: baselineHtml.trim() }
      : {};

  const payload = {
    crawler: {
      startUrl: targetUrl,
      allowedHosts: [parsedUrl.hostname],
      maxDepth: Number(maxDepth),
      maxPages: Number(maxPages),
      requestDelayMs: 250,
      requestTimeoutMs: 10000,
    },
    baselinesByUrl,
    background: Boolean(background),
  };

  if (officerEmail !== undefined && officerEmail !== null) {
    payload.officerEmail = validateOfficerEmail(officerEmail);
  }

  return requestApi("/api/v1/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function fetchScanJob(id) {
  return requestApi(`/api/v1/scans/jobs/${encodeURIComponent(id)}`);
}

export function fetchScanJobs(options = {}) {
  let query = `?limit=${options.limit || 20}`;
  if (options.status) {
    query += `&status=${encodeURIComponent(options.status)}`;
  }
  if (options.officerEmail) {
    query += `&officerEmail=${encodeURIComponent(options.officerEmail)}`;
  }
  return requestApi(`/api/v1/scans/jobs${query}`);
}

export function fetchRecentScans(limit = 10, options = {}) {
  let query = `?limit=${limit}`;
  const source = typeof options === "string" ? options : options?.source;
  if (source && (source === "MANUAL" || source === "SCHEDULED")) {
    query += `&source=${source}`;
  }
  return requestApi(`/api/v1/scans/recent${query}`);
}

export function fetchScanById(id) {
  return requestApi(`/api/v1/scans/${encodeURIComponent(id)}`);
}

export function resendScanEmail(id) {
  return requestApi(`/api/v1/scans/${encodeURIComponent(id)}/resend-email`, {
    method: "POST",
  });
}

export function deleteScanById(id) {
  return requestApi(`/api/v1/scans/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function fetchSites() {
  const data = await requestApi("/api/v1/sites");
  return Array.isArray(data?.sites) ? data.sites : [];
}

export async function createSite(site) {
  const data = await requestApi("/api/v1/sites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(site),
  });
  return data?.site || null;
}

export async function updateSite(id, site) {
  const data = await requestApi(`/api/v1/sites/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(site),
  });
  return data?.site || null;
}

export async function deleteSite(id) {
  return requestApi(`/api/v1/sites/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function submitSiteScan({
  siteIds,
  maxDepth,
  maxPages,
  officerEmail,
  background = true,
}) {
  const ids = Array.isArray(siteIds) ? siteIds.filter(Boolean) : [];
  if (ids.length === 0) {
    throw new ApiError(
      "Pilih minimal satu situs aktif untuk dipindai.",
      "INVALID_SITE_SELECTION",
    );
  }
  const payload = {
    siteIds: ids,
    maxDepth,
    maxPages,
    background: Boolean(background),
  };
  if (officerEmail !== undefined && officerEmail !== null) {
    payload.officerEmail = validateOfficerEmail(officerEmail);
  }
  const data = await requestApi("/api/v1/scan-sites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return data;
}

export async function fetchSchedules() {
  const data = await requestApi("/api/v1/schedules");
  return Array.isArray(data?.schedules) ? data.schedules : [];
}

export async function createSchedule(schedule) {
  const data = await requestApi("/api/v1/schedules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(schedule),
  });
  return data?.schedule || null;
}

export async function updateSchedule(id, schedule) {
  const data = await requestApi(`/api/v1/schedules/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(schedule),
  });
  return data?.schedule || null;
}

export async function deleteSchedule(id) {
  return requestApi(`/api/v1/schedules/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function runScheduleNow(id) {
  const data = await requestApi(`/api/v1/schedules/${encodeURIComponent(id)}/run-now`, {
    method: "POST",
  });
  return data;
}
