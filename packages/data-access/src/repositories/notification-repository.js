const { randomUUID } = require("node:crypto");

const NOTIFICATION_STATUSES = new Set([
  "pending",
  "sent",
  "failed",
  "not_configured",
]);

class NotificationDataValidationError extends TypeError {
  constructor(message) {
    super(message);
    this.name = "NotificationDataValidationError";
  }
}

class NotificationDataAccessError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = "NotificationDataAccessError";
  }
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    scanId: row.scan_id,
    channel: row.channel,
    recipient: row.recipient,
    subject: row.subject,
    status: row.status,
    errorMessage: row.error_message,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class NotificationRepository {
  constructor(database) {
    this.database = database;
    this.insertStatement = database.prepare(`
      INSERT INTO notifications (
        id, scan_id, channel, recipient, subject, status, error_message, sent_at, created_at, updated_at
      ) VALUES (
        @id, @scanId, @channel, @recipient, @subject, @status, @errorMessage, @sentAt, @createdAt, @updatedAt
      )
    `);
    this.findByScanIdStatement = database.prepare(
      "SELECT * FROM notifications WHERE scan_id = ? AND channel = ?",
    );
    this.findByIdStatement = database.prepare(
      "SELECT * FROM notifications WHERE id = ?",
    );
    this.updateByScanIdStatement = database.prepare(`
      UPDATE notifications
      SET status = @status,
          recipient = COALESCE(@recipient, recipient),
          subject = COALESCE(@subject, subject),
          error_message = @errorMessage,
          sent_at = @sentAt,
          updated_at = @updatedAt
      WHERE scan_id = @scanId AND channel = @channel
    `);
    this.deleteByScanIdStatement = database.prepare(
      "DELETE FROM notifications WHERE scan_id = ?",
    );
    this.listRecentStatement = database.prepare(
      "SELECT * FROM notifications ORDER BY created_at DESC, id DESC LIMIT ?",
    );
  }

  create(data) {
    if (!data || typeof data !== "object") {
      throw new NotificationDataValidationError("Notification data must be an object.");
    }
    if (typeof data.scanId !== "string" || data.scanId.trim().length === 0) {
      throw new NotificationDataValidationError("scanId must be a non-empty string.");
    }
    const status = data.status || "pending";
    if (!NOTIFICATION_STATUSES.has(status)) {
      throw new NotificationDataValidationError(`Invalid status '${status}'. Must be one of: ${Array.from(NOTIFICATION_STATUSES).join(", ")}`);
    }

    const now = new Date().toISOString();
    const record = {
      id: data.id || randomUUID(),
      scanId: data.scanId.trim(),
      channel: data.channel || "email",
      recipient: data.recipient || null,
      subject: data.subject || null,
      status,
      errorMessage: data.errorMessage || null,
      sentAt: data.sentAt || null,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };

    try {
      this.insertStatement.run(record);
      return mapRow(this.findByIdStatement.get(record.id));
    } catch (error) {
      throw new NotificationDataAccessError("Could not create notification record.", error);
    }
  }

  findByScanId(scanId, channel = "email") {
    if (typeof scanId !== "string" || scanId.trim().length === 0) {
      throw new NotificationDataValidationError("scanId must be a non-empty string.");
    }
    try {
      return mapRow(this.findByScanIdStatement.get(scanId.trim(), channel));
    } catch (error) {
      throw new NotificationDataAccessError("Could not find notification by scanId.", error);
    }
  }

  findById(id) {
    if (typeof id !== "string" || id.trim().length === 0) {
      throw new NotificationDataValidationError("id must be a non-empty string.");
    }
    try {
      return mapRow(this.findByIdStatement.get(id.trim()));
    } catch (error) {
      throw new NotificationDataAccessError("Could not find notification by id.", error);
    }
  }

  updateByScanId(scanId, updates, channel = "email") {
    if (typeof scanId !== "string" || scanId.trim().length === 0) {
      throw new NotificationDataValidationError("scanId must be a non-empty string.");
    }
    if (!updates || typeof updates !== "object") {
      throw new NotificationDataValidationError("updates must be an object.");
    }
    if (updates.status && !NOTIFICATION_STATUSES.has(updates.status)) {
      throw new NotificationDataValidationError(`Invalid status '${updates.status}'.`);
    }

    const existing = this.findByScanId(scanId, channel);
    if (!existing) {
      // Create if it doesn't exist yet
      return this.create({
        scanId,
        channel,
        ...updates,
      });
    }

    const now = new Date().toISOString();
    try {
      this.updateByScanIdStatement.run({
        scanId: scanId.trim(),
        channel,
        status: updates.status || existing.status,
        recipient: updates.recipient !== undefined ? updates.recipient : existing.recipient,
        subject: updates.subject !== undefined ? updates.subject : existing.subject,
        errorMessage: updates.errorMessage !== undefined ? updates.errorMessage : existing.errorMessage,
        sentAt: updates.sentAt !== undefined ? updates.sentAt : existing.sentAt,
        updatedAt: now,
      });
      return this.findByScanId(scanId, channel);
    } catch (error) {
      throw new NotificationDataAccessError("Could not update notification record.", error);
    }
  }

  deleteByScanId(scanId) {
    if (typeof scanId !== "string" || scanId.trim().length === 0) {
      throw new NotificationDataValidationError("scanId must be a non-empty string.");
    }
    try {
      return this.deleteByScanIdStatement.run(scanId.trim()).changes > 0;
    } catch (error) {
      throw new NotificationDataAccessError("Could not delete notification by scanId.", error);
    }
  }

  listRecent(limit = 50) {
    const validLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    try {
      return this.listRecentStatement.all(validLimit).map(mapRow);
    } catch (error) {
      throw new NotificationDataAccessError("Could not list recent notifications.", error);
    }
  }
}

module.exports = {
  NotificationRepository,
  NotificationDataAccessError,
  NotificationDataValidationError,
};
