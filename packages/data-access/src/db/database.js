const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");
const { resolveDatabasePath } = require("../config/database-config");
const { SCHEMA_SQL } = require("./schema");

function initializeDatabase(databasePath = resolveDatabasePath()) {
  if (databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const database = new Database(databasePath);
  database.pragma("foreign_keys = ON");
  database.exec(SCHEMA_SQL);
  const columns = database.pragma("table_info(scans)");
  if (!columns.some((column) => column.name === "crawl_metadata")) {
    database.exec("ALTER TABLE scans ADD COLUMN crawl_metadata TEXT");
  }
  database.pragma("user_version = 2");
  return database;
}

module.exports = { initializeDatabase };
