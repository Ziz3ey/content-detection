import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { pdfColors } from "./styles/tokens.js";

function sanitizeFilename(name) {
  if (!name) return "situs";
  return name
    .replace(/^https?:\/\//i, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 50);
}

function formatDateIndo(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "medium",
  }).format(date);
}

function formatDateShort(dateStr) {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

/**
 * Ekspor Laporan PDF Resmi Pemindaian Situs Web
 */
export function exportScanReportPDF({
  siteName,
  url,
  scanId,
  scannedAt,
  scanSource = "MANUAL",
  pages = [],
  crawlError = null,
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // Analisis statistik halaman
  const totalPages = pages.length;
  let failedPages = 0;
  let indicatedPages = 0;
  let cleanPages = 0;

  pages.forEach((page) => {
    const isCrawlFailed =
      page.crawl?.success === false ||
      page.crawlStatus === "failed" ||
      page.status === "failed";
    if (isCrawlFailed) {
      failedPages++;
      return;
    }
    const hasText =
      page.textDetection?.success === true &&
      page.textDetection?.data?.detected === true;
    const hasDefacement =
      page.defacementDetection?.success === true &&
      page.defacementDetection?.data?.detected === true;
    const hasLink =
      page.linkDetection?.success === true &&
      page.linkDetection?.data?.detected === true;

    if (hasText || hasDefacement || hasLink) {
      indicatedPages++;
    } else {
      cleanPages++;
    }
  });

  // Overall status label
  let overallStatus = "AMAN (TIDAK DITEMUKAN INDIKASI)";
  let overallColor = pdfColors.success;
  if (indicatedPages > 0) {
    overallStatus = `TERINDIKASI ANOMALI (${indicatedPages} HALAMAN)`;
    overallColor = pdfColors.danger;
  } else if (failedPages > 0 && totalPages === failedPages) {
    overallStatus = "TERKENDALA (PERAYAPAN GAGAL)";
    overallColor = pdfColors.warning;
  }

  // ── HEADER KOP CSIRT ──
  // Top Banner
  doc.setFillColor(...pdfColors.headerBg);
  doc.rect(0, 0, pageWidth, 75, "F");

  // Accent Line
  doc.setFillColor(...pdfColors.accentLine);
  doc.rect(0, 75, pageWidth, 4, "F");

  // Kop Text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("PEMERINTAH KABUPATEN SUMBAWA", margin, 28);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...pdfColors.headerSubtext);
  doc.text("TIM TANGGAP INSIDEN SIBER (CSIRT) • SISTEM CONTENT DETECTION", margin, 42);
  doc.text("Pemantauan Integritas Web, Deteksi Defacement & Konten Negatif", margin, 55);

  let curY = 105;

  // Title Document
  doc.setTextColor(...pdfColors.textMain);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("LAPORAN HASIL PEMINDAIAN SITUS WEB", margin, curY);

  curY += 16;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...pdfColors.textMuted);
  doc.text(
    `Nomor Dokumen: CD-REP-${scanId ? scanId.slice(0, 16) : Date.now()} | Dibuat: ${formatDateIndo(new Date().toISOString())}`,
    margin,
    curY,
  );

  curY += 18;

  // ── SEKSI 1: IDENTITAS LAPORAN ──
  autoTable(doc, {
    startY: curY,
    margin: { left: margin, right: margin },
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 4, textColor: pdfColors.textSecondary },
    columnStyles: {
      0: { fontStyle: "bold", width: 140, textColor: pdfColors.textMuted },
      1: { width: 10 },
      2: { textColor: pdfColors.textMain },
    },
    body: [
      ["Nama Sasaran / Instansi", ":", siteName || "Pemeriksaan Sasaran Langsung"],
      ["URL Situs Sasaran", ":", url || "-"],
      ["Waktu Pemindaian", ":", formatDateIndo(scannedAt)],
      ["Jenis Pemeriksaan", ":", scanSource === "SCHEDULED" ? "Terjadwal Otomatis (Rutin)" : "Manual (Analisis Langsung)"],
      ["Status Keseluruhan", ":", overallStatus],
    ],
  });

  curY = doc.lastAutoTable.finalY + 14;

  // ── SEKSI 2: KARTU RINGKASAN STATISTIK ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...pdfColors.textMain);
  doc.text("Ringkasan Hasil Pemeriksaan", margin, curY);
  curY += 10;

  const cardWidth = (contentWidth - 30) / 4;
  const cardHeight = 44;

  const summaryCards = [
    { label: "Total Halaman", value: String(totalPages), color: pdfColors.primary },
    { label: "Terindikasi", value: String(indicatedPages), color: pdfColors.danger },
    { label: "Bebas Indikasi", value: String(cleanPages), color: pdfColors.success },
    { label: "Gagal / Kendala", value: String(failedPages), color: pdfColors.warning },
  ];

  summaryCards.forEach((c, idx) => {
    const cardX = margin + idx * (cardWidth + 10);
    doc.setFillColor(...pdfColors.cardBg);
    doc.setDrawColor(...pdfColors.border);
    doc.roundedRect(cardX, curY, cardWidth, cardHeight, 4, 4, "FD");

    // Top color strip
    doc.setFillColor(...c.color);
    doc.rect(cardX, curY, cardWidth, 3, "F");

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...c.color);
    doc.text(c.value, cardX + 10, curY + 22);

    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...pdfColors.textMuted);
    doc.text(c.label, cardX + 10, curY + 36);
  });

  curY += cardHeight + 18;

  // ── SEKSI 3: TABEL DETAIL HASIL PER HALAMAN ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...pdfColors.textMain);
  doc.text("Rincian Hasil Pemeriksaan Per Halaman", margin, curY);
  curY += 8;

  const tableRows = pages.map((page, index) => {
    const isCrawlFailed =
      page.crawl?.success === false ||
      page.crawlStatus === "failed" ||
      page.status === "failed";

    const httpCode = page.crawl?.status || page.httpStatus || (isCrawlFailed ? "ERR" : "200");
    const depth = page.depth ?? page.crawl?.depth ?? 0;

    // Deteksi Teks
    let textStatus = "—";
    if (page.textDetection?.success === true) {
      if (page.textDetection?.data?.detected) {
        const cats = (page.textDetection.data.categories || [])
          .map((c) => c.category)
          .join(", ");
        textStatus = `Indikasi: ${cats || "Terdeteksi"}`;
      } else {
        textStatus = "Bebas";
      }
    } else if (page.textDetectionStatus === "skipped") {
      textStatus = "Dilewati";
    } else if (page.textDetection?.success === false) {
      textStatus = "Gagal";
    }

    // Deteksi Defacement
    let defaceStatus = "—";
    if (page.defacementDetection?.success === true) {
      defaceStatus = page.defacementDetection?.data?.detected
        ? "Perubahan Terdeteksi"
        : "Cocok Baseline";
    } else if (page.defacementDetectionStatus === "skipped") {
      defaceStatus = "Dilewati (No Baseline)";
    } else if (page.defacementDetection?.success === false) {
      defaceStatus = "Gagal";
    }

    // Deteksi Tautan
    let linkStatus = "—";
    if (page.linkDetection?.success === true) {
      linkStatus = page.linkDetection?.data?.detected
        ? "Tautan Mencurigakan"
        : "Bebas";
    } else if (page.linkDetectionStatus === "skipped") {
      linkStatus = "Dilewati";
    } else if (page.linkDetection?.success === false) {
      linkStatus = "Gagal";
    }

    // Kesimpulan status
    let outcome = "BEBAS";
    if (isCrawlFailed) {
      const errMsg =
        typeof page.crawl?.error === "string"
          ? page.crawl.error
          : page.crawl?.error?.message || "Gagal Crawl";
      outcome = `KENDALA CRAWL: ${errMsg.slice(0, 40)}`;
    } else if (
      textStatus.startsWith("Indikasi") ||
      defaceStatus.includes("Perubahan") ||
      linkStatus.includes("Mencurigakan")
    ) {
      outcome = "TERINDIKASI";
    }

    return [
      String(index + 1),
      page.url,
      `HTTP ${httpCode}\nDepth ${depth}`,
      textStatus,
      defaceStatus,
      linkStatus,
      outcome,
    ];
  });

  autoTable(doc, {
    startY: curY,
    margin: { left: margin, right: margin },
    head: [
      ["No", "URL Halaman", "Crawl", "Teks", "Defacement", "Tautan", "Kesimpulan"],
    ],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: pdfColors.headerBg,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 4,
      textColor: pdfColors.textSecondary,
      overflow: "linebreak",
    },
    columnStyles: {
      0: { width: 22, halign: "center" },
      1: { width: 140 },
      2: { width: 55, halign: "center" },
      3: { width: 68 },
      4: { width: 68 },
      5: { width: 68 },
      6: { width: 85 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 6) {
        if (data.cell.raw.startsWith("TERINDIKASI")) {
          data.cell.styles.textColor = pdfColors.danger;
          data.cell.styles.fontStyle = "bold";
        } else if (data.cell.raw.startsWith("KENDALA")) {
          data.cell.styles.textColor = pdfColors.warning;
          data.cell.styles.fontStyle = "bold";
        } else if (data.cell.raw === "BEBAS") {
          data.cell.styles.textColor = pdfColors.success;
        }
      }
    },
  });

  curY = doc.lastAutoTable.finalY + 16;

  // Jika posisi terlalu dekat dengan batas bawah, tambahkan halaman baru untuk kesimpulan
  if (curY > pageHeight - 160) {
    doc.addPage();
    curY = 50;
  }

  // ── SEKSI 4: KENDALA DAN KESIMPULAN ──
  if (crawlError) {
    doc.setFillColor(...pdfColors.dangerSoft);
    doc.setDrawColor(...pdfColors.dangerBorder);
    doc.roundedRect(margin, curY, contentWidth, 34, 4, 4, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...pdfColors.danger);
    doc.text("Catatan Kendala Perayapan (Crawling):", margin + 10, curY + 14);
    doc.setFont("helvetica", "normal");
    doc.text(
      String(typeof crawlError === "string" ? crawlError : crawlError.message || JSON.stringify(crawlError)).slice(0, 110),
      margin + 10,
      curY + 26,
    );
    curY += 46;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...pdfColors.textMain);
  doc.text("Kesimpulan & Catatan Verifikasi Analis", margin, curY);
  curY += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...pdfColors.textSecondary);
  const noteLines = doc.splitTextToSize(
    "1. Pemindaian dilakukan secara otomatis menggunakan algoritma pencocokan pola Aho-Corasick untuk deteksi kata kunci negatif, analisis tautan berbasis heuristik, serta perbandingan struktur DOM baseline.\n" +
      "2. Temuan berstatus 'TERINDIKASI' merupakan indikasi awal yang memerlukan tinjauan faktual dan verifikasi kontekstual oleh Administrator/CSIRT sebelum langkah tindak lanjut diambil.\n" +
      "3. Laporan ini sah dan dihasilkan langsung dari database monitoring Content Detection Pemerintah Kabupaten Sumbawa.",
    contentWidth,
  );
  doc.text(noteLines, margin, curY);

  curY += noteLines.length * 11 + 20;

  // Tanda Tangan / Verifikasi
  const sigX = pageWidth - margin - 180;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...pdfColors.textSecondary);
  doc.text("Sumbawa Besar, " + formatDateShort(scannedAt), sigX, curY);
  doc.text("Tim Tanggap Insiden Siber (CSIRT)", sigX, curY + 12);
  doc.setFont("helvetica", "bold");
  doc.text("Pemerintah Kabupaten Sumbawa", sigX, curY + 24);

  // ── FOOTER PADA SETIAP HALAMAN ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...pdfColors.textMuted);
    doc.text(
      "Dokumen Resmi • Content Detection CSIRT Kabupaten Sumbawa | Rahasia & Terbatas",
      margin,
      pageHeight - 20,
    );
    doc.text(
      `Halaman ${i} dari ${pageCount}`,
      pageWidth - margin - 60,
      pageHeight - 20,
    );
  }

  // Unduh dokumen
  const cleanSite = sanitizeFilename(siteName || url);
  const dateStr = formatDateShort(scannedAt);
  doc.save(`Laporan_Scan_${cleanSite}_${dateStr}.pdf`);
}

