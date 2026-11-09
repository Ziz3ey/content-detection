const nodemailer = require("nodemailer");
const { buildScanCompletionEmail, summarizeScanFindings } = require("./email-template");

class NotificationServiceError extends Error {
  constructor(message, code = "NOTIFICATION_ERROR") {
    super(message);
    this.name = "NotificationServiceError";
    this.code = code;
  }
}

function createNotificationService({
  config,
  notifications,
  sites,
  scans,
  transporter: customTransporter,
  logger = console,
}) {
  let transporter = customTransporter || null;

  if (!transporter && config && config.isConfigured) {
    try {
      transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.pass,
        },
        connectionTimeout: 8000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      });
    } catch (err) {
      logger.error?.("[Notification] Gagal menginisialisasi SMTP transport:", err.message);
    }
  }

  /**
   * Mengirim notifikasi email untuk hasil pemindaian yang telah selesai dan tersimpan.
   * Mendukung pengiriman per-petugas (officerEmail) dan pengiriman status selesai baik
   * ditemukan indikasi maupun tidak ditemukan indikasi (nihil).
   */
  async function notifyScanResults({
    startUrl,
    records,
    officerEmail = null,
    notifyOnClean = false,
    startedAt = null,
    completedAt = null,
  }) {
    if (!Array.isArray(records) || records.length === 0) {
      return { notified: false, reason: "NO_RECORDS" };
    }

    const summary = summarizeScanFindings(records);
    const hasIndication = Boolean(summary.hasIndication);

    // Jika tidak ditemukan indikasi dan tidak diwajibkan kirim email bersih
    // (misalnya pemindaian terjadwal tanpa indikasi atau uji coba legacy tanpa officerEmail)
    const shouldNotify = hasIndication || notifyOnClean || Boolean(officerEmail);
    if (!shouldNotify) {
      return { notified: false, reason: "NO_INDICATIONS" };
    }

    // Tentukan email penerima utama: prioritaskan email petugas yang menjalankan scan
    const normalizedOfficerEmail =
      typeof officerEmail === "string" && officerEmail.trim()
        ? officerEmail.trim().toLowerCase()
        : records[0]?.officerEmail || null;

    const targetRecipient = normalizedOfficerEmail || config?.to;

    // Ambil nama situs terdaftar jika ada
    let siteName = null;
    try {
      if (sites && typeof sites.findAll === "function") {
        const registered = sites.findAll();
        const matched = registered.find(
          (s) => s.url === startUrl || records.some((r) => r.url === s.url),
        );
        if (matched) siteName = matched.name;
      }
    } catch {
      // Abaikan kegagalan baca situs
    }

    // Tentukan record halaman yang akan dicatat status notifikasinya pada tabel notifications
    const targetPages = hasIndication ? summary.indicatedPages : [records[0]];

    // Idempotensi: periksa apakah notifikasi email sudah pernah berhasil dikirim
    const pendingPages = [];
    let alreadySentCount = 0;

    for (const page of targetPages) {
      if (!notifications || !page?.id) {
        pendingPages.push(page);
        continue;
      }
      try {
        const existing = notifications.findByScanId(page.id, "email");
        if (existing && existing.status === "sent") {
          alreadySentCount++;
        } else {
          pendingPages.push(page);
        }
      } catch {
        pendingPages.push(page);
      }
    }

    if (pendingPages.length === 0 && alreadySentCount > 0) {
      logger.info?.(`[Notification] Notifikasi email untuk scan ini sudah pernah dikirim (${alreadySentCount} record). Mencegah duplikasi.`);
      return {
        notified: false,
        reason: "DUPLICATE_PREVENTED",
        status: "sent",
        recipient: targetRecipient,
      };
    }

    const emailContent = buildScanCompletionEmail({
      siteName,
      startUrl,
      scannedAt: records[0]?.scannedAt || new Date().toISOString(),
      startedAt: startedAt || records[0]?.scannedAt,
      completedAt: completedAt || new Date().toISOString(),
      scanSource: records[0]?.scanSource || "MANUAL",
      officerEmail: targetRecipient,
      summary,
      totalPages: records.length,
    });

    // 1. Cek apakah SMTP dikonfigurasi
    if (!config || !config.isConfigured || !transporter) {
      logger.warn?.("[Notification] SMTP belum dikonfigurasi lengkap. Status notifikasi dicatat sebagai not_configured.");
      if (notifications) {
        for (const page of targetPages) {
          if (!page?.id) continue;
          try {
            notifications.updateByScanId(page.id, {
              status: "not_configured",
              recipient: targetRecipient,
              subject: emailContent.subject,
              errorMessage: "Konfigurasi SMTP belum diisi pada file konfigurasi (.env).",
            });
          } catch (err) {
            logger.error?.("[Notification] Gagal menyimpan status not_configured:", err.message);
          }
        }
      }
      return {
        notified: false,
        status: "not_configured",
        recipient: targetRecipient,
        reason: "SMTP_NOT_CONFIGURED",
      };
    }

    // 2. Tandai status awal sebagai pending
    if (notifications) {
      for (const page of targetPages) {
        if (!page?.id) continue;
        try {
          notifications.updateByScanId(page.id, {
            status: "pending",
            recipient: targetRecipient,
            subject: emailContent.subject,
            errorMessage: null,
          });
        } catch (err) {
          logger.error?.("[Notification] Gagal mencatat status pending:", err.message);
        }
      }
    }

    // 3. Kirim email melalui Nodemailer
    try {
      const mailOptions = {
        from: config.from || config.user,
        to: targetRecipient,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info?.(`[Notification] Email berhasil dikirim ke ${targetRecipient}. MessageID: ${info?.messageId || "N/A"}`);

      if (notifications) {
        const sentAt = new Date().toISOString();
        for (const page of targetPages) {
          if (!page?.id) continue;
          try {
            notifications.updateByScanId(page.id, {
              status: "sent",
              sentAt,
              recipient: targetRecipient,
              subject: emailContent.subject,
              errorMessage: null,
            });
          } catch (err) {
            logger.error?.("[Notification] Gagal mengupdate status sent:", err.message);
          }
        }
      }

      return {
        notified: true,
        status: "sent",
        recipient: targetRecipient,
        messageId: info?.messageId,
      };
    } catch (sendError) {
      logger.error?.(`[Notification] Pengiriman email ke ${targetRecipient} gagal: ${sendError.message}`);

      if (notifications) {
        for (const page of targetPages) {
          if (!page?.id) continue;
          try {
            notifications.updateByScanId(page.id, {
              status: "failed",
              recipient: targetRecipient,
              subject: emailContent.subject,
              errorMessage: sendError.message,
            });
          } catch (err) {
            logger.error?.("[Notification] Gagal mengupdate status failed:", err.message);
          }
        }
      }

      return {
        notified: false,
        status: "failed",
        recipient: targetRecipient,
        error: sendError.message,
      };
    }
  }

  /**
   * Percobaan ulang pengiriman email notifikasi untuk scan tertentu.
   * Aman dan menolak duplikasi jika email sebelumnya sudah berhasil terkirim.
   */
  async function retryScanNotification(scanId) {
    if (!scans || typeof scans.findById !== "function") {
      throw new NotificationServiceError("Scan repository tidak tersedia.", "DEPENDENCY_MISSING");
    }

    const scanRecord = scans.findById(scanId);
    if (!scanRecord) {
      throw new NotificationServiceError("Record scan tidak ditemukan.", "SCAN_NOT_FOUND");
    }

    // Periksa status notifikasi saat ini
    const existing = notifications ? notifications.findByScanId(scanId, "email") : null;
    if (existing && existing.status === "sent") {
      return {
        success: false,
        status: "sent",
        reason: "ALREADY_SENT",
        message: "Email notifikasi untuk hasil pemindaian ini sudah pernah berhasil dikirim sebelumnya (duplikasi dicegah).",
        notification: existing,
      };
    }

    const summary = summarizeScanFindings([scanRecord]);

    const result = await notifyScanResults({
      startUrl: scanRecord.url,
      records: [scanRecord],
      officerEmail: scanRecord.officerEmail,
      notifyOnClean: true,
    });

    const updatedNotification = notifications ? notifications.findByScanId(scanId, "email") : null;
    return {
      success: result.status === "sent",
      status: result.status,
      error: result.error,
      notification: updatedNotification,
    };
  }

  return {
    notifyScanResults,
    retryScanNotification,
    getTransporter: () => transporter,
    isConfigured: () => Boolean(config && config.isConfigured),
  };
}

module.exports = {
  createNotificationService,
  NotificationServiceError,
};
