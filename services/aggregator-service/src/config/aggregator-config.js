const MAX_URL_LENGTH = 2048;
const MAX_TEXT_LENGTH = 10000;
const MAX_HTML_LENGTH = 1024 * 1024;
const MAX_REQUEST_BYTES =
  2 * MAX_HTML_LENGTH * 6 + MAX_TEXT_LENGTH * 6 + MAX_URL_LENGTH * 6 + 16384;
const PORT = process.env.PORT ? Number(process.env.PORT) : 3004;

const DEFAULT_SERVICE_SETTINGS = Object.freeze({
  crawler: Object.freeze({ url: "http://localhost:3001", timeoutMs: 120000 }),
  textDetection: Object.freeze({
    url: "http://localhost:3000",
    timeoutMs: 5000,
  }),
  defacement: Object.freeze({ url: "http://localhost:3002", timeoutMs: 5000 }),
  linkDetection: Object.freeze({
    url: "http://localhost:3003",
    timeoutMs: 5000,
  }),
});

function normalizeServiceUrl(value, name) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError(`${name} must be a valid HTTP or HTTPS URL.`);
  }

  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new TypeError(
      `${name} must be an HTTP or HTTPS base URL without credentials.`,
    );
  }

  const basePath = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");
  return `${url.origin}${basePath}`;
}

function normalizeDashboardOrigin(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError(
      "DASHBOARD_ORIGIN must be a valid HTTP or HTTPS origin.",
    );
  }

  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new TypeError(
      "DASHBOARD_ORIGIN must be a valid HTTP or HTTPS origin.",
    );
  }

  return url.origin;
}

function readTimeout(environment, name, fallback) {
  const value =
    environment[name] === undefined ? fallback : Number(environment[name]);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new TypeError(`${name} must be a positive integer.`);
  }
  return value;
}

function loadAggregatorConfig(environment = process.env) {
  const port = environment.PORT === undefined ? PORT : Number(environment.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new TypeError("PORT must be an integer between 1 and 65535.");
  }

  return {
    port,
    databasePath: environment.DATABASE_PATH || undefined,
    dashboardOrigin: normalizeDashboardOrigin(
      environment.DASHBOARD_ORIGIN || "http://localhost:5173",
    ),
    services: {
      textDetection: {
        url: normalizeServiceUrl(
          environment.TEXT_DETECTION_URL ||
            DEFAULT_SERVICE_SETTINGS.textDetection.url,
          "TEXT_DETECTION_URL",
        ),
        timeoutMs: readTimeout(
          environment,
          "TEXT_DETECTION_TIMEOUT_MS",
          DEFAULT_SERVICE_SETTINGS.textDetection.timeoutMs,
        ),
      },
      crawler: {
        url: normalizeServiceUrl(
          environment.CRAWLER_SERVICE_URL ||
            DEFAULT_SERVICE_SETTINGS.crawler.url,
          "CRAWLER_SERVICE_URL",
        ),
        timeoutMs: readTimeout(
          environment,
          "CRAWLER_TIMEOUT_MS",
          DEFAULT_SERVICE_SETTINGS.crawler.timeoutMs,
        ),
      },
      defacement: {
        url: normalizeServiceUrl(
          environment.DEFACEMENT_SERVICE_URL ||
            DEFAULT_SERVICE_SETTINGS.defacement.url,
          "DEFACEMENT_SERVICE_URL",
        ),
        timeoutMs: readTimeout(
          environment,
          "DEFACEMENT_SERVICE_TIMEOUT_MS",
          DEFAULT_SERVICE_SETTINGS.defacement.timeoutMs,
        ),
      },
      linkDetection: {
        url: normalizeServiceUrl(
          environment.LINK_DETECTION_SERVICE_URL ||
            DEFAULT_SERVICE_SETTINGS.linkDetection.url,
          "LINK_DETECTION_SERVICE_URL",
        ),
        timeoutMs: readTimeout(
          environment,
          "LINK_DETECTION_SERVICE_TIMEOUT_MS",
          DEFAULT_SERVICE_SETTINGS.linkDetection.timeoutMs,
        ),
      },
    },
  };
}

module.exports = {
  DEFAULT_SERVICE_SETTINGS,
  MAX_HTML_LENGTH,
  MAX_REQUEST_BYTES,
  MAX_TEXT_LENGTH,
  MAX_URL_LENGTH,
  PORT,
  loadAggregatorConfig,
};
