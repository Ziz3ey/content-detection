const { randomUUID } = require("node:crypto");
const { MAX_URL_LENGTH } = require("../config/database-config");

const SITE_STATUSES = new Set(["active", "inactive"]);

class DataValidationError extends TypeError {
  constructor(message) {
    super(message);
    this.name = "DataValidationError";
  }
}

class DataAccessError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = "DataAccessError";
  }
}

function normalizeUrl(value) {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > MAX_URL_LENGTH
  ) {
    throw new DataValidationError(
      "url must be a non-empty string within the configured length limit.",
    );
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(value);
  } catch {
    throw new DataValidationError("url must be a valid absolute URL.");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new DataValidationError("url must use HTTP or HTTPS.");
  }

  return parsedUrl.href;
}

function normalizeOptionalHtml(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    throw new DataValidationError("baselineHtml must be a string or null.");
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed.length > 1024 * 1024) {
    throw new DataValidationError("baselineHtml exceeds the configured maximum size.");
  }
  return trimmed;
}

function normalizeSite(site) {
  if (site === null || typeof site !== "object" || Array.isArray(site)) {
    throw new DataValidationError("site must be an object.");
  }

  const id = typeof site.id === "string" && site.id.trim().length > 0
    ? site.id.trim()
    : randomUUID();
  const name = typeof site.name === "string" ? site.name.trim() : "";
  if (!name) {
    throw new DataValidationError("name must be a non-empty string.");
  }
  if (name.length > 255) {
    throw new DataValidationError("name exceeds the configured maximum length.");
  }

  const url = normalizeUrl(site.url);
  const parsedUrl = new URL(url);
  const allowedHost = parsedUrl.hostname.toLowerCase();
  const status = SITE_STATUSES.has(site.status) ? site.status : "active";

  const maxDepth = Number.isInteger(site.maxDepth) ? site.maxDepth : 1;
  if (maxDepth < 0 || maxDepth > 10) {
    throw new DataValidationError("maxDepth must be an integer between 0 and 10.");
  }

  const maxPages = Number.isInteger(site.maxPages) ? site.maxPages : 20;
  if (maxPages < 1 || maxPages > 1000) {
    throw new DataValidationError("maxPages must be an integer between 1 and 1000.");
  }

  const baselineHtml = normalizeOptionalHtml(site.baselineHtml);
  const now = new Date().toISOString();

  return {
    id,
    name,
    url,
    allowedHost,
    status,
    maxDepth,
    maxPages,
    baselineHtml,
    createdAt: site.createdAt || now,
    updatedAt: site.updatedAt || now,
  };
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    allowedHost: row.allowed_host,
    status: row.status,
    maxDepth: row.max_depth,
    maxPages: row.max_pages,
    baselineHtml: row.baseline_html,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class SiteRepository {
  constructor(database) {
    this.database = database;
    this.insertStatement = database.prepare(`
      INSERT INTO sites (
        id, name, url, allowed_host, status, max_depth, max_pages, baseline_html, created_at, updated_at
      ) VALUES (
        @id, @name, @url, @allowedHost, @status, @maxDepth, @maxPages, @baselineHtml, @createdAt, @updatedAt
      )
    `);
    this.updateStatement = database.prepare(`
      UPDATE sites
      SET name = @name,
          url = @url,
          allowed_host = @allowedHost,
          status = @status,
          max_depth = @maxDepth,
          max_pages = @maxPages,
          baseline_html = @baselineHtml,
          updated_at = @updatedAt
      WHERE id = @id
    `);
    this.findByIdStatement = database.prepare("SELECT * FROM sites WHERE id = ?");
    this.findByUrlStatement = database.prepare("SELECT * FROM sites WHERE url = ?");
    this.findAllStatement = database.prepare("SELECT * FROM sites ORDER BY created_at DESC, id DESC");
    this.findActiveStatement = database.prepare("SELECT * FROM sites WHERE status = 'active' ORDER BY created_at DESC, id DESC");
    this.deleteByIdStatement = database.prepare("DELETE FROM sites WHERE id = ?");
  }

  create(site) {
    return this.createMany([site])[0];
  }

  createMany(sites) {
    if (!Array.isArray(sites)) {
      throw new DataValidationError("sites must be an array.");
    }
    const records = sites.map(normalizeSite);
    if (records.length === 0) {
      return [];
    }

    try {
      return this.database.transaction(() => {
        for (const record of records) {
          this.insertStatement.run(record);
        }
        return records.map((record) => mapRow(this.findByIdStatement.get(record.id)));
      })();
    } catch (error) {
      if (error instanceof DataAccessError) {
        throw error;
      }
      throw new DataAccessError("Could not create site records.", error);
    }
  }

  findById(id) {
    if (typeof id !== "string" || id.length === 0) {
      throw new DataValidationError("id must be a non-empty string.");
    }
    try {
      return mapRow(this.findByIdStatement.get(id));
    } catch (error) {
      throw new DataAccessError("Could not read site record.", error);
    }
  }

  findAll(status) {
    if (status === undefined) {
      return this.findAllStatement.all().map(mapRow);
    }
    if (!SITE_STATUSES.has(status)) {
      throw new DataValidationError("status must be 'active' or 'inactive'.");
    }
    const rows = this.database.prepare(
      "SELECT * FROM sites WHERE status = ? ORDER BY created_at DESC, id DESC",
    ).all(status);
    return rows.map(mapRow);
  }

  findByUrl(url) {
    const normalizedUrl = normalizeUrl(url);
    try {
      return this.findByUrlStatement.all(normalizedUrl).map(mapRow);
    } catch (error) {
      throw new DataAccessError("Could not find site records for URL.", error);
    }
  }

  update(id, updates) {
    const current = this.findById(id);
    if (!current) {
      return null;
    }

    const merged = {
      ...current,
      ...updates,
      id: current.id,
      updatedAt: new Date().toISOString(),
    };
    const record = normalizeSite(merged);
    this.updateStatement.run(record);
    return this.findById(record.id);
  }

  deleteById(id) {
    if (typeof id !== "string" || id.length === 0 || id.length > 128) {
      throw new DataValidationError(
        "id must be a non-empty string no longer than 128 characters.",
      );
    }
    try {
      return this.deleteByIdStatement.run(id).changes > 0;
    } catch (error) {
      throw new DataAccessError("Could not delete site record.", error);
    }
  }
}

module.exports = {
  DataAccessError,
  DataValidationError,
  SITE_STATUSES,
  SiteRepository,
  normalizeSite,
};