/**
 * Ekspor Detail Hasil Scan ke CSV (kompatibel Microsoft Excel)
 */
export function exportScanDetailToCSV({
  siteName,
  url,
  scannedAt,
  pages = [],
}) {
  const headers = [
    "No",
    "URL Halaman",
    "Judul Halaman",
    "Waktu Periksa",
    "Status Crawl",
    "HTTP Status",
    "Kedalaman",
    "Deteksi Teks",
    "Pola Teks Terdeteksi",
    "Deteksi Defacement",
    "Deteksi Tautan",
    "Status Akhir",
    "Kendala / Error",
  ];

  const rows = pages.map((page, index) => {
    const isCrawlFailed =
      page.crawl?.success === false ||
      page.crawlStatus === "failed" ||
      page.status === "failed";
    const httpCode = page.crawl?.status || page.httpStatus || (isCrawlFailed ? "ERR" : "200");
    const depth = page.depth ?? page.crawl?.depth ?? 0;
    const title = page.crawl?.title || page.title || "-";

    // Text patterns
    let textStatus = "BEBAS";
    let textPatterns = "-";
    if (page.textDetection?.success === true) {
      if (page.textDetection?.data?.detected) {
        textStatus = "TERINDIKASI";
        const pats = (page.textDetection.data.categories || [])
          .flatMap((c) => (c.matches || []).map((m) => m.pattern))
          .filter(Boolean);
        textPatterns = pats.join(" | ") || "Pola cocok";
      }
    } else if (page.textDetectionStatus === "skipped") {
      textStatus = "DILEWATI";
    } else if (page.textDetection?.success === false) {
      textStatus = "GAGAL";
    }

    // Defacement
    let defaceStatus = "BEBAS";
    if (page.defacementDetection?.success === true) {
      defaceStatus = page.defacementDetection?.data?.detected
        ? "PERUBAHAN TERDETEKSI"
        : "COCOK BASELINE";
    } else if (page.defacementDetectionStatus === "skipped") {
      defaceStatus = "DILEWATI (TANPA BASELINE)";
    } else if (page.defacementDetection?.success === false) {
      defaceStatus = "GAGAL";
    }

    // Link
    let linkStatus = "BEBAS";
    if (page.linkDetection?.success === true) {
      linkStatus = page.linkDetection?.data?.detected
        ? "TAUTAN MENCURIGAKAN"
        : "BEBAS";
    } else if (page.linkDetectionStatus === "skipped") {
      linkStatus = "DILEWATI";
    } else if (page.linkDetection?.success === false) {
      linkStatus = "GAGAL";
    }

    let finalOutcome = "BEBAS";
    let errorDetail = "-";
    if (isCrawlFailed) {
      finalOutcome = "GAGAL CRAWL";
      errorDetail =
        typeof page.crawl?.error === "string"
          ? page.crawl.error
          : page.crawl?.error?.message || "Perayapan gagal.";
    } else if (
      textStatus === "TERINDIKASI" ||
      defaceStatus === "PERUBAHAN TERDETEKSI" ||
      linkStatus === "TAUTAN MENCURIGAKAN"
    ) {
      finalOutcome = "TERINDIKASI KONTEN NEGATIF";
    }

    return [
      String(index + 1),
      page.url,
      title,
      scannedAt || new Date().toISOString(),
      isCrawlFailed ? "GAGAL" : "BERHASIL",
      String(httpCode),
      String(depth),
      textStatus,
      textPatterns,
      defaceStatus,
      linkStatus,
      finalOutcome,
      errorDetail,
    ];
  });

  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""').replace(/\r?\n/g, " ")}"`)
        .join(","),
    )
    .join("\r\n");

  // UTF-8 BOM untuk Microsoft Excel
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const urlObj = URL.createObjectURL(blob);
  const cleanSite = sanitizeFilename(siteName || url);
  const link = document.createElement("a");
  link.href = urlObj;
  link.download = `Data_Scan_${cleanSite}_${formatDateShort(scannedAt)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(urlObj);
}

/**
 * Ekspor Rekap Riwayat Pemindaian ke CSV (kompatibel Microsoft Excel)
 */
export function exportHistoryListToCSV(historyList = [], sites = []) {
  const headers = [
    "No",
    "ID Scan",
    "Nama Situs / Instansi",
    "URL Situs",
    "Sumber",
    "Waktu Pemindaian",
    "Status Perayapan",
    "HTTP Code",
    "Deteksi Teks",
    "Perubahan Halaman",
    "Deteksi Tautan",
    "Status Akhir",
    "Catatan Kendala",
  ];

  const rows = historyList.map((scan, index) => {
    const matchedSite = sites.find((s) => s.url === scan.url);
    const displayName = matchedSite?.name || scan.title || scan.url;
    const isScheduled = scan.scanSource === "SCHEDULED";

    // Detect if indicated
    let hasIndication = false;
    if (
      scan.textDetection?.data?.detected === true ||
      scan.defacementDetection?.data?.detected === true ||
      scan.linkDetection?.data?.detected === true
    ) {
      hasIndication = true;
    }

    let finalOutcome = "BEBAS INDIKASI";
    if (scan.crawlStatus === "failed") {
      finalOutcome = "GAGAL PERAYAPAN";
    } else if (hasIndication) {
      finalOutcome = "TERINDIKASI ANOMALI";
    }

    const errorMsg =
      scan.crawlMetadata?.error?.message ||
      (typeof scan.crawlMetadata?.error === "string" ? scan.crawlMetadata.error : "-");

    return [
      String(index + 1),
      scan.id || "-",
      displayName,
      scan.url,
      isScheduled ? "TERJADWAL" : "MANUAL",
      scan.scannedAt || "-",
      scan.crawlStatus === "success" ? "BERHASIL" : "GAGAL",
      String(scan.httpStatus || "-"),
      scan.textDetectionStatus || "-",
      scan.defacementDetectionStatus || "-",
      scan.linkDetectionStatus || "-",
      finalOutcome,
      errorMsg,
    ];
  });

  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""').replace(/\r?\n/g, " ")}"`)
        .join(","),
    )
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const urlObj = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = urlObj;
  link.download = `Rekap_Riwayat_Pemindaian_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(urlObj);
}
