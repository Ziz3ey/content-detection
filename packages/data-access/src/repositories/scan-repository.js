const { randomUUID } = require("node:crypto");
const {
  DEFAULT_RECENT_LIMIT,
  MAX_CONTENT_TYPE_LENGTH,
  MAX_RECENT_LIMIT,
  MAX_TITLE_LENGTH,
  MAX_URL_LENGTH,
} = require("../config/database-config");

const SCAN_STATUSES = new Set(["success", "failed"]);
const DETECTION_STATUSES = new Set(["success", "failed", "skipped"]);

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

function validateJsonValue(value, field, ancestors = new Set()) {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new DataValidationError(`${field} contains a non-finite number.`);
    }
    return;
  }

  if (typeof value !== "object") {
    throw new DataValidationError(
      `${field} must contain JSON-compatible values.`,
    );
  }

  if (ancestors.has(value)) {
    throw new DataValidationError(
      `${field} must not contain circular references.`,
    );
  }

  if (
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null
  ) {
    throw new DataValidationError(`${field} must be a plain JSON object.`);
  }

  ancestors.add(value);
  const values = Array.isArray(value) ? value : Object.values(value);
  for (const entry of values) {
    if (entry === undefined) {
      throw new DataValidationError(
        `${field} must not contain undefined values.`,
      );
    }
    validateJsonValue(entry, field, ancestors);
  }
  ancestors.delete(value);
}

function normalizeResult(result, status, resultField, statusField) {
  if (result === undefined || result === null) {
    if (status !== undefined && !DETECTION_STATUSES.has(status)) {
      throw new DataValidationError(
        `${statusField} is not a supported status.`,
      );
    }
    return { status: status || "skipped", json: null };
  }

  if (typeof result !== "object" || Array.isArray(result)) {
    throw new DataValidationError(`${resultField} must be an object or null.`);
  }
  validateJsonValue(result, resultField);

  const inferredStatus = result.success === false ? "failed" : "success";
  const normalizedStatus = status === undefined ? inferredStatus : status;
  if (!DETECTION_STATUSES.has(normalizedStatus)) {
    throw new DataValidationError(`${statusField} is not a supported status.`);
  }
  if (
    typeof result.success === "boolean" &&
    ((result.success && normalizedStatus !== "success") ||
      (!result.success && normalizedStatus !== "failed"))
  ) {
    throw new DataValidationError(
      `${statusField} conflicts with ${resultField}.success.`,
    );
  }

  return { status: normalizedStatus, json: JSON.stringify(result) };
}

function normalizeOptionalString(value, field, maxLength) {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string" || value.length > maxLength) {
    throw new DataValidationError(
      `${field} must be a string within the configured length limit.`,
    );
  }
  return value;
}

function normalizeCrawlMetadata(value) {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new DataValidationError(
      "crawlMetadata must be a plain JSON object or null.",
    );
  }
  validateJsonValue(value, "crawlMetadata");
  return JSON.stringify(value);
}

function normalizeScan(scan) {
  if (scan === null || typeof scan !== "object" || Array.isArray(scan)) {
    throw new DataValidationError("scan must be an object.");
  }

  const url = normalizeUrl(scan.url);
  if (!SCAN_STATUSES.has(scan.crawlStatus)) {
    throw new DataValidationError("crawlStatus must be 'success' or 'failed'.");
  }

  let scannedAt;
  if (scan.scannedAt === undefined) {
    scannedAt = new Date().toISOString();
  } else if (
    typeof scan.scannedAt === "string" &&
    !Number.isNaN(Date.parse(scan.scannedAt))
  ) {
    scannedAt = new Date(scan.scannedAt).toISOString();
  } else {
    throw new DataValidationError("scannedAt must be a valid date string.");
  }

  const httpStatus = scan.httpStatus ?? null;
  if (
    httpStatus !== null &&
    (!Number.isInteger(httpStatus) || httpStatus < 100 || httpStatus > 599)
  ) {
    throw new DataValidationError(
      "httpStatus must be an HTTP status code or null.",
    );
  }

  const textDetection = normalizeResult(
    scan.textDetection,
    scan.textDetectionStatus,
    "textDetection",
    "textDetectionStatus",
  );
  const defacementDetection = normalizeResult(
    scan.defacementDetection,
    scan.defacementDetectionStatus,
    "defacementDetection",
    "defacementDetectionStatus",
  );
  const linkDetection = normalizeResult(
    scan.linkDetection,
    scan.linkDetectionStatus,
    "linkDetection",
    "linkDetectionStatus",
  );

  if (
    scan.id !== undefined &&
    (typeof scan.id !== "string" ||
      scan.id.length === 0 ||
      scan.id.length > 128)
  ) {
    throw new DataValidationError(
      "id must be a non-empty string no longer than 128 characters.",
    );
  }

  return {
    id: scan.id || randomUUID(),
    url,
    scannedAt,
    crawlStatus: scan.crawlStatus,
    httpStatus,
    contentType: normalizeOptionalString(
      scan.contentType,
      "contentType",
      MAX_CONTENT_TYPE_LENGTH,
    ),
    title: normalizeOptionalString(scan.title, "title", MAX_TITLE_LENGTH),
    crawlMetadata: normalizeCrawlMetadata(scan.crawlMetadata),
    textDetectionStatus: textDetection.status,
    textDetectionResult: textDetection.json,
    defacementDetectionStatus: defacementDetection.status,
    defacementDetectionResult: defacementDetection.json,
    linkDetectionStatus: linkDetection.status,
    linkDetectionResult: linkDetection.json,
  };
}

function mapRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    url: row.url,
    scannedAt: row.scanned_at,
    crawlStatus: row.crawl_status,
    httpStatus: row.http_status,
    contentType: row.content_type,
    title: row.title,
    crawlMetadata:
      row.crawl_metadata === null ? null : JSON.parse(row.crawl_metadata),
    textDetectionStatus: row.text_detection_status,
    textDetection:
      row.text_detection_result === null
        ? null
        : JSON.parse(row.text_detection_result),
    defacementDetectionStatus: row.defacement_detection_status,
    defacementDetection:
      row.defacement_detection_result === null
        ? null
        : JSON.parse(row.defacement_detection_result),
    linkDetectionStatus: row.link_detection_status,
    linkDetection:
      row.link_detection_result === null
        ? null
        : JSON.parse(row.link_detection_result),
  };
}

class ScanRepository {
  constructor(database) {
    this.database = database;
    this.insertStatement = database.prepare(`
      INSERT INTO scans (
        id, url, scanned_at, crawl_status, http_status, content_type, title, crawl_metadata,
        text_detection_status, text_detection_result,
        defacement_detection_status, defacement_detection_result,
        link_detection_status, link_detection_result
      ) VALUES (
        @id, @url, @scannedAt, @crawlStatus, @httpStatus, @contentType, @title, @crawlMetadata,
        @textDetectionStatus, @textDetectionResult,
        @defacementDetectionStatus, @defacementDetectionResult,
        @linkDetectionStatus, @linkDetectionResult
      )
    `);
    this.findByIdStatement = database.prepare(
      "SELECT * FROM scans WHERE id = ?",
    );
    this.findByUrlStatement = database.prepare(
      "SELECT * FROM scans WHERE url = ? ORDER BY scanned_at DESC, id DESC",
    );
    this.findRecentStatement = database.prepare(
      "SELECT * FROM scans ORDER BY scanned_at DESC, id DESC LIMIT ?",
    );
  }

  create(scan) {
    return this.createMany([scan])[0];
  }

  createMany(scans) {
    if (!Array.isArray(scans)) {
      throw new DataValidationError("scans must be an array.");
    }
    const records = scans.map(normalizeScan);
    if (records.length === 0) {
      return [];
    }

    try {
      return this.database.transaction(() => {
        for (const record of records) {
          this.insertStatement.run(record);
        }
        return records.map((record) =>
          mapRow(this.findByIdStatement.get(record.id)),
        );
      })();
    } catch (error) {
      if (error instanceof DataAccessError) {
        throw error;
      }
      const message =
        records.length === 1
          ? "Could not create scan record."
          : "Could not create scan records.";
      throw new DataAccessError(message, error);
    }
  }

  findById(id) {
    if (typeof id !== "string" || id.length === 0) {
      throw new DataValidationError("id must be a non-empty string.");
    }
    try {
      return mapRow(this.findByIdStatement.get(id));
    } catch (error) {
      throw new DataAccessError("Could not read scan record.", error);
    }
  }

  findRecent(limit = DEFAULT_RECENT_LIMIT) {
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_RECENT_LIMIT) {
      throw new DataValidationError(
        `limit must be between 1 and ${MAX_RECENT_LIMIT}.`,
      );
    }
    try {
      return this.findRecentStatement.all(limit).map(mapRow);
    } catch (error) {
      throw new DataAccessError("Could not read recent scan records.", error);
    }
  }

  findByUrl(url) {
    const normalizedUrl = normalizeUrl(url);
    try {
      return this.findByUrlStatement.all(normalizedUrl).map(mapRow);
    } catch (error) {
      throw new DataAccessError("Could not find scans for URL.", error);
    }
  }
}

module.exports = {
  DataAccessError,
  DataValidationError,
  ScanRepository,
  normalizeScan,
};
