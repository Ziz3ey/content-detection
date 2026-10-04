const path = require("node:path");

const REPOSITORY_ROOT = path.resolve(__dirname, "../../../..");
const DEFAULT_DATABASE_PATH = path.join(
  REPOSITORY_ROOT,
  "data",
  "scans.sqlite",
);
const MAX_RECENT_LIMIT = 100;
const DEFAULT_RECENT_LIMIT = 20;
const MAX_URL_LENGTH = 2048;
const MAX_CONTENT_TYPE_LENGTH = 255;
const MAX_TITLE_LENGTH = 2000;

function resolveDatabasePath(value = process.env.DATABASE_PATH) {
  if (!value) {
    return DEFAULT_DATABASE_PATH;
  }

  return path.isAbsolute(value) ? value : path.resolve(REPOSITORY_ROOT, value);
}

module.exports = {
  DEFAULT_DATABASE_PATH,
  DEFAULT_RECENT_LIMIT,
  MAX_CONTENT_TYPE_LENGTH,
  MAX_RECENT_LIMIT,
  MAX_TITLE_LENGTH,
  MAX_URL_LENGTH,
  resolveDatabasePath,
};
