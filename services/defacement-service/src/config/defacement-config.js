const MAX_HTML_LENGTH = 1024 * 1024;
const MAX_REQUEST_BYTES = 2 * MAX_HTML_LENGTH + 64 * 1024;
const PORT = process.env.PORT ? Number(process.env.PORT) : 3002;

const DEFACEMENT_PATTERNS = Object.freeze([
  Object.freeze({ id: "hacked_by", value: "hacked by" }),
  Object.freeze({ id: "site_defaced", value: "site has been defaced" }),
]);

module.exports = {
  DEFACEMENT_PATTERNS,
  MAX_HTML_LENGTH,
  MAX_REQUEST_BYTES,
  PORT,
};
