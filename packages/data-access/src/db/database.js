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
  if (!columns.some((column) => column.name === "scan_source")) {
    database.exec("ALTER TABLE scans ADD COLUMN scan_source TEXT NOT NULL DEFAULT 'MANUAL'");
  }
  if (!columns.some((column) => column.name === "officer_email")) {
    database.exec("ALTER TABLE scans ADD COLUMN officer_email TEXT");
  }
  database.exec("CREATE INDEX IF NOT EXISTS scans_scan_source_idx ON scans(scan_source)");
  database.exec("CREATE INDEX IF NOT EXISTS scans_officer_email_idx ON scans(officer_email)");
  database.pragma("user_version = 2");
  return database;
}

module.exports = { initializeDatabase };
