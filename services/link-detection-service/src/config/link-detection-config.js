const MAX_URL_LENGTH = 2048;
const MAX_REQUEST_BYTES = 8192;
const MAX_SUBDOMAIN_COUNT = 2;
const DOMAIN_LABEL_COUNT = 2;
const LONG_URL_INDICATOR_RATIO = 0.75;
const MIN_SUSPICIOUS_HYPHENS = 3;
const SUSPICIOUS_PATH_PATTERNS = Object.freeze([
  Object.freeze({ id: "dot_env_path", pattern: /(?:^|\/)\.env(?:\/|$)/i }),
  Object.freeze({ id: "git_metadata_path", pattern: /(?:^|\/)\.git(?:\/|$)/i }),
  Object.freeze({
    id: "wp_config_path",
    pattern: /(?:^|\/)wp-config\.php(?:\/|$)/i,
  }),
]);
const REDIRECT_QUERY_PARAMETERS = Object.freeze([
  "continue",
  "next",
  "redirect",
  "redirect_uri",
  "return",
  "return_url",
  "url",
]);
const PORT = process.env.PORT ? Number(process.env.PORT) : 3003;

module.exports = {
  MAX_REQUEST_BYTES,
  MAX_SUBDOMAIN_COUNT,
  MAX_URL_LENGTH,
  DOMAIN_LABEL_COUNT,
  LONG_URL_INDICATOR_RATIO,
  MIN_SUSPICIOUS_HYPHENS,
  PORT,
  REDIRECT_QUERY_PARAMETERS,
  SUSPICIOUS_PATH_PATTERNS,
};
