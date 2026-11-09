const { randomUUID } = require("node:crypto");

const JOB_STATUSES = new Set(["pending", "running", "completed", "failed"]);
const JOB_TYPES = new Set(["single", "batch"]);

class ScanJobDataValidationError extends TypeError {
  constructor(message) {
    super(message);
    this.name = "ScanJobDataValidationError";
  }
}

class ScanJobDataAccessError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = "ScanJobDataAccessError";
  }
}

function normalizeOfficerEmail(email) {
  if (typeof email !== "string" || !email.trim()) {
    throw new ScanJobDataValidationError("officerEmail must be a non-empty string.");
  }
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length > 255) {
    throw new ScanJobDataValidationError("officerEmail exceeds maximum length.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new ScanJobDataValidationError("officerEmail has an invalid email format.");
  }
  return trimmed;
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    targetUrl: row.target_url,
    officerEmail: row.officer_email,
    status: row.status,
    progressScanned: row.progress_scanned,
    progressTotal: row.progress_total,
    resultSummary: row.result_summary ? JSON.parse(row.result_summary) : null,
    errorMessage: row.error_message || null,
    startedAt: row.started_at,
    completedAt: row.completed_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class ScanJobRepository {
  constructor(database) {
    this.database = database;

    this.insertStmt = database.prepare(`
      INSERT INTO scan_jobs (
        id, type, target_url, officer_email, status,
        progress_scanned, progress_total, result_summary, error_message,
        started_at, completed_at, created_at, updated_at
      ) VALUES (
        @id, @type, @targetUrl, @officerEmail, @status,
        @progressScanned, @progressTotal, @resultSummary, @errorMessage,
        @startedAt, @completedAt, @createdAt, @updatedAt
      )
    `);

    this.findByIdStmt = database.prepare(
      "SELECT * FROM scan_jobs WHERE id = ?",
    );

    this.findRunningStmt = database.prepare(
      "SELECT * FROM scan_jobs WHERE status IN ('pending', 'running') ORDER BY created_at DESC",
    );

    this.findRecentStmt = database.prepare(
      "SELECT * FROM scan_jobs ORDER BY created_at DESC LIMIT ?",
    );

    this.deleteByIdStmt = database.prepare(
      "DELETE FROM scan_jobs WHERE id = ?",
    );
  }

  create(job) {
    if (!job || typeof job !== "object") {
      throw new ScanJobDataValidationError("job must be an object.");
    }

    const id = job.id || `job-${randomUUID()}`;
    const type = JOB_TYPES.has(job.type) ? job.type : "single";
    const targetUrl = typeof job.targetUrl === "string" && job.targetUrl.trim()
      ? job.targetUrl.trim()
      : "-";
    const officerEmail = normalizeOfficerEmail(job.officerEmail);
    const status = JOB_STATUSES.has(job.status) ? job.status : "running";
    const progressScanned = Number.isInteger(job.progressScanned) ? job.progressScanned : 0;
    const progressTotal = Number.isInteger(job.progressTotal) ? job.progressTotal : 1;
    const resultSummary = job.resultSummary ? JSON.stringify(job.resultSummary) : null;
    const errorMessage = typeof job.errorMessage === "string" ? job.errorMessage : null;
    const now = new Date().toISOString();
    const startedAt = job.startedAt || now;
    const completedAt = job.completedAt || null;
    const createdAt = job.createdAt || now;
    const updatedAt = job.updatedAt || now;

    const record = {
      id,
      type,
      targetUrl,
      officerEmail,
      status,
      progressScanned,
      progressTotal,
      resultSummary,
      errorMessage,
      startedAt,
      completedAt,
      createdAt,
      updatedAt,
    };

    try {
      this.insertStmt.run(record);
      return mapRow(this.findByIdStmt.get(id));
    } catch (error) {
      throw new ScanJobDataAccessError("Could not create scan job.", error);
    }
  }

  findById(id) {
    if (typeof id !== "string" || !id.trim()) {
      throw new ScanJobDataValidationError("id must be a non-empty string.");
    }
    try {
      return mapRow(this.findByIdStmt.get(id));
    } catch (error) {
      throw new ScanJobDataAccessError("Could not read scan job.", error);
    }
  }

  update(id, fields = {}) {
    if (typeof id !== "string" || !id.trim()) {
      throw new ScanJobDataValidationError("id must be a non-empty string.");
    }

    const current = this.findById(id);
    if (!current) {
      return null;
    }

    const updates = [];
    const params = { id, updatedAt: new Date().toISOString() };

    if (fields.status !== undefined) {
      if (!JOB_STATUSES.has(fields.status)) {
        throw new ScanJobDataValidationError(`Invalid status: ${fields.status}`);
      }
      updates.push("status = @status");
      params.status = fields.status;
    }

    if (fields.progressScanned !== undefined) {
      updates.push("progress_scanned = @progressScanned");
      params.progressScanned = Number(fields.progressScanned);
    }

    if (fields.progressTotal !== undefined) {
      updates.push("progress_total = @progressTotal");
      params.progressTotal = Number(fields.progressTotal);
    }

    if (fields.resultSummary !== undefined) {
      updates.push("result_summary = @resultSummary");
      params.resultSummary = fields.resultSummary ? JSON.stringify(fields.resultSummary) : null;
    }

    if (fields.errorMessage !== undefined) {
      updates.push("error_message = @errorMessage");
      params.errorMessage = fields.errorMessage || null;
    }

    if (fields.completedAt !== undefined) {
      updates.push("completed_at = @completedAt");
      params.completedAt = fields.completedAt || null;
    }

    updates.push("updated_at = @updatedAt");

    const sql = `UPDATE scan_jobs SET ${updates.join(", ")} WHERE id = @id`;
    try {
      this.database.prepare(sql).run(params);
      return this.findById(id);
    } catch (error) {
      throw new ScanJobDataAccessError("Could not update scan job.", error);
    }
  }

  findRunning() {
    try {
      return this.findRunningStmt.all().map(mapRow);
    } catch (error) {
      throw new ScanJobDataAccessError("Could not query running scan jobs.", error);
    }
  }

  findRecent(limit = 20, options = {}) {
    const safeLimit = Number.isInteger(limit) && limit > 0 && limit <= 100 ? limit : 20;
    try {
      if (options.status && JOB_STATUSES.has(options.status)) {
        const stmt = this.database.prepare(
          "SELECT * FROM scan_jobs WHERE status = ? ORDER BY created_at DESC LIMIT ?",
        );
        return stmt.all(options.status, safeLimit).map(mapRow);
      }
      if (options.officerEmail) {
        const email = String(options.officerEmail).trim().toLowerCase();
        const stmt = this.database.prepare(
          "SELECT * FROM scan_jobs WHERE officer_email = ? ORDER BY created_at DESC LIMIT ?",
        );
        return stmt.all(email, safeLimit).map(mapRow);
      }
      return this.findRecentStmt.all(safeLimit).map(mapRow);
    } catch (error) {
      throw new ScanJobDataAccessError("Could not query recent scan jobs.", error);
    }
  }

  deleteById(id) {
    if (typeof id !== "string" || !id.trim()) {
      throw new ScanJobDataValidationError("id must be a non-empty string.");
    }
    try {
      return this.deleteByIdStmt.run(id).changes > 0;
    } catch (error) {
      throw new ScanJobDataAccessError("Could not delete scan job.", error);
    }
  }
}

module.exports = {
  ScanJobRepository,
  ScanJobDataAccessError,
  ScanJobDataValidationError,
};
