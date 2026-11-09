/**
 * Template dan formatter email notifikasi indikasi konten negatif.
 * Sesuai format standar surat peringatan keamanan sistem informasi pemerintah
 * Kabupaten Sumbawa.
 */

const CATEGORY_NAMES = {
  gambling: "Judi Online (Gambling)",
  pornography: "Pornografi",
  fraud: "Penipuan / Phishing (Fraud)",
  suspicious_link: "Tautan Mencurigakan (Suspicious Link)",
  defacement: "Perubahan Halaman Tidak Sah (Defacement)",
};

function escapeHtml(str) {
  if (typeof str !== "string") return String(str ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatWitaTime(dateString) {
  try {
    const d = dateString ? new Date(dateString) : new Date();
    if (Number.isNaN(d.getTime())) return String(dateString || "-");
    const formatted = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Makassar",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(d);
    return `${formatted} WITA`;
  } catch {
    return String(dateString || "-");
  }
}

/**
 * Menganalisis dan merangkum seluruh temuan indikasi konten negatif dari record pemindaian.
 * Hanya memuat data yang benar-benar ada di dalam database hasil deteksi.
 */
function summarizeScanFindings(records = []) {
  const list = Array.isArray(records) ? records : [records];
  const indicatedPages = [];
  const categoryCounts = {};
  let totalFindings = 0;

  for (const page of list) {
    if (!page) continue;
    const pageFindings = [];

    // 1. Text detection (Aho-Corasick matches)
    const textData = page.textDetection?.data;
    if (page.textDetection?.success === true && textData?.detected === true) {
      for (const cat of textData.categories || []) {
        const catLabel = CATEGORY_NAMES[cat.category] || cat.category;
        const matches = Array.isArray(cat.matches) ? cat.matches : [];
        if (matches.length > 0) {
          categoryCounts[catLabel] = (categoryCounts[catLabel] || 0) + matches.length;
          totalFindings += matches.length;
          for (const match of matches) {
            pageFindings.push({
              category: catLabel,
              type: "Pencocokan Pola Teks (Aho-Corasick)",
              detail: match.pattern,
            });
          }
        }
      }
    }

    // 2. Link detection
    const linkData = page.linkDetection?.data;
    if (page.linkDetection?.success === true && linkData?.detected === true) {
      const catLabel = CATEGORY_NAMES.suspicious_link;
      const links = Array.isArray(linkData.links) ? linkData.links : [];
      if (links.length > 0) {
        for (const link of links) {
          const indicators = Array.isArray(link.indicators) ? link.indicators : [];
          for (const ind of indicators) {
            categoryCounts[catLabel] = (categoryCounts[catLabel] || 0) + 1;
            totalFindings += 1;
            pageFindings.push({
              category: catLabel,
              type: ind.type || "Tautan Mencurigakan",
              detail: `${link.url} — ${ind.description || "Indikasi tautan mencurigakan"}`,
            });
          }
        }
      } else if (Array.isArray(linkData.indicators)) {
        for (const ind of linkData.indicators) {
          categoryCounts[catLabel] = (categoryCounts[catLabel] || 0) + 1;
          totalFindings += 1;
          pageFindings.push({
            category: catLabel,
            type: ind.type || "Tautan Mencurigakan",
            detail: ind.description || "Indikasi tautan mencurigakan",
          });
        }
      }
    }

    // 3. Defacement detection
    const defacementData = page.defacementDetection?.data;
    if (page.defacementDetection?.success === true && defacementData?.detected === true) {
      const catLabel = CATEGORY_NAMES.defacement;
      const indicators = Array.isArray(defacementData.indicators) ? defacementData.indicators : [];
      if (indicators.length > 0) {
        for (const ind of indicators) {
          categoryCounts[catLabel] = (categoryCounts[catLabel] || 0) + 1;
          totalFindings += 1;
          pageFindings.push({
            category: catLabel,
            type: ind.type || "Perubahan Halaman",
            detail: ind.description || "Perubahan konten terdeteksi dibandingkan baseline",
          });
        }
      }
    }

    if (pageFindings.length > 0) {
      indicatedPages.push({
        id: page.id,
        url: page.url,
        title: page.title || "Tanpa Judul",
        scannedAt: page.scannedAt,
        scanSource: page.scanSource || "MANUAL",
        findings: pageFindings,
      });
    }
  }

  return {
    hasIndication: indicatedPages.length > 0,
    totalFindings,
    categoryCounts,
    indicatedPages,
  };
}

/**
 * Menghasilkan konten email profesional (HTML dan Plain Text).
 * Mendukung hasil yang terindikasi konten negatif maupun hasil pemindaian bersih (nihil indikasi).
 */
function buildScanCompletionEmail({
  siteName,
  startUrl,
  scannedAt,
  startedAt,
  completedAt,
  scanSource = "MANUAL",
  officerEmail = null,
  summary,
  totalPages = 0,
}) {
  const targetHost = (() => {
    try {
      return new URL(startUrl).hostname;
    } catch {
      return startUrl || "Website Pemerintah";
    }
  })();

  const displayName = siteName || targetHost;
  const startTime = startedAt || scannedAt;
  const finishTime = completedAt || scannedAt || new Date().toISOString();
  const startFormatted = formatWitaTime(startTime);
  const finishFormatted = formatWitaTime(finishTime);
  const sourceLabel =
    scanSource === "SCHEDULED"
      ? "Pemeriksaan Terjadwal Otomatis"
      : "Pemeriksaan Mandiri Petugas";

  const hasIndication = Boolean(summary?.hasIndication);
  const effectiveTotalPages = totalPages || summary?.indicatedPages?.length || 1;

  // Subjek & Judul Email
  const subject = hasIndication
    ? `[PERINGATAN] Indikasi Konten Negatif Terdeteksi pada Website Pemerintah: ${displayName}`
    : `Pemindaian Website Pemerintah Kabupaten Sumbawa Telah Selesai: ${displayName}`;

  const headerBgColor = hasIndication ? "#991b1b" : "#065f46";
  const headerSubtitleColor = hasIndication ? "#fecaca" : "#a7f3d0";
  const bannerBgColor = hasIndication ? "#fef2f2" : "#f0fdf4";
  const bannerBorderColor = hasIndication ? "#ef4444" : "#10b981";
  const bannerTextColor = hasIndication ? "#991b1b" : "#065f46";

  const bannerTitle = hasIndication
    ? "PERINGATAN: INDIKASI KONTEN NEGATIF TERDETEKSI"
    : "PEMINDAIAN WEBSITE PEMERINTAH KABUPATEN SUMBAWA TELAH SELESAI";

  const bannerSubtitle = hasIndication
    ? `Ditemukan ${summary.totalFindings} indikasi pada ${summary.indicatedPages.length} halaman yang diperiksa.`
    : `Pemeriksaan selesai. Tidak ditemukan indikasi konten negatif pada ${effectiveTotalPages} halaman yang diperiksa.`;

  const statusBadgeText = hasIndication
    ? "SELESAI (TERINDIKASI KONTEN NEGATIF)"
    : "SELESAI (BERSIH / TIDAK DITEMUKAN INDIKASI)";

  const statusBadgeColor = hasIndication ? "#b91c1c" : "#047857";

  // Kategori & breakdown baris (jika ada indikasi)
  const categoryRows = Object.entries(summary.categoryCounts || {})
    .map(
      ([cat, count]) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 500; color: #1f2937;">${escapeHtml(cat)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 700; color: #b91c1c;">${count} temuan</td>
      </tr>`,
    )
    .join("");

  // Daftar halaman terindikasi beserta rincian temuan
  const pagesDetailHtml = (summary.indicatedPages || [])
    .map(
      (p, idx) => `
      <div style="margin-top: 16px; padding: 14px; background: #ffffff; border: 1px solid #e5e7eb; border-left: 4px solid #dc2626; border-radius: 6px;">
        <div style="font-size: 13px; font-weight: 700; color: #991b1b; text-transform: uppercase; margin-bottom: 4px;">
          Halaman #${idx + 1}
        </div>
        <div style="font-size: 14px; font-weight: 600; color: #111827; word-break: break-all;">
          <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer" style="color: #1d4ed8; text-decoration: none;">${escapeHtml(p.url)}</a>
        </div>
        ${p.title ? `<div style="font-size: 12px; color: #6b7280; margin-top: 2px;">Judul: ${escapeHtml(p.title)}</div>` : ""}
        
        <table style="width: 100%; margin-top: 10px; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f9fafb; text-align: left; color: #4b5563;">
              <th style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb;">Kategori</th>
              <th style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb;">Jenis Indikasi</th>
              <th style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb;">Detail Temuan</th>
            </tr>
          </thead>
          <tbody>
            ${p.findings
              .map(
                (f) => `
              <tr>
                <td style="padding: 6px 10px; border-bottom: 1px solid #f3f4f6; color: #991b1b; font-weight: 600;">${escapeHtml(f.category)}</td>
                <td style="padding: 6px 10px; border-bottom: 1px solid #f3f4f6; color: #374151;">${escapeHtml(f.type)}</td>
                <td style="padding: 6px 10px; border-bottom: 1px solid #f3f4f6; color: #1f2937; font-family: monospace, Consolas, sans-serif; word-break: break-all;">${escapeHtml(f.detail)}</td>
              </tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </div>`,
    )
    .join("");

  // Template HTML Email yang bersih, formal, dan responsif
  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 640px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;">
          
          <!-- Header Lembaga -->
          <tr>
            <td style="background-color: ${headerBgColor}; padding: 20px 24px; color: #ffffff;">
              <div style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 700; color: ${headerSubtitleColor};">
                PEMERINTAH KABUPATEN SUMBAWA
              </div>
              <h1 style="margin: 6px 0 0; font-size: 18px; font-weight: 700; line-height: 1.3;">
                Sistem Pemantauan dan Deteksi Indikasi Konten Negatif
              </h1>
              <div style="margin-top: 4px; font-size: 12px; color: ${headerSubtitleColor};">
                Algoritma Aho-Corasick &bull; Pemantauan Web Terintegrasi
              </div>
            </td>
          </tr>

          <!-- Banner Status -->
          <tr>
            <td style="background-color: ${bannerBgColor}; border-bottom: 2px solid ${bannerBorderColor}; padding: 14px 24px;">
              <table role="presentation" width="100%">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="font-size: 14px; font-weight: 700; color: ${bannerTextColor};">
                      ${escapeHtml(bannerTitle)}
                    </div>
                    <div style="font-size: 12px; color: #374151; margin-top: 2px;">
                      ${escapeHtml(bannerSubtitle)}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Konten -->
          <tr>
            <td style="padding: 24px;">
              <p style="margin-top: 0; font-size: 14px; color: #374151;">
                Yth. Petugas / Administrator Sistem Informasi Pemerintah Kabupaten Sumbawa,
              </p>
              <p style="font-size: 14px; color: #374151;">
                Melalui surat elektronik otomatis ini diberitahukan bahwa proses pemindaian website telah selesai dilaksanakan dengan rincian berikut:
              </p>

              <!-- Informasi Ringkasan Website & Petugas -->
              <table role="presentation" width="100%" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; font-size: 13px; margin: 16px 0;">
                <tr>
                  <td style="padding: 6px 10px; width: 38%; color: #6b7280; font-weight: 500;">Nama Website:</td>
                  <td style="padding: 6px 10px; color: #111827; font-weight: 600;">${escapeHtml(displayName)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; color: #6b7280; font-weight: 500;">URL Website:</td>
                  <td style="padding: 6px 10px; color: #1d4ed8; word-break: break-all;">
                    <a href="${escapeHtml(startUrl)}" target="_blank" rel="noopener noreferrer" style="color: #1d4ed8;">${escapeHtml(startUrl)}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; color: #6b7280; font-weight: 500;">Email Petugas:</td>
                  <td style="padding: 6px 10px; color: #111827; font-weight: 600;">${escapeHtml(officerEmail || "-")}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; color: #6b7280; font-weight: 500;">Waktu Mulai:</td>
                  <td style="padding: 6px 10px; color: #111827;">${escapeHtml(startFormatted)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; color: #6b7280; font-weight: 500;">Waktu Selesai:</td>
                  <td style="padding: 6px 10px; color: #111827;">${escapeHtml(finishFormatted)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; color: #6b7280; font-weight: 500;">Metode Pemeriksaan:</td>
                  <td style="padding: 6px 10px; color: #111827;">${escapeHtml(sourceLabel)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; color: #6b7280; font-weight: 500;">Halaman Diperiksa:</td>
                  <td style="padding: 6px 10px; color: #111827; font-weight: 600;">${effectiveTotalPages} halaman</td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; color: #6b7280; font-weight: 500;">Jumlah Indikasi:</td>
                  <td style="padding: 6px 10px; font-weight: 700; color: ${statusBadgeColor};">${summary.totalFindings} indikasi</td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; color: #6b7280; font-weight: 500;">Status Pemindaian:</td>
                  <td style="padding: 6px 10px; font-weight: 700; color: ${statusBadgeColor};">${statusBadgeText}</td>
                </tr>
              </table>

              ${
                hasIndication
                  ? `
              <!-- Tabel Rekapitulasi Kategori -->
              <div style="margin-top: 20px;">
                <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 8px;">
                  Ringkasan Kategori Indikasi yang Ditemukan
                </div>
                <table role="presentation" width="100%" style="border-collapse: collapse; font-size: 13px; border: 1px solid #e5e7eb; border-radius: 6px;">
                  <thead>
                    <tr style="background-color: #f3f4f6; color: #374151; font-weight: 600;">
                      <th style="padding: 8px 12px; text-align: left; border-bottom: 1px solid #e5e7eb;">Kategori Konten</th>
                      <th style="padding: 8px 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">Jumlah Temuan</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${categoryRows}
                  </tbody>
                </table>
              </div>

              <!-- Rincian Tiap Halaman -->
              <div style="margin-top: 24px;">
                <div style="font-size: 14px; font-weight: 700; color: #111827;">
                  Rincian Halaman dan Hasil Deteksi
                </div>
                ${pagesDetailHtml}
              </div>

              <!-- Disclaimer Verifikasi Petugas -->
              <div style="margin-top: 24px; padding: 14px; background-color: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; border-radius: 6px; font-size: 12px; color: #92400e; line-height: 1.5;">
                <strong>Pemberitahuan Penting:</strong>
                <p style="margin: 4px 0 0;">
                  Informasi di atas merupakan hasil <strong>indikasi awal</strong> dari pencocokan pola algoritma Aho-Corasick dan inspeksi otomatis. Hasil ini memerlukan <strong>pemeriksaan manual serta konfirmasi langsung oleh petugas/administrator</strong> sebelum tindakan teknis lebih lanjut diambil.
                </p>
              </div>
              `
                  : `
              <!-- Hasil Bersih -->
              <div style="margin-top: 20px; padding: 16px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #10b981; border-radius: 6px; font-size: 13px; color: #166534; line-height: 1.5;">
                <strong>Status Keamanan Bersih:</strong>
                <p style="margin: 4px 0 0;">
                  Seluruh halaman yang berhasil diperiksa telah melalui verifikasi pencocokan pola teks algoritma Aho-Corasick (Judi Online, Pornografi, Penipuan/Phishing), deteksi tautan mencurigakan, dan analisis baseline defacement. <strong>Tidak ditemukan indikasi konten negatif pada situs ini.</strong>
                </p>
              </div>
              `
              }

              <!-- Petunjuk Dashboard -->
              <div style="margin-top: 20px; padding: 12px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; color: #475569;">
                <strong>Akses Informasi Lengkap:</strong>
                <p style="margin: 4px 0 0;">
                  Hasil lengkap pemindaian, statistik riwayat, serta detail respons halaman tersedia pada <strong>Dashboard Sistem Pemantauan Web Pemerintah Kabupaten Sumbawa</strong>.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 16px 24px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; text-align: center;">
              <div>Sistem Pemantauan dan Deteksi Indikasi Konten Negatif &bull; Kabupaten Sumbawa</div>
              <div style="margin-top: 4px;">Pesan ini dikirimkan secara otomatis ke email petugas pemindaian. Harap tidak membalas email ini secara langsung.</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Versi Text (Plain Text fallback)
  const plainCategoryText = hasIndication
    ? Object.entries(summary.categoryCounts || {})
        .map(([cat, count]) => `  - ${cat}: ${count} temuan`)
        .join("\n")
    : "  - Tidak ada indikasi (Nihil)";

  const plainPagesText = hasIndication
    ? (summary.indicatedPages || [])
        .map((p, idx) => {
          const findingsList = p.findings
            .map((f) => `    * [${f.category}] ${f.type}: ${f.detail}`)
            .join("\n");
          return `Halaman #${idx + 1}: ${p.url}\n${findingsList}`;
        })
        .join("\n\n")
    : "Seluruh halaman bersih dari indikasi konten negatif.";

  const text = `
${bannerTitle}
Pemerintah Kabupaten Sumbawa - Sistem Pemantauan Web

Nama Website     : ${displayName}
URL Website      : ${startUrl}
Email Petugas    : ${officerEmail || "-"}
Waktu Mulai      : ${startFormatted}
Waktu Selesai    : ${finishFormatted}
Metode           : ${sourceLabel}
Halaman Diperiksa: ${effectiveTotalPages} halaman
Jumlah Indikasi  : ${summary.totalFindings} temuan
Status           : ${statusBadgeText}

RINGKASAN KATEGORI:
${plainCategoryText}

RINCIAN TEMUAN PER HALAMAN:
${plainPagesText}

${
  hasIndication
    ? `PEMBERITAHUAN PENTING:
Hasil ini merupakan indikasi awal yang diperoleh dari pencocokan pola algoritma Aho-Corasick dan inspeksi otomatis. Hasil ini memerlukan pemeriksaan manual serta verifikasi langsung oleh petugas sebelum tindakan lebih lanjut dilakukan.`
    : `STATUS KEAMANAN:
Seluruh halaman yang diperiksa telah lulus evaluasi deteksi teks Aho-Corasick, tautan mencurigakan, dan defacement.`
}

INFORMASI LENGKAP:
Hasil lengkap pemindaian dan riwayat dapat diakses pada Dashboard Sistem Pemantauan Web Kabupaten Sumbawa.

---
Sistem Pemantauan dan Deteksi Konten Negatif Kabupaten Sumbawa
Email otomatis untuk petugas pemindaian, mohon tidak membalas langsung ke alamat ini.
`.trim();

  return {
    subject,
    html,
    text,
  };
}

module.exports = {
  buildScanCompletionEmail,
  buildScanAlertEmail: buildScanCompletionEmail,
  formatWitaTime,
  summarizeScanFindings,
  CATEGORY_NAMES,
};
