import React, { Suspense, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  Clock3,
  Calendar,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  FileDown,
  FileSearch,
  Globe2,
  History,
  LoaderCircle,
  LogOut,
  Menu,
  RotateCw,
  Search,
  ShieldCheck,
  ShieldAlert,
  Settings,
  UserRound,
  Bell,
  X,
  TriangleAlert,
  Trash2,
  LayoutDashboard,
  FileText,
  AlertTriangle,
  Lock,
  LogIn,
  Mail,
} from "lucide-react";
import {
  exportScanReportPDF,
  exportScanDetailToCSV,
  exportHistoryListToCSV,
} from "./reportExporter.js";
import {
  API_BASE_URL,
  createSchedule,
  createSite,
  deleteScanById,
  deleteSchedule,
  deleteSite,
  fetchAuthSession,
  fetchRecentScans,
  fetchScanById,
  fetchScanJob,
  fetchScanJobs,
  fetchSchedules,
  fetchSites,
  loginAdmin,
  logoutAdmin,
  requestApi,
  resendScanEmail,
  runScheduleNow,
  submitScan,
  submitSiteScan,
  updateSchedule,
  updateSite,
  validateOfficerEmail,
  validateTargetUrl,
} from "./api.js";
import SiteManagement from "./SiteManagement.jsx";
import ScheduleManagement from "./ScheduleManagement.jsx";
import Visualizations from "./Visualizations.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import OverviewPage from "./pages/dashboard/OverviewPage.jsx";
import AppShell from "./layout/AppShell.jsx";
import NotificationMenu from "./layout/NotificationMenu.jsx";
import { tokens } from "./styles/tokens.js";

const ComponentGallery = import.meta.env.DEV
  ? React.lazy(() => import("./components/ComponentGallery.jsx"))
  : null;

const NOTIFICATION_STORAGE_KEY = "content-detection:notifications:v1";
const DASHBOARD_TABS = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "situs", label: "Manajemen situs" },
  { id: "jadwal", label: "Jadwal pemeriksaan" },
  { id: "pemeriksaan", label: "Pemindaian" },
  { id: "hasil", label: "Hasil terbaru" },
  { id: "riwayat", label: "Riwayat" },
];

function tabFromHash() {
  const tabId = window.location.hash.slice(1);
  return DASHBOARD_TABS.some((tab) => tab.id === tabId) ? tabId : "ringkasan";
}

const CATEGORY_LABELS = {
  gambling: "Judi online (Gambling)",
  fraud: "Penipuan (Fraud)",
  pornography: "Pornografi",
};

function detectorFindings(title, data) {
  if (title === "Deteksi teks") {
    return (data?.categories || []).flatMap((category) =>
      (category.matches || []).map((match) => ({
        label: CATEGORY_LABELS[category.category] || category.category,
        detail: match.pattern,
      }))
    );
  }

  if (title === "Deteksi tautan") {
    if (Array.isArray(data?.links)) {
      return data.links.flatMap((link) =>
        (link.indicators || []).map((indicator) => ({
          label: indicator.type,
          detail: `${link.url} — ${indicator.description}`,
        }))
      );
    }
    return (data?.indicators || []).map((indicator) => ({
      label: indicator.type,
      detail: indicator.description,
    }));
  }

  return (data?.indicators || []).map((indicator) => ({
    label: indicator.type,
    detail: indicator.description,
  }));
}

function summarizeIndications(page) {
  const categories = [];
  const addCount = (label, count) => {
    if (count > 0) categories.push({ label, count });
  };
  const text = page.textDetection;
  if (text?.success === true && text.data?.detected === true) {
    for (const category of text.data.categories || []) {
      addCount(
        CATEGORY_LABELS[category.category] || category.category,
        (category.matches || []).length,
      );
    }
  }

  const links = page.linkDetection;
  if (links?.success === true && links.data?.detected === true) {
    const linkCount = Array.isArray(links.data.links)
      ? links.data.links.reduce(
          (total, link) => total + (link.indicators || []).length,
          0,
        )
      : (links.data.indicators || []).length;
    addCount("Tautan mencurigakan (Suspicious Link)", linkCount);
  }

  const defacement = page.defacementDetection;
  if (defacement?.success === true && defacement.data?.detected === true) {
    addCount(
      "Perubahan halaman (Defacement)",
      (defacement.data.indicators || []).length,
    );
  }

  return {
    categories,
    total: categories.reduce((total, category) => total + category.count, 0),
  };
}

function notificationsFromScan(scanResult) {
  const scannedAt = scanResult.pages?.[0]?.scannedAt || new Date().toISOString();
  return (scanResult.pages || []).flatMap((page) => {
    const summary = summarizeIndications(page);
    if (summary.total === 0) return [];
    return [
      {
        id: `${page.id || page.url}:${page.scannedAt || scannedAt}`,
        scanId: page.id,
        url: page.url,
        scannedAt: page.scannedAt || scannedAt,
        categories: summary.categories,
        total: summary.total,
        read: false,
      },
    ];
  });
}

function readNotifications() {
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(NOTIFICATION_STORAGE_KEY) || "[]",
    );
    if (!Array.isArray(saved)) {
      console.warn("Notifikasi tersimpan memiliki format yang tidak dikenali.");
      return [];
    }
    const validNotifications = saved.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.url === "string" &&
        typeof item.scannedAt === "string" &&
        Array.isArray(item.categories) &&
        Number.isInteger(item.total) &&
        typeof item.read === "boolean",
    );
    if (validNotifications.length !== saved.length) {
      console.warn("Sebagian notifikasi tersimpan memiliki format yang tidak valid.");
    }
    return validNotifications.slice(0, 30);
  } catch (error) {
    console.error("Notifikasi tersimpan tidak dapat dibaca.", error);
    return [];
  }
}

function formatTime(value) {
  if (!value) return "Data tidak tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data tidak tersedia";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function hostLabel(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return "Belum ada target";
  }
}

function StatusBadge({ status, children }) {
  const text = typeof children === "string" ? children : "";
  const tone =
    status === "success" ||
    status === "completed" ||
    status === "good" ||
    text === "Tidak ditemukan indikasi" ||
    text === "BERHASIL" ||
    text === "AMAN" ||
    text === "BEBAS"
      ? "good"
      : status === "error" ||
        status === "failed" ||
        status === "bad" ||
        text === "Terindikasi" ||
        text.startsWith("TERINDIKASI") ||
        text === "GAGAL" ||
        text === "CRAWL ERROR" ||
        text.includes("INDIKASI")
        ? "bad"
        : status === "skipped" ||
          status === "muted" ||
          text === "Dilewati" ||
          text === "DILEWATI"
          ? "muted"
          : status === "warning" ||
            text === "Gagal diperiksa" ||
            text.startsWith("SEBAGIAN") ||
            text.startsWith("KENDALA")
            ? "warning"
            : "pending";

  return <span className={`status-badge status-${tone}`}>{children}</span>;
}

function getSiteOutcome(siteResult) {
  if (siteResult.scanOutcome) return siteResult.scanOutcome;
  if (siteResult.status === "failed") return "failed";
  const pages = siteResult.result?.pages || [];
  if (pages.length === 0) return "failed";
  const successPages = pages.filter((p) => p.crawl?.success === true);
  if (successPages.length === pages.length) return "success";
  if (successPages.length === 0) return "failed";
  return "partial";
}

function siteStatusLabel(siteResult) {
  const outcome = getSiteOutcome(siteResult);
  if (outcome === "success") return "BERHASIL";
  if (outcome === "failed") return "GAGAL";
  return "SEBAGIAN BERHASIL";
}

function siteStatusTone(siteResult) {
  const outcome = getSiteOutcome(siteResult);
  if (outcome === "success") return "success";
  if (outcome === "failed") return "error";
  return "pending";
}

function getBatchOutcome(results) {
  if (!results || results.length === 0) return "ready";
  const outcomes = results.map(getSiteOutcome);
  if (outcomes.every((o) => o === "success")) return "success";
  if (outcomes.every((o) => o === "failed")) return "failed";
  return "partial";
}

function batchStatusLabel(results) {
  const outcome = getBatchOutcome(results);
  if (outcome === "success") return "BERHASIL";
  if (outcome === "failed") return "GAGAL";
  if (outcome === "partial") return "SEBAGIAN BERHASIL";
  return "SIAP";
}

function DetectionCard({ title, icon: Icon, response, serviceStatus }) {
  const isCrawlFailed =
    response?.error?.code === "CRAWL_FAILED" ||
    serviceStatus === "skipped";
  const isSkipped =
    isCrawlFailed ||
    serviceStatus === "skipped" ||
    response?.error?.code === "BASELINE_NOT_PROVIDED" ||
    (title === "Perubahan halaman" &&
      !response &&
      serviceStatus !== "success" &&
      serviceStatus !== "failed");
  const isError = !isSkipped && response?.success === false;
  const data = response?.success === true ? response.data : null;
  const detected = typeof data?.detected === "boolean" ? data.detected : null;
  const isUnknown = !isSkipped && !isError && detected === null;
  const findings = detectorFindings(title, data);

  return (
    <section className={`detector-card ${isError ? "detector-error" : ""}`}>
      <div className="detector-topline">
        <span className="detector-icon">
          <Icon size={17} strokeWidth={1.8} />
        </span>
        <span className="detector-name">{title}</span>
        <StatusBadge
          status={
            isSkipped
              ? "skipped"
              : serviceStatus ||
                (isError ? "error" : isUnknown ? "pending" : "success")
          }
        >
          {isSkipped
            ? "DILEWATI"
            : isError
              ? "GAGAL"
              : isUnknown
                ? "DATA TIDAK TERSEDIA"
                : detected
                  ? "TERINDIKASI"
                  : "BERHASIL"}
        </StatusBadge>
      </div>

      {isError ? (
        <div className="detector-message error-message">
          <TriangleAlert size={15} />
          <span>
            {response.error?.message ||
              "Detector tidak dapat menyelesaikan analisis."}
          </span>
        </div>
      ) : isSkipped ? (
        <p className="detector-message">
          {isCrawlFailed
            ? "Pemeriksaan dilewati karena perayapan halaman tidak berhasil."
            : response?.error?.code === "BASELINE_NOT_PROVIDED"
              ? "Pemeriksaan dilewati karena baseline belum dikonfigurasi."
              : "Data tidak tersedia"}
        </p>
      ) : detected === null ? (
        <p className="detector-message">Data tidak tersedia</p>
      ) : (
        <div className="detector-outcome">
          <span
            className={`outcome-mark ${detected ? "outcome-found" : "outcome-clear"}`}
          >
            {detected ? <Check size={15} /> : <ArrowDownRight size={15} />}
          </span>
          <span>
            {detected
              ? "Indikasi terdeteksi"
              : "Tidak ada indikasi berdasarkan pola"}
          </span>
          <span className="finding-count">{findings.length} temuan</span>
        </div>
      )}

      {findings.length > 0 && (
        <div className="detector-findings-wrap">
          <ul className="finding-list">
            {findings.map((finding, index) => (
              <li key={`${finding.label}-${index}`}>
                <span className="finding-tag">{finding.label}</span>
                <code className="finding-code">{finding.detail || "Data tidak tersedia"}</code>
              </li>
            ))}
          </ul>
          <p className="detector-finding-note">
            Catatan: Hasil merupakan indikasi awal pencocokan pola dan memerlukan verifikasi faktual.
          </p>
        </div>
      )}
      {isSkipped && title === "Perubahan halaman" && !isCrawlFailed && (
        <p className="detector-note">Baseline belum tersedia untuk halaman ini.</p>
      )}
    </section>
  );
}

function formatCrawlErrorMessage(error) {
  if (!error) return "Situs web target tidak dapat diakses atau perayapan gagal.";
  if (typeof error === "string") {
    if (error.includes("robots.txt could not be checked; the host was blocked")) {
      return "Pemeriksaan robots.txt gagal: Host target tidak dapat dijangkau (koneksi ditolak saat memeriksa robots.txt).";
    }
    if (error.includes("The requested path is disallowed by robots.txt")) {
      return "Akses ke URL ini dilarang oleh kebijakan robots.txt situs target.";
    }
    return error;
  }

  const code = error.code || "";
  const msg = error.message || "";

  // Check if historical record holds the old English message
  if (msg.includes("robots.txt could not be checked; the host was blocked")) {
    return "Pemeriksaan robots.txt gagal: Host target tidak dapat dijangkau (koneksi ditolak saat memeriksa robots.txt).";
  }
  if (msg.includes("The requested path is disallowed by robots.txt")) {
    return "Akses ke URL ini dilarang oleh kebijakan robots.txt situs target.";
  }
  if (msg.includes("Request timeout")) {
    return "Waktu permintaan habis (timeout). Server target tidak merespons dalam batas waktu.";
  }
  if (msg.includes("Request failed")) {
    return "Gagal melakukan koneksi HTTP ke server target.";
  }

  // If the message is already in Indonesian and informative, return it directly
  if (msg && !msg.startsWith("Error:") && msg !== "Request failed.") {
    return msg;
  }

  switch (code) {
    case "ROBOTS_UNAVAILABLE":
      return "Pemeriksaan robots.txt gagal karena host target tidak dapat dijangkau atau mengembalikan kesalahan server.";
    case "ROBOTS_DISALLOWED":
      return "Akses ke URL ini dilarang oleh aturan robots.txt situs target.";
    case "CONNECTION_REFUSED":
      return "Koneksi ke host ditolak (connection refused). Server target sedang tidak aktif.";
    case "HOST_UNREACHABLE":
      return "Host target tidak dapat dijangkau atau nama domain tidak ditemukan pada DNS.";
    case "REQUEST_TIMEOUT":
      return "Waktu permintaan habis (timeout). Server target tidak merespons dalam batas waktu.";
    case "ACCESS_DENIED":
      return "Akses ke halaman ditolak oleh server target (HTTP 401/403).";
    case "HTTP_STATUS":
      return error.status
        ? `Server target mengembalikan kesalahan HTTP ${error.status}.`
        : "Server target mengembalikan kode status HTTP error.";
    case "HOST_NOT_ALLOWED":
      return "Host URL berada di luar daftar domain yang diizinkan untuk pemantauan.";
    case "SSRF_BLOCKED":
      return "Akses ke host diblokir oleh perlindungan SSRF (mengarah ke alamat IP privat/terbatas).";
    case "UNSUPPORTED_CONTENT_TYPE":
      return "Tipe konten tidak didukung (hanya mendukung format dokumen HTML).";
    case "HTML_PARSE_FAILED":
      return "Struktur dokumen HTML tidak valid atau tidak dapat diproses.";
    default:
      return msg || `Kendala perayapan: ${code || "Gagal mengambil halaman"}.`;
  }
}

function ScanPage({ page }) {
  const crawl = page.crawl || {};
  const crawlSucceeded = crawl.success === true || crawl.status === "success";
  const crawlErrorMessage = formatCrawlErrorMessage(crawl.error);

  const indications = summarizeIndications(page);
  const isIndicated = indications.total > 0;

  // Status per detector
  let textBadge = "Tidak ditemukan indikasi";
  let textTone = "success";
  if (!crawlSucceeded) {
    textBadge = "Dilewati";
    textTone = "skipped";
  } else if (page.textDetection?.success === false) {
    textBadge = "Gagal diperiksa";
    textTone = "error";
  } else if (page.textDetection?.data?.detected === true) {
    textBadge = "Terindikasi";
    textTone = "bad";
  } else if (page.textDetectionStatus === "skipped") {
    textBadge = "Dilewati";
    textTone = "skipped";
  }

  let linkBadge = "Tidak ditemukan indikasi";
  let linkTone = "success";
  if (!crawlSucceeded) {
    linkBadge = "Dilewati";
    linkTone = "skipped";
  } else if (page.linkDetection?.success === false) {
    linkBadge = "Gagal diperiksa";
    linkTone = "error";
  } else if (page.linkDetection?.data?.detected === true) {
    linkBadge = "Terindikasi";
    linkTone = "bad";
  } else if (page.linkDetectionStatus === "skipped") {
    linkBadge = "Dilewati";
    linkTone = "skipped";
  }

  let defaceBadge = "Tidak ditemukan indikasi";
  let defaceTone = "success";
  if (!crawlSucceeded) {
    defaceBadge = "Dilewati";
    defaceTone = "skipped";
  } else if (
    page.defacementDetectionStatus === "skipped" ||
    page.defacementDetection?.error?.code === "BASELINE_NOT_PROVIDED"
  ) {
    defaceBadge = "Dilewati";
    defaceTone = "skipped";
  } else if (page.defacementDetection?.success === false) {
    defaceBadge = "Gagal diperiksa";
    defaceTone = "error";
  } else if (page.defacementDetection?.data?.detected === true) {
    defaceBadge = "Terindikasi";
    defaceTone = "bad";
  }

  return (
    <article className="page-result">
      {/* 1. Header Bar */}
      <div className="page-result-heading">
        <div className="page-title-line">
          <span className="page-number">
            Depth {page.depth ?? 0}
          </span>
          <div className="page-url-block">
            <a
              href={page.url}
              target="_blank"
              rel="noreferrer"
              className="page-url"
              title="Buka URL sasaran di tab baru"
            >
              {page.url}
              <ExternalLink size={13} />
            </a>
            <span className="page-title">
              {crawl.title || "Judul halaman tidak tersedia"}
            </span>
          </div>
        </div>
        <div className="page-heading-badges">
          <StatusBadge status={crawlSucceeded ? "success" : "failed"}>
            {crawlSucceeded ? `HTTP ${crawl.status ?? "200 OK"}` : "CRAWL ERROR"}
          </StatusBadge>
          <StatusBadge status={!crawlSucceeded ? "failed" : isIndicated ? "bad" : "success"}>
            {!crawlSucceeded
              ? "GAGAL DIPERIKSA"
              : isIndicated
                ? "TERINDIKASI KONTEN NEGATIF"
                : "TIDAK DITEMUKAN INDIKASI"}
          </StatusBadge>
        </div>
      </div>

      {/* 2. Metadata Strip & Detector Quick Badges */}
      <div className="page-meta-strip">
        <div className="page-meta-left">
          <span><Globe2 size={13} /> Content-Type: <strong>{crawl.contentType || "text/html"}</strong></span>
          <span><Clock3 size={13} /> Waktu: <strong>{formatTime(page.scannedAt)}</strong></span>
        </div>
        <div className="page-meta-badges">
          <span className="meta-badge-item">
            <span className="meta-badge-label">Teks:</span>
            <StatusBadge status={textTone}>{textBadge}</StatusBadge>
          </span>
          <span className="meta-badge-item">
            <span className="meta-badge-label">Tautan:</span>
            <StatusBadge status={linkTone}>{linkBadge}</StatusBadge>
          </span>
          <span className="meta-badge-item">
            <span className="meta-badge-label">Defacement:</span>
            <StatusBadge status={defaceTone}>{defaceBadge}</StatusBadge>
          </span>
        </div>
      </div>

      {/* 3. Crawl Failure Warning (if crawling failed) */}
      {(!crawlSucceeded || crawlErrorMessage) && (
        <div className="crawl-failure-banner" role="alert">
          <div className="crawl-failure-top">
            <TriangleAlert size={16} className="text-amber" />
            <strong>Kendala Perayapan Situs (Crawling Failure)</strong>
            <span className="badge badge-red">GAGAL PERAYAPAN</span>
          </div>
          <p className="crawl-failure-text">
            {crawlErrorMessage || "Situs web target tidak dapat diakses atau diblokir oleh host."}
          </p>
          <p className="crawl-failure-subtext">
            Catatan Keamanan: Pemeriksaan detektor dilewati karena halaman tidak berhasil diunduh. Halaman ini <strong>TIDAK dianggap aman</strong>. Harap periksa aksesibilitas server target atau konfigurasi robots.txt.
          </p>
        </div>
      )}

      {/* 4. Indication Details (if any detected) */}
      {isIndicated && (
        <div className="indication-detail-box">
          <div className="indication-detail-header">
            <ShieldAlert size={16} className="text-red" />
            <strong>Rincian Indikasi Konten Negatif Terdeteksi ({indications.total} temuan):</strong>
          </div>
          <div className="indication-categories-list">
            {indications.categories.map((cat, idx) => (
              <span key={idx} className="badge badge-red">
                {cat.label} ({cat.count} indikasi)
              </span>
            ))}
          </div>
          <p className="indication-disclaimer">
            Catatan Analis: Temuan di atas merupakan indikasi awal berbasis pencocokan pola otomatis dan memerlukan verifikasi faktual lanjutan sebelum tindakan penanganan.
          </p>
        </div>
      )}

      {/* 5. Detector Cards Grid */}
      <div className="detector-grid">
        <DetectionCard
          title="Deteksi teks"
          icon={FileSearch}
          response={page.textDetection}
          serviceStatus={page.textDetectionStatus}
        />
        <DetectionCard
          title="Perubahan halaman"
          icon={ShieldAlert}
          response={page.defacementDetection}
          serviceStatus={page.defacementDetectionStatus}
        />
        <DetectionCard
          title="Deteksi tautan"
          icon={Globe2}
          response={page.linkDetection}
          serviceStatus={page.linkDetectionStatus}
        />
      </div>
    </article>
  );
}

function historyToPage(scan) {
  const isDefacementSkipped =
    scan.defacementDetectionStatus === "skipped" ||
    !scan.defacementDetection;

  return {
    id: scan.id,
    url: scan.url,
    scanSource: scan.scanSource || "MANUAL",
    officerEmail: scan.officerEmail || null,
    scannedAt: scan.scannedAt,
    depth: scan.crawlMetadata?.depth ?? 0,
    crawl: {
      success: scan.crawlStatus === "success",
      status: scan.httpStatus,
      contentType: scan.contentType,
      title: scan.title,
      ...(scan.crawlMetadata?.error ? { error: scan.crawlMetadata.error } : {}),
    },
    textDetection:
      scan.textDetectionStatus === "skipped"
        ? null
        : {
            success: scan.textDetectionStatus === "success",
            ...(scan.textDetection || {}),
          },
    defacementDetection: isDefacementSkipped
      ? {
          success: false,
          error: {
            code: "BASELINE_NOT_PROVIDED",
            message: "Baseline belum tersedia.",
          },
        }
      : {
          success: scan.defacementDetectionStatus === "success",
          ...(scan.defacementDetection || {}),
        },
    linkDetection:
      scan.linkDetectionStatus === "skipped"
        ? null
        : {
            success: scan.linkDetectionStatus === "success",
            ...(scan.linkDetection || {}),
          },
    textDetectionStatus: scan.textDetectionStatus,
    defacementDetectionStatus: isDefacementSkipped
      ? "skipped"
      : scan.defacementDetectionStatus,
    linkDetectionStatus: scan.linkDetectionStatus,
  };
}

function Dashboard({ username, onLogout, logoutError }) {
  const [activeTab, setActiveTab] = useState(tabFromHash);
  const [url, setUrl] = useState("");
  const [officerEmail, setOfficerEmail] = useState(() => {
    try {
      return (
        window.localStorage.getItem("content-detection:officer-email") ||
        "admin@sumbawakab.go.id"
      );
    } catch {
      return "admin@sumbawakab.go.id";
    }
  });
  const [emailError, setEmailError] = useState("");
  const [activeJob, setActiveJob] = useState(null);
  const [maxDepth, setMaxDepth] = useState("1");
  const [maxPages, setMaxPages] = useState("20");
  const [baselineHtml, setBaselineHtml] = useState("");
  const [scanStatus, setScanStatus] = useState("ready");
  const [scanError, setScanError] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyDetail, setHistoryDetail] = useState(null);
  const [historyDetailError, setHistoryDetailError] = useState("");
  const [historyDeleteError, setHistoryDeleteError] = useState("");
  const [deletingHistoryId, setDeletingHistoryId] = useState("");
  const [resendingEmail, setResendingEmail] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [sitesError, setSitesError] = useState("");
  const [selectedSiteIds, setSelectedSiteIds] = useState([]);
  const [siteSelectionError, setSiteSelectionError] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState("");
  const [historySourceFilter, setHistorySourceFilter] = useState("all");
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
  const [historyOutcomeFilter, setHistoryOutcomeFilter] = useState("all");
  const [historyDateFrom, setHistoryDateFrom] = useState("");
  const [historyDateTo, setHistoryDateTo] = useState("");
  const [historySortOrder, setHistorySortOrder] = useState("newest");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState("");
  const [apiHealth, setApiHealth] = useState("checking");
  const [notifications, setNotifications] = useState(readNotifications);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const unreadCount = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    try {
      window.localStorage.setItem(
        NOTIFICATION_STORAGE_KEY,
        JSON.stringify(notifications.slice(0, 30)),
      );
    } catch (error) {
      console.error("Notifikasi tidak dapat disimpan pada perangkat ini.", error);
    }
  }, [notifications]);

  async function loadHistory(sourceFilter = historySourceFilter) {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const options = {};
      if (sourceFilter && sourceFilter !== "all") {
        options.source = sourceFilter;
      }
      const data = await fetchRecentScans(10, options);
      setHistory(data.scans || []);
    } catch (error) {
      setHistoryError(error.message);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadSites() {
    setSitesLoading(true);
    setSitesError("");
    try {
      const siteList = await fetchSites();
      const validSites = siteList.filter((site) => site && typeof site === "object");
      setSites(validSites);
      setSelectedSiteIds((current) =>
        current.filter((siteId) =>
          validSites.some((site) => site?.id === siteId && site?.status === "active"),
        )
      );
    } catch (error) {
      console.warn("Gagal memuat daftar situs.", error);
      setSitesError(error.message || "Gagal memuat daftar situs.");
      setSites([]);
    } finally {
      setSitesLoading(false);
    }
  }

  async function handleCreateSite(siteData) {
    const created = await createSite(siteData);
    await loadSites();
    return created;
  }

  async function handleUpdateSite(id, siteData) {
    const updated = await updateSite(id, siteData);
    await loadSites();
    return updated;
  }

  async function handleDeleteSite(id) {
    const res = await deleteSite(id);
    setSelectedSiteIds((current) => current.filter((siteId) => siteId !== id));
    await loadSites();
    return res;
  }

  async function loadSchedules() {
    setSchedulesLoading(true);
    setSchedulesError("");
    try {
      const scheduleList = await fetchSchedules();
      setSchedules(Array.isArray(scheduleList) ? scheduleList : []);
    } catch (error) {
      console.warn("Gagal memuat daftar jadwal.", error);
      setSchedulesError(error.message || "Gagal memuat daftar jadwal.");
      setSchedules([]);
    } finally {
      setSchedulesLoading(false);
    }
  }

  async function handleCreateSchedule(scheduleData) {
    const created = await createSchedule(scheduleData);
    await loadSchedules();
    return created;
  }

  async function handleUpdateSchedule(id, scheduleData) {
    const updated = await updateSchedule(id, scheduleData);
    await loadSchedules();
    return updated;
  }

  async function handleDeleteSchedule(id) {
    const res = await deleteSchedule(id);
    await loadSchedules();
    return res;
  }

  async function handleRunScheduleNow(id) {
    const res = await runScheduleNow(id);
    await loadSchedules();
    await loadHistory();
    return res;
  }

  useEffect(() => {
    loadHistory();
    requestApi("/health")
      .then(() => setApiHealth("online"))
      .catch(() => setApiHealth("offline"));
  }, []);

  useEffect(() => {
    if (apiHealth === "online") {
      loadSites();
      loadSchedules();
    }
  }, [apiHealth]);

  useEffect(() => {
    const syncTabWithHash = () => setActiveTab(tabFromHash());
    window.addEventListener("hashchange", syncTabWithHash);
    return () => window.removeEventListener("hashchange", syncTabWithHash);
  }, []);

  useEffect(() => {
    try {
      if (officerEmail) {
        window.localStorage.setItem("content-detection:officer-email", officerEmail);
      }
    } catch {}
  }, [officerEmail]);

  // Polling status background scan job
  useEffect(() => {
    if (!activeJob?.id) return;
    const interval = setInterval(async () => {
      try {
        const data = await fetchScanJob(activeJob.id);
        const job = data?.job;
        if (!job) return;

        if (job.status === "completed") {
          clearInterval(interval);
          setActiveJob(null);
          try {
            window.localStorage.removeItem("content-detection:active-job-id");
          } catch {}

          if (job.resultSummary) {
            setScanResult(job.resultSummary);
            if (job.resultSummary.results) {
              setBatchResults(job.resultSummary.results);
            }
            const newNotifications = notificationsFromScan(job.resultSummary);
            if (newNotifications.length) {
              setNotifications((current) =>
                [...newNotifications, ...current]
                  .filter(
                    (notification, index, all) =>
                      all.findIndex((item) => item.id === notification.id) === index,
                  )
                  .slice(0, 30),
              );
            }
            setActiveTab("hasil");
            window.location.hash = "hasil";
          }
          setScanStatus("completed");
          await loadHistory();
        } else if (job.status === "failed") {
          clearInterval(interval);
          setActiveJob(null);
          try {
            window.localStorage.removeItem("content-detection:active-job-id");
          } catch {}
          setScanStatus("failed");
          setScanError(job.errorMessage || "Pemindaian latar belakang gagal.");
        } else {
          setActiveJob((prev) => ({
            ...prev,
            progressScanned: job.progressScanned,
            progressTotal: job.progressTotal,
          }));
        }
      } catch (err) {
        console.warn("Polling scan job error:", err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [activeJob?.id]);

  // Periksa apakah ada background scan yang sedang berjalan saat dashboard dimuat
  useEffect(() => {
    let savedJobId = null;
    try {
      savedJobId = window.localStorage.getItem("content-detection:active-job-id");
    } catch {}

    if (savedJobId) {
      fetchScanJob(savedJobId)
        .then((data) => {
          if (data?.job && data.job.status === "running") {
            setActiveJob(data.job);
            setScanStatus("scanning");
          } else if (data?.job && data.job.status === "completed") {
            try {
              window.localStorage.removeItem("content-detection:active-job-id");
            } catch {}
          }
        })
        .catch(() => {});
    } else {
      fetchScanJobs({ status: "running" })
        .then((data) => {
          const running = data?.jobs || [];
          if (running.length > 0) {
            setActiveJob(running[0]);
            setScanStatus("scanning");
            try {
              window.localStorage.setItem("content-detection:active-job-id", running[0].id);
            } catch {}
          }
        })
        .catch(() => {});
    }
  }, []);

  function navigateToTab(tabId) {
    setActiveTab(tabId);
    if (window.location.hash !== `#${tabId}`) {
      window.location.hash = tabId;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setUrlError("");
    setEmailError("");
    setScanError("");
    setHistoryDetail(null);
    setSiteSelectionError("");

    let validatedEmail;
    try {
      validatedEmail = validateOfficerEmail(officerEmail);
    } catch (err) {
      setEmailError(err.message);
      setScanStatus("failed");
      return;
    }

    if (selectedSiteIds.length > 0) {
      const activeSites = sites.filter((site) => site.status === "active");
      const activeIds = activeSites.map((site) => site.id);
      const validSelected = selectedSiteIds.filter((siteId) => activeIds.includes(siteId));
      if (validSelected.length === 0) {
        setSiteSelectionError("Pilih situs aktif yang valid untuk memulai pemeriksaan.");
        setScanStatus("failed");
        return;
      }

      setScanStatus("scanning");
      setScanResult(null);
      setBatchResults(null);
      try {
        const data = await submitSiteScan({
          siteIds: validSelected,
          maxDepth: Number(maxDepth),
          maxPages: Number(maxPages),
          officerEmail: validatedEmail,
          background: true,
        });

        if (data?.jobId) {
          const jobObj = {
            id: data.jobId,
            targetUrl: data.targetUrl,
            officerEmail: data.officerEmail,
            startedAt: data.startedAt,
            status: "running",
          };
          setActiveJob(jobObj);
          try {
            window.localStorage.setItem("content-detection:active-job-id", data.jobId);
          } catch {}
          return;
        }

        const rawResults = data?.results || [];
        setBatchResults(rawResults);

        const allPages = rawResults.flatMap((result) => result.result?.pages || []);
        setScanResult({ pages: allPages });
        setActiveTab("hasil");
        window.location.hash = "hasil";

        const newNotifications = rawResults.flatMap((result) =>
          notificationsFromScan(result.result || { pages: [] }),
        );
        if (newNotifications.length) {
          setNotifications((current) =>
            [...newNotifications, ...current]
              .filter(
                (notification, index, all) =>
                  all.findIndex((item) => item.id === notification.id) === index,
              )
              .slice(0, 30)
          );
        }
        setScanStatus("completed");
        await loadHistory();
      } catch (error) {
        setScanStatus("failed");
        setScanError(error.message);
      }
      return;
    }

    try {
      validateTargetUrl(url);
    } catch (error) {
      setUrlError(error.message);
      setScanStatus("failed");
      return;
    }

    setScanStatus("scanning");
    setScanResult(null);
    setBatchResults(null);
    try {
      const data = await submitScan({
        url,
        maxDepth: Number(maxDepth),
        maxPages: Number(maxPages),
        baselineHtml,
        officerEmail: validatedEmail,
        background: true,
      });

      if (data?.jobId) {
        const jobObj = {
          id: data.jobId,
          targetUrl: data.targetUrl,
          officerEmail: data.officerEmail,
          startedAt: data.startedAt,
          status: "running",
        };
        setActiveJob(jobObj);
        try {
          window.localStorage.setItem("content-detection:active-job-id", data.jobId);
        } catch {}
        return;
      }

      setScanResult(data);
      setActiveTab("hasil");
      window.location.hash = "hasil";
      const newNotifications = notificationsFromScan(data);
      if (newNotifications.length) {
        setNotifications((current) =>
          [...newNotifications, ...current]
            .filter(
              (notification, index, all) =>
                all.findIndex((item) => item.id === notification.id) === index,
            )
            .slice(0, 30)
        );
      }
      setScanStatus("completed");
      await loadHistory();
    } catch (error) {
      setScanStatus("failed");
      setScanError(error.message);
    }
  }

  async function handleViewHistory(scanId) {
    setHistoryDetailError("");
    try {
      const data = await fetchScanById(scanId);
      const pageObj = historyToPage(data.scan);
      pageObj.emailNotification = data.emailNotification || null;
      setHistoryDetail(pageObj);
      setHistoryDetailError("");
    } catch (error) {
      setHistoryDetailError(error.message);
    }
  }

  async function handleResendEmail(scanId) {
    setResendingEmail(true);
    try {
      const result = await resendScanEmail(scanId);
      if (result?.notification) {
        setHistoryDetail((current) =>
          current ? { ...current, emailNotification: result.notification } : current
        );
      }
      alert(
        result?.message ||
          (result?.success
            ? "Email notifikasi berhasil dikirim!"
            : "Status pengiriman email: " + (result?.status || "Gagal")),
      );
    } catch (error) {
      alert("Gagal memproses pengiriman ulang email: " + error.message);
    } finally {
      setResendingEmail(false);
    }
  }

  async function handleDeleteHistory(scanId) {
    if (!window.confirm("Hapus riwayat pemeriksaan ini?")) return;

    setHistoryDeleteError("");
    setDeletingHistoryId(scanId);
    try {
      await deleteScanById(scanId);
      if (historyDetail?.id === scanId) setHistoryDetail(null);
      await loadHistory();
    } catch (error) {
      setHistoryDeleteError(error.message);
    } finally {
      setDeletingHistoryId("");
    }
  }

  function markNotificationRead(notificationId) {
    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item
      )
    );
  }

  async function viewNotification(notification) {
    markNotificationRead(notification.id);
    setNotificationOpen(false);
    if (scanResult?.pages?.some((page) => page.id === notification.scanId)) {
      navigateToTab("hasil");
      return;
    }
    if (notification.scanId) {
      await handleViewHistory(notification.scanId);
    } else {
      navigateToTab("hasil");
      return;
    }
    navigateToTab("riwayat");
  }

  const activeSites = sites.filter((site) => site.status === "active");
  const allActiveSelected =
    activeSites.length > 0 &&
    activeSites.every((site) => selectedSiteIds.includes(site.id));

  const resultPages = scanResult?.pages || [];
  const displayedResultPages = scanResult
    ? resultPages
    : history[0]
      ? [historyToPage(history[0])]
      : [];

  const resultStats = useMemo(() => {
    const total = displayedResultPages.length;
    let indicated = 0;
    let clean = 0;
    let failed = 0;

    displayedResultPages.forEach((page) => {
      const isCrawlFailed =
        page.crawl?.success === false ||
        page.crawlStatus === "failed" ||
        page.status === "failed";
      if (isCrawlFailed) {
        failed++;
      } else {
        const summary = summarizeIndications(page);
        if (summary.total > 0) {
          indicated++;
        } else {
          clean++;
        }
      }
    });

    return { total, indicated, clean, failed };
  }, [displayedResultPages]);

  const historyStats = useMemo(() => {
    const total = history.length;
    let success = 0;
    let failed = 0;
    let indicated = 0;

    history.forEach((scan) => {
      if (scan.crawlStatus === "failed") {
        failed++;
      } else {
        success++;
        const p = historyToPage(scan);
        if (summarizeIndications(p).total > 0) {
          indicated++;
        }
      }
    });

    return { total, success, failed, indicated };
  }, [history]);

  const filteredHistory = useMemo(() => {
    let list = [...history];

    if (historySearchQuery.trim()) {
      const q = historySearchQuery.toLowerCase();
      list = list.filter((scan) => {
        const matchedSite = sites.find((s) => s.url === scan.url);
        const name = (matchedSite?.name || scan.title || "").toLowerCase();
        const scanUrl = (scan.url || "").toLowerCase();
        return name.includes(q) || scanUrl.includes(q);
      });
    }

    if (historyStatusFilter === "success") {
      list = list.filter((s) => s.crawlStatus === "success");
    } else if (historyStatusFilter === "failed") {
      list = list.filter((s) => s.crawlStatus === "failed");
    }

    if (historyOutcomeFilter === "indicated") {
      list = list.filter((s) => {
        if (s.crawlStatus === "failed") return false;
        const p = historyToPage(s);
        return summarizeIndications(p).total > 0;
      });
    } else if (historyOutcomeFilter === "clean") {
      list = list.filter((s) => {
        if (s.crawlStatus === "failed") return false;
        const p = historyToPage(s);
        return summarizeIndications(p).total === 0;
      });
    }

    if (historyDateFrom) {
      const fromTime = new Date(historyDateFrom).getTime();
      list = list.filter((s) => new Date(s.scannedAt).getTime() >= fromTime);
    }
    if (historyDateTo) {
      const toTime = new Date(`${historyDateTo}T23:59:59.999Z`).getTime();
      list = list.filter((s) => new Date(s.scannedAt).getTime() <= toTime);
    }

    if (historySortOrder === "oldest") {
      list.sort((a, b) => new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime());
    }

    return list;
  }, [
    history,
    sites,
    historySearchQuery,
    historyStatusFilter,
    historyOutcomeFilter,
    historyDateFrom,
    historyDateTo,
    historySortOrder,
  ]);

  function handleExportResultPDF() {
    if (!displayedResultPages.length) return;
    setExportingPdf(true);
    setExportSuccessMsg("");
    try {
      const firstPage = displayedResultPages[0];
      const matchedSite = sites.find((s) => s.url === firstPage?.url);
      const siteName =
        matchedSite?.name || firstPage?.crawl?.title || firstPage?.url || "Hasil Pemeriksaan";
      exportScanReportPDF({
        siteName,
        url: firstPage?.url,
        scanId: firstPage?.id,
        scannedAt: firstPage?.scannedAt || new Date().toISOString(),
        scanSource: firstPage?.scanSource || "MANUAL",
        pages: displayedResultPages,
        crawlError: firstPage?.crawl?.error,
      });
      setExportSuccessMsg("Laporan PDF berhasil diunduh.");
      setTimeout(() => setExportSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      alert("Gagal membuat laporan PDF: " + err.message);
    } finally {
      setExportingPdf(false);
    }
  }

  function handleExportResultCSV() {
    if (!displayedResultPages.length) return;
    try {
      const firstPage = displayedResultPages[0];
      const matchedSite = sites.find((s) => s.url === firstPage?.url);
      const siteName =
        matchedSite?.name || firstPage?.crawl?.title || firstPage?.url || "Hasil Pemeriksaan";
      exportScanDetailToCSV({
        siteName,
        url: firstPage?.url,
        scannedAt: firstPage?.scannedAt || new Date().toISOString(),
        pages: displayedResultPages,
        scanId: firstPage?.id,
      });
      setExportSuccessMsg("Data CSV berhasil diunduh.");
      setTimeout(() => setExportSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      alert("Gagal membuat data CSV: " + err.message);
    }
  }

  function handleExportSinglePDF(scan) {
    try {
      const matchedSite = sites.find((s) => s.url === scan.url);
      const siteName = matchedSite?.name || scan.title || scan.url;
      const pageList = scan.pages ? scan.pages : [historyToPage(scan)];
      exportScanReportPDF({
        siteName,
        url: scan.url,
        scanId: scan.id,
        scannedAt: scan.scannedAt,
        scanSource: scan.scanSource || "MANUAL",
        pages: pageList,
        crawlError: scan.crawlMetadata?.error || scan.crawl?.error,
      });
      setExportSuccessMsg("Laporan PDF berhasil diunduh.");
      setTimeout(() => setExportSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      alert("Gagal membuat laporan PDF: " + err.message);
    }
  }

  function handleExportSingleCSV(scan) {
    try {
      const matchedSite = sites.find((s) => s.url === scan.url);
      const siteName = matchedSite?.name || scan.title || scan.url;
      const pageList = scan.pages ? scan.pages : [historyToPage(scan)];
      exportScanDetailToCSV({
        siteName,
        url: scan.url,
        scannedAt: scan.scannedAt,
        pages: pageList,
        scanId: scan.id,
      });
      setExportSuccessMsg("Data CSV berhasil diunduh.");
      setTimeout(() => setExportSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      alert("Gagal membuat data CSV: " + err.message);
    }
  }

  function handleExportHistoryListCSV() {
    try {
      exportHistoryListToCSV(filteredHistory, sites);
      setExportSuccessMsg("Rekap riwayat CSV berhasil diunduh.");
      setTimeout(() => setExportSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      alert("Gagal membuat rekap CSV: " + err.message);
    }
  }

  function handleViewInResultsTab(scan) {
    const page = historyToPage(scan);
    setScanResult({ pages: [page] });
    setBatchResults(null);
    navigateToTab("hasil");
  }
  const targetHost = hostLabel(url);
  const pagesWithIndications = history.filter(
    (scan) => summarizeIndications(historyToPage(scan)).total > 0,
  ).length;

  const totalSites = sites.length;
  const totalScans = history.length;
  const sitesWithIndications = pagesWithIndications;

  const activityData = useMemo(() => {
    const days = [];
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const now = new Date();

    const countsByDay = {};
    for (const scan of history) {
      if (!scan.scannedAt) continue;
      const d = new Date(scan.scannedAt);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      countsByDay[key] = (countsByDay[key] || 0) + 1;
    }

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dayLabel = dayNames[d.getDay()];
      days.push({
        label: dayLabel,
        value: countsByDay[key] || 0,
      });
    }

    return days;
  }, [history]);

  const distributionData = useMemo(() => {
    const categoryCounts = {};
    for (const scan of history) {
      const page = historyToPage(scan);
      const summary = summarizeIndications(page);
      for (const cat of summary.categories) {
        categoryCounts[cat.label] = (categoryCounts[cat.label] || 0) + cat.count;
      }
    }

    const palette = [
      tokens.categories.gambling,
      tokens.categories.fraud,
      tokens.categories.pornography,
      tokens.categories.link,
      tokens.categories.defacement,
      tokens.primary,
    ];

    const entries = Object.entries(categoryCounts);
    return entries.map(([label, value], idx) => ({
      label,
      value,
      color: palette[idx % palette.length],
    }));
  }, [history]);

  return (
    <AppShell
      activeRoute={activeTab}
      onNavigate={navigateToTab}
      user={username}
      onLogout={onLogout}
      connection={apiHealth}
      notifications={notifications}
      unreadCount={unreadCount}
      notificationOpen={notificationOpen}
      onToggleNotification={() => setNotificationOpen((open) => !open)}
      onMarkNotificationRead={markNotificationRead}
      onMarkAllNotificationsRead={() =>
        setNotifications((current) =>
          current.map((item) => ({ ...item, read: true }))
        )
      }
      onViewNotification={viewNotification}
    >
      {logoutError && (
        <div className="history-notice" role="alert">
          <TriangleAlert size={16} /> {logoutError}
        </div>
      )}

          {activeTab === "ringkasan" && (
            <OverviewPage
              totalSites={totalSites}
              totalScans={totalScans}
              sitesWithIndications={sitesWithIndications}
              activityData={activityData}
              distributionData={distributionData}
              history={history}
              historyLoading={historyLoading}
              historyError={historyError}
              onRefreshHistory={() => loadHistory()}
              onNavigate={navigateToTab}
              onViewHistory={handleViewHistory}
              historyToPage={historyToPage}
              summarizeIndications={summarizeIndications}
              sites={sites}
            />
          )}

          {activeTab === "pemeriksaan" && (
            <section className="scan-workbench">
              <form className="scan-form" onSubmit={handleSubmit} noValidate>
                <div className="scan-form-header">
                  <h3 className="scan-form-header-title">Target pemeriksaan</h3>
                  <p className="scan-form-header-desc">
                    Pilih situs aktif terdaftar atau masukkan URL manual di bawah.
                  </p>
                </div>

                {activeJob && (
                  <div
                    className="background-job-card"
                    style={{
                      margin: "0 0 20px",
                      padding: "16px",
                      background: "var(--color-primary-soft)",
                      border: "1px solid var(--color-primary-border)",
                      borderLeft: "4px solid var(--color-primary)",
                      borderRadius: "var(--radius-lg)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                    }}
                  >
                    <LoaderCircle
                      className="spin"
                      size={22}
                      style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: "2px" }}
                    />
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "var(--color-primary)",
                          fontSize: "14px",
                        }}
                      >
                        Pemindaian Berjalan Mandiri di Latar Belakang (Job ID: {activeJob.id})
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "var(--color-primary-hover)",
                          marginTop: "4px",
                        }}
                      >
                        Target: <strong>{activeJob.targetUrl}</strong> &bull; Email Petugas:{" "}
                        <strong>{activeJob.officerEmail}</strong>
                        {activeJob.progressTotal > 1 && (
                          <span>
                            {" "}
                            &bull; Kemajuan: {activeJob.progressScanned || 0} /{" "}
                            {activeJob.progressTotal}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--color-text-secondary)",
                          marginTop: "6px",
                          lineHeight: "1.4",
                        }}
                      >
                        Pemindaian dijalankan oleh background worker di backend secara mandiri. Anda dapat menutup browser, meninggalkan dashboard, atau mematikan laptop tanpa menghentikan pemindaian di server. Hasil pemindaian dan notifikasi otomatis akan dikirimkan ke email petugas di atas setelah pemindaian selesai.
                      </div>
                    </div>
                  </div>
                )}

                <div className="manual-url-section" style={{ marginBottom: "16px" }}>
                  <label className="field-label" htmlFor="officer-email">
                    Email Petugas <span style={{ color: "var(--color-danger)" }}>*</span>
                  </label>
                  <div
                    className={`manual-url-wrap ${emailError ? "input-invalid" : ""}`}
                  >
                    <span className="manual-url-prefix">
                      <Mail size={14} />
                    </span>
                    <input
                      id="officer-email"
                      className="manual-url-input"
                      type="email"
                      placeholder="Masukkan alamat email Anda untuk menerima notifikasi hasil pemindaian."
                      value={officerEmail}
                      onChange={(event) => {
                        setOfficerEmail(event.target.value);
                        if (emailError) setEmailError("");
                      }}
                      aria-describedby={emailError ? "email-error" : "officer-email-hint"}
                      aria-invalid={Boolean(emailError)}
                    />
                  </div>
                  {emailError ? (
                    <p id="email-error" className="field-error">
                      {emailError}
                    </p>
                  ) : (
                    <p id="officer-email-hint" className="field-hint">
                      Notifikasi hasil pemindaian akan dikirimkan ke alamat email ini setelah proses selesai.
                    </p>
                  )}
                </div>

                {sites.length > 0 && (
                  <div className="site-selection-panel">
                    <div className="site-selection-header">
                      <div>
                        <h4 className="site-selection-title">Daftar situs aktif</h4>
                        <p className="site-selection-desc">
                          Centang situs yang ingin diperiksa secara bersamaan.
                        </p>
                      </div>
                      <span className="site-selection-count">
                        {selectedSiteIds.length} situs dipilih
                      </span>
                    </div>
                    <div className="site-selection-toolbar">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          const activeIds = activeSites.map((s) => s.id);
                          if (allActiveSelected) {
                            setSelectedSiteIds((current) =>
                              current.filter((id) => !activeIds.includes(id))
                            );
                          } else {
                            setSelectedSiteIds((current) =>
                              Array.from(new Set([...current, ...activeIds]))
                            );
                          }
                        }}
                      >
                        {allActiveSelected
                          ? "Batal pilih semua situs"
                          : "Pilih semua situs aktif"}
                      </button>
                      {selectedSiteIds.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-muted"
                          onClick={() => setSelectedSiteIds([])}
                        >
                          Kosongkan pilihan
                        </button>
                      )}
                    </div>
                    {activeSites.length === 0 ? (
                      <p className="site-empty-hint">
                        Tidak ada situs aktif. Silakan tambahkan atau aktifkan situs
                        di menu Manajemen Situs.
                      </p>
                    ) : (
                      <div className="site-checklist" role="group" aria-label="Pilihan situs aktif">
                        {activeSites.map((site) => (
                          <label
                            className={`site-checklist-item ${selectedSiteIds.includes(site.id) ? "selected" : ""}`}
                            key={site.id}
                          >
                            <input
                              type="checkbox"
                              checked={selectedSiteIds.includes(site.id)}
                              onChange={() =>
                                setSelectedSiteIds((current) =>
                                  current.includes(site.id)
                                    ? current.filter((id) => id !== site.id)
                                    : [...current, site.id]
                                )
                              }
                            />
                            <div className="site-item-details">
                              <span className="site-item-name">{site.name}</span>
                              <span className="site-item-url">{site.url}</span>
                              <span className="site-item-meta">
                                Kedalaman: {site.maxDepth} · Maks. {site.maxPages} hal
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                    {siteSelectionError && (
                      <p className="field-error">{siteSelectionError}</p>
                    )}
                  </div>
                )}

                <div className="manual-url-section">
                  <label className="field-label" htmlFor="target-url">
                    URL situs
                  </label>
                  <div
                    className={`manual-url-wrap ${urlError ? "input-invalid" : ""}`}
                  >
                    <span className="manual-url-prefix">
                      <Globe2 size={14} />
                    </span>
                    <input
                      id="target-url"
                      className="manual-url-input"
                      type="url"
                      placeholder="https://example.sumbawakab.go.id/"
                      value={url}
                      onChange={(event) => {
                        setUrl(event.target.value);
                        if (urlError) setUrlError("");
                      }}
                      aria-describedby={urlError ? "url-error" : "target-scope"}
                      aria-invalid={Boolean(urlError)}
                    />
                    <span className="manual-url-scheme">HTTP / HTTPS</span>
                  </div>
                  {urlError ? (
                    <p id="url-error" className="field-error">
                      {urlError}
                    </p>
                  ) : (
                    <p id="target-scope" className="field-hint">
                      Host yang diizinkan: <code>{targetHost}</code>
                    </p>
                  )}
                </div>

                <div className="crawl-options">
                  <div className="crawl-option">
                    <label>Kedalaman</label>
                    <select
                      value={maxDepth}
                      onChange={(event) => setMaxDepth(event.target.value)}
                    >
                      <option value="0">0 (Halaman awal saja)</option>
                      <option value="1">1 (Tautan langsung)</option>
                      <option value="2">2 (Dua tingkat)</option>
                    </select>
                  </div>
                  <div className="crawl-option">
                    <label>Maks. halaman</label>
                    <select
                      value={maxPages}
                      onChange={(event) => setMaxPages(event.target.value)}
                    >
                      <option value="5">5 halaman</option>
                      <option value="10">10 halaman</option>
                      <option value="20">20 halaman</option>
                      <option value="50">50 halaman</option>
                      <option value="100">100 halaman</option>
                    </select>
                  </div>
                  <div className="scope-readout">
                    <span className="scope-readout-label">METODE</span>
                    <strong className="scope-readout-value">
                      {selectedSiteIds.length > 0
                        ? `${selectedSiteIds.length} SITUS TERPILIH`
                        : targetHost}
                    </strong>
                  </div>
                </div>

                <details className="baseline-field">
                  <summary>
                    Baseline perubahan halaman <span>Opsional</span>
                  </summary>
                  <label className="visually-hidden" htmlFor="baseline-html">
                    HTML baseline
                  </label>
                  <textarea
                    id="baseline-html"
                    rows="4"
                    placeholder="Tempel HTML baseline untuk URL manual awal..."
                    value={baselineHtml}
                    onChange={(event) => setBaselineHtml(event.target.value)}
                  />
                </details>

                <div className="form-footer">
                  <p className="form-footer-text">
                    <ShieldCheck size={15} /> Analisis berjalan melalui service backend.
                  </p>
                  <button
                    type="submit"
                    className="analyze-button"
                    disabled={scanStatus === "scanning"}
                  >
                    {scanStatus === "scanning" ? (
                      <LoaderCircle className="spin" size={17} />
                    ) : (
                      <FileSearch size={17} />
                    )}
                    {scanStatus === "scanning"
                      ? "Memindai..."
                      : selectedSiteIds.length > 0
                        ? `Mulai pemeriksaan (${selectedSiteIds.length} situs)`
                        : "Mulai analisis"}
                    {scanStatus !== "scanning" && <ChevronRight size={16} />}
                  </button>
                </div>
              </form>

              <aside className={`scan-state state-${scanStatus}`} aria-live="polite">
                <div className={`state-orbit ${scanStatus}`}>
                  {scanStatus === "scanning" ? (
                    <LoaderCircle className="spin" size={25} />
                  ) : scanStatus === "completed" ? (
                    <Check size={25} />
                  ) : scanStatus === "failed" ? (
                    <TriangleAlert size={25} />
                  ) : (
                    <Activity size={25} />
                  )}
                </div>
                <p className="scan-state-eyebrow">STATUS PEMERIKSAAN</p>
                <h2 className="scan-state-title">
                  {scanStatus === "ready"
                    ? "Siap"
                    : scanStatus === "scanning"
                      ? "Sedang diproses"
                      : scanStatus === "completed"
                        ? "Selesai"
                        : "Gagal"}
                </h2>
                <p className="state-copy">
                  {scanStatus === "ready"
                    ? "Pilih situs terdaftar atau masukkan URL manual untuk memulai."
                    : scanStatus === "scanning"
                      ? "Crawler dan detector sedang memproses halaman."
                      : scanStatus === "completed"
                        ? batchResults
                          ? `${batchResults.length} situs diproses (${resultPages.length} halaman).`
                          : `${resultPages.length} halaman diproses.`
                        : "Permintaan tidak dapat diselesaikan."}
                </p>
                {scanError && (
                  <div role="alert" className="state-error">
                    {scanError}
                  </div>
                )}
                {scanResult && (
                  <div className="state-time">
                    <Clock3 size={14} /> {formatTime(new Date().toISOString())}
                  </div>
                )}

                {batchResults && batchResults.length > 0 && (
                  <div className="batch-status-panel">
                    <span className="batch-status-heading">Hasil per situs:</span>
                    <ul className="batch-site-summary-list">
                      {batchResults.map((res) => (
                        <li key={res.siteId || res.url}>
                          <span className="batch-site-summary-name">
                            {res.siteName || res.url}
                          </span>
                          <StatusBadge status={siteStatusTone(res)}>
                            {siteStatusLabel(res)}
                          </StatusBadge>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigateToTab("hasil")}
                    >
                      Lihat hasil detail di tab Hasil <ArrowDownRight size={13} />
                    </button>
                  </div>
                )}

                <div className="state-rule" />
                <div className="state-foot">
                  <span>Indikator</span>
                  <span>BUKAN KESIMPULAN ABSOLUT</span>
                </div>
              </aside>
            </section>
          )}

          {activeTab === "situs" && (
            <SiteManagement
              sites={sites}
              loading={sitesLoading}
              error={sitesError}
              onRefresh={loadSites}
              onCreateSite={handleCreateSite}
              onUpdateSite={handleUpdateSite}
              onDeleteSite={handleDeleteSite}
            />
          )}

          {activeTab === "jadwal" && (
            <ScheduleManagement
              schedules={schedules}
              sites={sites}
              loading={schedulesLoading}
              error={schedulesError}
              onRefresh={loadSchedules}
              onCreateSchedule={handleCreateSchedule}
              onUpdateSchedule={handleUpdateSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              onRunNow={handleRunScheduleNow}
            />
          )}

          {activeTab === "hasil" && (
            <section
              className="results-section"
              id="hasil"
              aria-label="Hasil pemeriksaan"
            >
              {exportSuccessMsg && (
                <div className="toast-notification" role="status">
                  <Check size={16} /> <span>{exportSuccessMsg}</span>
                </div>
              )}

              {batchResults && batchResults.length > 0 ? (
                <div className="batch-results-wrapper">
                  <div className="batch-overview-banner">
                    <div>
                      <p className="eyebrow">
                        <span /> HASIL PEMERIKSAAN BATCH
                      </p>
                      <h1 className="results-main-title">Hasil Deteksi</h1>
                      <h2 className="results-header-title">Hasil pemeriksaan situs terdaftar</h2>
                      <p className="results-description">
                        Informasi hasil pemeriksaan dan indikasi konten negatif pada situs yang dipantau.
                      </p>
                      <p className="batch-summary-copy">
                        {batchResults.filter((r) => getSiteOutcome(r) === "success").length}{" "}
                        dari {batchResults.length} situs berhasil diperiksa secara penuh.
                      </p>
                    </div>
                    <div className="batch-actions-wrap">
                      <div className="batch-overall-badge">
                        <span className="batch-badge-label">Status pemeriksaan:</span>
                        <StatusBadge
                          status={
                            getBatchOutcome(batchResults) === "success"
                              ? "success"
                              : getBatchOutcome(batchResults) === "failed"
                                ? "failed"
                                : "pending"
                          }
                        >
                          {batchStatusLabel(batchResults)}
                        </StatusBadge>
                      </div>
                      <div className="results-export-buttons">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={handleExportResultPDF}
                          disabled={exportingPdf}
                          title="Unduh laporan resmi PDF"
                        >
                          {exportingPdf ? (
                            <LoaderCircle className="spin" size={14} />
                          ) : (
                            <FileDown size={14} />
                          )}
                          Ekspor PDF
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={handleExportResultCSV}
                          title="Unduh data hasil ke CSV"
                        >
                          <Download size={14} />
                          Ekspor CSV
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="batch-sites-list">
                    {batchResults.map((siteResult) => (
                      <section
                        className="site-result-block"
                        key={siteResult.siteId || siteResult.url}
                      >
                        <div className="site-result-header">
                          <div className="site-result-title-group">
                            <h3>{siteResult.siteName}</h3>
                            <a
                              href={siteResult.url}
                              target="_blank"
                              rel="noreferrer"
                              className="site-url"
                            >
                              {siteResult.url} <ExternalLink size={13} />
                            </a>
                          </div>
                          <div className="site-result-meta-group">
                            <span className="site-result-page-count">
                              {siteResult.result?.pages?.length ?? 0} halaman
                            </span>
                            <StatusBadge status={siteStatusTone(siteResult)}>
                              {siteStatusLabel(siteResult)}
                            </StatusBadge>
                          </div>
                        </div>

                        {siteResult.status === "failed" ||
                        !siteResult.result?.pages?.length ? (
                          <div className="site-result-error" role="alert">
                            <TriangleAlert size={16} />
                            <span>
                              {siteResult.error?.message ||
                                "Situs tidak dapat diakses atau perayapan gagal."}
                            </span>
                          </div>
                        ) : (
                          <div className="site-pages-container">
                            {siteResult.result.pages.map((page) => (
                              <ScanPage
                                key={page.id || page.url}
                                page={page}
                              />
                            ))}
                          </div>
                        )}
                      </section>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="results-container">
                  <div className="results-header-container">
                    <div className="results-header-top">
                      <div>
                        <p className="eyebrow">
                          <span /> SISTEM MONITORING CSIRT • PEMERIKSAAN KONTEN
                        </p>
                        <h1 className="results-main-title">Hasil Deteksi</h1>
                        <h2 className="results-header-title">Hasil pemeriksaan terbaru</h2>
                        <p className="results-description">
                          Informasi hasil pemeriksaan dan indikasi konten negatif pada situs yang dipantau.
                        </p>
                      </div>

                      {displayedResultPages.length > 0 && (
                        <div className="results-export-buttons">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={handleExportResultPDF}
                            disabled={exportingPdf}
                            title="Unduh laporan resmi PDF"
                          >
                            {exportingPdf ? (
                              <LoaderCircle className="spin" size={14} />
                            ) : (
                              <FileDown size={14} />
                            )}
                            Ekspor PDF
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={handleExportResultCSV}
                            title="Unduh tabel hasil ke CSV"
                          >
                            <Download size={14} />
                            Ekspor CSV
                          </button>
                        </div>
                      )}
                    </div>

                    {displayedResultPages.length > 0 && (
                      <div className="results-meta-bar">
                        <span className="results-meta-item">
                          <Globe2 size={14} />
                          <strong>{displayedResultPages.length}</strong> halaman diperiksa
                        </span>
                        <span className="results-meta-item">
                          <Clock size={14} />
                          Waktu pemeriksaan:{" "}
                          <strong>{formatTime(displayedResultPages[0]?.scannedAt)}</strong>
                        </span>
                        {displayedResultPages[0]?.url && (
                          <span className="results-meta-item">
                            Target: <code>{displayedResultPages[0].url}</code>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status Notifikasi Email Petugas */}
                  {displayedResultPages.length > 0 && (() => {
                    const notif = scanResult?.emailNotification || displayedResultPages[0]?.emailNotification;
                    const officer = displayedResultPages[0]?.officerEmail || notif?.recipient;
                    if (!notif && !officer) return null;

                    const isSent = notif?.status === "sent" || notif?.notified === true;
                    const isFailed = notif?.status === "failed" || (notif && notif.notified === false && notif.reason !== "NO_INDICATIONS");
                    const errorMsg = notif?.errorMessage || notif?.error;

                    return (
                      <div
                        style={{
                          margin: "0 0 16px",
                          padding: "12px 18px",
                          borderRadius: "var(--radius-lg)",
                          border: isSent ? "1px solid var(--color-success-border)" : isFailed ? "1px solid var(--color-danger-border)" : "1px solid var(--color-border-subtle)",
                          background: isSent ? "var(--color-success-soft)" : isFailed ? "var(--color-danger-soft)" : "var(--color-surface-muted)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "12px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
                          <Mail size={18} style={{ color: isSent ? "var(--color-success)" : isFailed ? "var(--color-danger)" : "var(--color-text-tertiary)" }} />
                          <div>
                            <div style={{ fontWeight: 600, color: isSent ? "var(--color-success)" : isFailed ? "var(--color-danger)" : "var(--color-text)" }}>
                              {isSent && `Laporan email berhasil dikirim ke: ${officer || notif?.recipient}`}
                              {isFailed && `Notifikasi email gagal terkirim ke: ${officer || notif?.recipient}`}
                              {!isSent && !isFailed && `Penerima notifikasi email: ${officer}`}
                            </div>
                            {isFailed && errorMsg && (
                              <div style={{ fontSize: "12px", color: "var(--color-danger)", marginTop: "2px" }}>
                                Penyebab: {errorMsg.includes("BadCredentials") || errorMsg.includes("535")
                                  ? "Autentikasi SMTP ditolak (Password Gmail biasa tidak dapat digunakan. Wajib menggunakan Google App Password)."
                                  : errorMsg}
                              </div>
                            )}
                            {isSent && notif?.messageId && (
                              <div style={{ fontSize: "11px", color: "var(--color-success)", marginTop: "2px" }}>
                                ID Pesan: {notif.messageId}
                              </div>
                            )}
                          </div>
                        </div>
                        {isFailed && displayedResultPages[0]?.id && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: "12px", padding: "5px 12px" }}
                            disabled={resendingEmail}
                            onClick={() => handleResendEmail(displayedResultPages[0].id)}
                          >
                            <RotateCw size={13} className={resendingEmail ? "spin" : ""} />
                            Kirim Ulang Email
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {displayedResultPages.length > 0 && (
                    <div className="results-summary-cards">
                      <div className="result-summary-card result-summary-card--total">
                        <div className="result-card-val">{resultStats.total}</div>
                        <div className="result-card-label">Total Halaman Diperiksa</div>
                        <div className="result-card-sub">Jangkauan crawling aktif</div>
                      </div>
                      <div className="result-summary-card result-summary-card--indicated">
                        <div className="result-card-val text-red">{resultStats.indicated}</div>
                        <div className="result-card-label">Halaman dengan Indikasi</div>
                        <div className="result-card-sub">Ditemukan pola konten negatif</div>
                      </div>
                      <div className="result-summary-card result-summary-card--clean">
                        <div className="result-card-val text-emerald">{resultStats.clean}</div>
                        <div className="result-card-label">Halaman Tanpa Indikasi</div>
                        <div className="result-card-sub">Bersih & lolos uji detector</div>
                      </div>
                      <div className="result-summary-card result-summary-card--failed">
                        <div className="result-card-val text-amber">{resultStats.failed}</div>
                        <div className="result-card-label">Halaman Gagal Diperiksa</div>
                        <div className="result-card-sub">Kendala koneksi atau host diblokir</div>
                      </div>
                    </div>
                  )}

                  {displayedResultPages.length === 0 ? (
                    <div className="empty-state">
                      <FileSearch size={20} />
                      <p>Belum ada hasil pemeriksaan terbaru.</p>
                    </div>
                  ) : (
                    <div className="results-list">
                      {displayedResultPages.map((page) => (
                        <ScanPage
                          key={page.id || page.url}
                          page={page}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {activeTab === "riwayat" && (
            <section
              className="history-section"
              id="riwayat"
              aria-label="Riwayat scan"
            >
              {exportSuccessMsg && (
                <div className="toast-notification" role="status">
                  <Check size={16} /> <span>{exportSuccessMsg}</span>
                </div>
              )}

              {/* 1. Summary Cards */}
              <div className="history-summary-cards">
                <div className="history-summary-card history-card--total">
                  <div className="history-card-num">{historyStats.total}</div>
                  <div className="history-card-label">Total Pemindaian</div>
                  <div className="history-card-sub">Seluruh catatan riwayat database</div>
                </div>
                <div className="history-summary-card history-card--success">
                  <div className="history-card-num text-emerald">{historyStats.success}</div>
                  <div className="history-card-label">Pemindaian Berhasil</div>
                  <div className="history-card-sub">Perayapan tuntas tanpa kendala</div>
                </div>
                <div className="history-summary-card history-card--indicated">
                  <div className="history-card-num text-red">{historyStats.indicated}</div>
                  <div className="history-card-label">Dengan Indikasi</div>
                  <div className="history-card-sub">Ditemukan pola konten mencurigakan</div>
                </div>
                <div className="history-summary-card history-card--failed">
                  <div className="history-card-num text-amber">{historyStats.failed}</div>
                  <div className="history-card-label">Pemindaian Gagal</div>
                  <div className="history-card-sub">Kendala akses atau host diblokir</div>
                </div>
              </div>

              {/* 2. Main History Card */}
              <div className="card history-main-card">
                <div className="card-header history-card-header">
                  <div>
                    <h3 className="card-title">Riwayat scan</h3>
                    <p className="card-subtitle">
                      Daftar inspeksi keamanan, deteksi konten, dan integritas web.
                    </p>
                  </div>
                  <div className="history-heading-right">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleExportHistoryListCSV}
                      disabled={filteredHistory.length === 0}
                      title="Ekspor seluruh data riwayat tabel ke CSV"
                    >
                      <Download size={14} /> Ekspor CSV Riwayat
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      onClick={() => loadHistory()}
                      disabled={historyLoading}
                      aria-label="Muat ulang riwayat"
                    >
                      <RotateCw size={14} className={historyLoading ? "spin" : ""} />
                    </button>
                  </div>
                </div>

                <div className="card-body">
                  {/* 3. Search and Filters Toolbar */}
                  <div className="history-toolbar">
                    <div className="history-search-wrap">
                      <Search size={18} className="history-search-icon" />
                      <input
                        type="text"
                        className="history-search-input"
                        placeholder="Cari situs atau URL..."
                        value={historySearchQuery}
                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                        aria-label="Cari riwayat"
                      />
                      {historySearchQuery && (
                        <button
                          type="button"
                          className="btn-clear"
                          onClick={() => setHistorySearchQuery("")}
                          aria-label="Hapus pencarian"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    <div className="history-filters-row">
                      {/* Source Filter Pills (required by Vitest tests) */}
                      <div className="history-filter-pills" role="radiogroup" aria-label="Filter sumber riwayat">
                        <span className="filter-label-inline">Sumber:</span>
                        <button
                          type="button"
                          className={`badge ${historySourceFilter === "all" ? "badge-blue" : "badge-gray"}`}
                          onClick={() => {
                            setHistorySourceFilter("all");
                            loadHistory("all");
                          }}
                        >
                          Semua
                        </button>
                        <button
                          type="button"
                          className={`badge ${historySourceFilter === "MANUAL" ? "badge-green" : "badge-gray"}`}
                          onClick={() => {
                            setHistorySourceFilter("MANUAL");
                            loadHistory("MANUAL");
                          }}
                        >
                          Manual
                        </button>
                        <button
                          type="button"
                          className={`badge ${historySourceFilter === "SCHEDULED" ? "badge-green" : "badge-gray"}`}
                          onClick={() => {
                            setHistorySourceFilter("SCHEDULED");
                            loadHistory("SCHEDULED");
                          }}
                        >
                          Terjadwal
                        </button>
                      </div>

                      {/* Filter Status Pemindaian */}
                      <div className="history-select-wrap">
                        <label htmlFor="history-status-filter" className="filter-label-inline">Status:</label>
                        <select
                          id="history-status-filter"
                          className="history-filter-select"
                          value={historyStatusFilter}
                          onChange={(e) => setHistoryStatusFilter(e.target.value)}
                        >
                          <option value="all">Semua Status</option>
                          <option value="success">Berhasil Saja</option>
                          <option value="failed">Gagal Saja</option>
                        </select>
                      </div>

                      {/* Filter Hasil Indikasi */}
                      <div className="history-select-wrap">
                        <label htmlFor="history-outcome-filter" className="filter-label-inline">Hasil:</label>
                        <select
                          id="history-outcome-filter"
                          className="history-filter-select"
                          value={historyOutcomeFilter}
                          onChange={(e) => setHistoryOutcomeFilter(e.target.value)}
                        >
                          <option value="all">Semua Hasil</option>
                          <option value="indicated">Terindikasi Saja</option>
                          <option value="clean">Bebas Indikasi Saja</option>
                        </select>
                      </div>

                      {/* Sort Order */}
                      <div className="history-select-wrap">
                        <label htmlFor="history-sort-select" className="filter-label-inline">Urutan:</label>
                        <select
                          id="history-sort-select"
                          className="history-filter-select"
                          value={historySortOrder}
                          onChange={(e) => setHistorySortOrder(e.target.value)}
                        >
                          <option value="newest">Waktu Terbaru</option>
                          <option value="oldest">Waktu Terlama</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 4. Table or Notices */}
                  {historyError ? (
                    <div className="history-notice" role="status">
                      <TriangleAlert size={16} /> {historyError}
                    </div>
                  ) : historyLoading ? (
                    <div className="history-notice">
                      <LoaderCircle className="spin" size={16} /> Memuat riwayat...
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="history-empty">
                      <History size={24} />
                      {history.length === 0 ? (
                        <span>Belum ada riwayat scan.</span>
                      ) : (
                        <span>Tidak ada riwayat yang cocok dengan filter pencarian.</span>
                      )}
                    </div>
                  ) : (
                    <div className="table-wrap">
                      <table className="table history-table">
                        <thead>
                          <tr>
                            <th>No</th>
                            <th>Website / Instansi</th>
                            <th>Sumber</th>
                            <th>Petugas</th>
                            <th>Waktu</th>
                            <th>Perayapan</th>
                            <th>Deteksi Teks</th>
                            <th>Perubahan Halaman</th>
                            <th>Deteksi Tautan</th>
                            <th>Kesimpulan</th>
                            <th>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredHistory.map((scan, index) => {
                            const matchedSite = sites.find((s) => s.url === scan.url);
                            const displayName = matchedSite?.name || scan.title || scan.url;
                            const isScheduled = scan.scanSource === "SCHEDULED";
                            const scanPageObj = historyToPage(scan);
                            const scanIndications = summarizeIndications(scanPageObj);
                            const hasIndication = scanIndications.total > 0;
                            const isFailed = scan.crawlStatus === "failed";

                            return (
                              <tr key={scan.id}>
                                <td className="history-num-cell">{index + 1}</td>
                                <td className="history-url-cell">
                                  <span className="history-site-name">{displayName}</span>
                                  <code className="history-url-code">{scan.url}</code>
                                </td>
                                <td>
                                  <span className={`badge ${isScheduled ? "badge-green" : "badge-gray"}`}>
                                    {isScheduled ? "TERJADWAL" : "MANUAL"}
                                  </span>
                                </td>
                                <td>
                                  <code style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                                    {scan.officerEmail || "-"}
                                  </code>
                                </td>
                                <td className="history-time">
                                  {formatTime(scan.scannedAt)}
                                </td>
                                <td>
                                  <StatusBadge status={scan.crawlStatus}>
                                    {scan.crawlStatus === "success"
                                      ? "BERHASIL"
                                      : "GAGAL"}
                                  </StatusBadge>
                                </td>
                                <td>
                                  <StatusBadge status={scan.textDetectionStatus}>
                                    {scan.textDetectionStatus === "success"
                                      ? (scan.textDetection?.data?.detected ? "TERINDIKASI" : "BERHASIL")
                                      : scan.textDetectionStatus === "skipped"
                                        ? "DILEWATI"
                                        : scan.textDetectionStatus
                                          ? "GAGAL"
                                          : "—"}
                                  </StatusBadge>
                                </td>
                                <td>
                                  <StatusBadge status={scan.defacementDetectionStatus}>
                                    {scan.defacementDetectionStatus === "success"
                                      ? (scan.defacementDetection?.data?.detected ? "TERINDIKASI" : "BERHASIL")
                                      : scan.defacementDetectionStatus === "skipped"
                                        ? "DILEWATI"
                                        : scan.defacementDetectionStatus
                                          ? "GAGAL"
                                          : "—"}
                                  </StatusBadge>
                                </td>
                                <td>
                                  <StatusBadge status={scan.linkDetectionStatus}>
                                    {scan.linkDetectionStatus === "success"
                                      ? (scan.linkDetection?.data?.detected ? "TERINDIKASI" : "BERHASIL")
                                      : scan.linkDetectionStatus === "skipped"
                                        ? "DILEWATI"
                                        : scan.linkDetectionStatus
                                          ? "GAGAL"
                                          : "—"}
                                  </StatusBadge>
                                </td>
                                <td>
                                  <StatusBadge status={isFailed ? "failed" : hasIndication ? "bad" : "success"}>
                                    {isFailed
                                      ? "GAGAL"
                                      : hasIndication
                                        ? `${scanIndications.total} INDIKASI`
                                        : "AMAN"}
                                  </StatusBadge>
                                </td>
                                <td>
                                  <div className="site-row-actions">
                                    <button
                                      className="btn btn-ghost btn-sm"
                                      type="button"
                                      onClick={() => handleViewHistory(scan.id)}
                                      title="Buka panel detail lengkap"
                                    >
                                      Lihat <ArrowDownRight size={13} />
                                    </button>
                                    <button
                                      className="btn btn-ghost btn-sm"
                                      type="button"
                                      onClick={() => handleViewInResultsTab(scan)}
                                      title="Buka hasil deteksi untuk scan ini"
                                    >
                                      Hasil
                                    </button>
                                    <button
                                      className="btn btn-ghost btn-sm"
                                      type="button"
                                      onClick={() => handleExportSinglePDF(scan)}
                                      title="Unduh Laporan Resmi PDF"
                                    >
                                      <FileDown size={13} /> PDF
                                    </button>
                                    <button
                                      className="btn btn-ghost btn-sm"
                                      type="button"
                                      onClick={() => handleExportSingleCSV(scan)}
                                      title="Unduh Data CSV"
                                    >
                                      <Download size={13} /> CSV
                                    </button>
                                    <button
                                      className="btn btn-danger btn-sm"
                                      type="button"
                                      disabled={deletingHistoryId === scan.id}
                                      onClick={() => handleDeleteHistory(scan.id)}
                                      title="Hapus riwayat ini"
                                    >
                                      {deletingHistoryId === scan.id ? (
                                        <LoaderCircle className="spin" size={13} />
                                      ) : (
                                        <Trash2 size={13} />
                                      )}
                                      Hapus
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {historyDeleteError && (
                    <p className="field-error" role="alert">
                      {historyDeleteError}
                    </p>
                  )}
                  {historyDetailError && (
                    <p className="field-error" role="alert">
                      {historyDetailError}
                    </p>
                  )}

                  {/* 5. Detail Riwayat Section */}
                  {historyDetail && (
                    <div className="history-detail">
                      <div className="history-detail-heading">
                        <div>
                          <span className="eyebrow">DETAIL RIWAYAT</span>
                          <h3 className="history-detail-title">{historyDetail.url}</h3>
                          <div className="history-detail-meta">
                            <span>
                              <Clock3 size={13} /> Waktu: {formatTime(historyDetail.scannedAt)}
                            </span>
                            <span>
                              Sumber:{" "}
                              <strong className={`badge ${historyDetail.scanSource === "SCHEDULED" ? "badge-green" : "badge-gray"}`}>
                                {historyDetail.scanSource === "SCHEDULED"
                                  ? "TERJADWAL"
                                  : "MANUAL"}
                              </strong>
                            </span>
                            {historyDetail.officerEmail && (
                              <span>
                                Petugas:{" "}
                                <strong>{historyDetail.officerEmail}</strong>
                              </span>
                            )}
                            <span>
                              Perayapan:{" "}
                              <strong className={historyDetail.crawl.success ? "text-success" : "text-danger"}>
                                {historyDetail.crawl.success ? "BERHASIL" : "GAGAL"}
                              </strong>
                              {historyDetail.crawl.status
                                ? ` · HTTP ${historyDetail.crawl.status}`
                                : ""}
                            </span>
                          </div>
                        </div>
                        <div className="history-detail-actions">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleExportSinglePDF(historyDetail)}
                            title="Ekspor laporan riwayat ini ke PDF"
                          >
                            <FileDown size={14} /> Ekspor PDF
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleExportSingleCSV(historyDetail)}
                            title="Ekspor detail riwayat ini ke CSV"
                          >
                            <Download size={14} /> Ekspor CSV
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setHistoryDetail(null)}
                            type="button"
                          >
                            Tutup
                          </button>
                        </div>
                      </div>

                      {/* Informasi Status Notifikasi Email */}
                      <div
                        className="history-notification-banner"
                        style={{
                          margin: "16px 20px 0",
                          padding: "10px 16px",
                          background: "var(--color-surface-muted)",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--color-border-subtle)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "13px",
                          }}
                        >
                          <Mail size={15} style={{ color: "var(--color-text-tertiary)" }} />
                          <span style={{ color: "var(--color-text-secondary)", fontWeight: 600 }}>
                            Status Notifikasi Email:
                          </span>
                          {(() => {
                            const notif = historyDetail.emailNotification;
                            const indications = summarizeIndications(historyDetail);
                            if (!notif && indications.total === 0) {
                              return (
                                <span className="badge badge-gray">
                                  Tidak Dikirim (Bebas Indikasi)
                                </span>
                              );
                            }
                            if (!notif && indications.total > 0) {
                              return (
                                <span className="badge badge-gray">
                                  Belum Diproses
                                </span>
                              );
                            }
                            if (notif.status === "sent") {
                              return (
                                <span
                                  className="badge badge-green"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                  title={notif.sentAt ? `Terkirim pada: ${formatTime(notif.sentAt)}` : "Terkirim"}
                                >
                                  <Check size={12} /> Terkirim ke {notif.recipient || "Admin"}
                                </span>
                              );
                            }
                            if (notif.status === "failed") {
                              return (
                                <span
                                  className="badge badge-red"
                                  title={notif.errorMessage || "Gagal mengirim email"}
                                >
                                  Gagal Terkirim: {notif.errorMessage || "Koneksi SMTP Terputus"}
                                </span>
                              );
                            }
                            if (notif.status === "not_configured") {
                              return (
                                <span className="badge badge-amber">
                                  SMTP Belum Dikonfigurasi
                                </span>
                              );
                            }
                            if (notif.status === "pending") {
                              return (
                                <span className="badge badge-blue">
                                  Menunggu Pengiriman...
                                </span>
                              );
                            }
                            return (
                              <span className="badge badge-gray">{notif.status}</span>
                            );
                          })()}
                        </div>

                        {historyDetail.emailNotification &&
                          (historyDetail.emailNotification.status === "failed" ||
                            historyDetail.emailNotification.status === "not_configured") && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: "12px", padding: "4px 10px" }}
                              disabled={resendingEmail}
                              onClick={() => handleResendEmail(historyDetail.id)}
                            >
                              <RotateCw
                                size={12}
                                className={resendingEmail ? "spin" : ""}
                              />{" "}
                              {resendingEmail ? "Mengirim..." : "Kirim Ulang Email"}
                            </button>
                          )}
                      </div>

                      {/* Error Banner jika crawl gagal */}
                      {(!historyDetail.crawl?.success || historyDetail.crawl?.error) && (
                        <div className="crawl-failure-banner" style={{ margin: "16px 20px 0" }} role="alert">
                          <div className="crawl-failure-top">
                            <TriangleAlert size={16} className="text-amber" />
                            <strong>Kendala Perayapan Riwayat (Crawl Error):</strong>
                            <span className="badge badge-red">GAGAL PERAYAPAN</span>
                          </div>
                          <p className="crawl-failure-text">
                            {typeof historyDetail.crawl?.error === "string"
                              ? historyDetail.crawl.error
                              : historyDetail.crawl?.error?.message || "Perayapan situs terhambat atau host tidak merespons."}
                          </p>
                        </div>
                      )}

                      <div className="detector-grid" style={{ padding: "20px" }}>
                        <DetectionCard
                          title="Deteksi teks"
                          icon={FileSearch}
                          response={historyDetail.textDetection}
                          serviceStatus={historyDetail.textDetectionStatus}
                        />
                        <DetectionCard
                          title="Perubahan halaman"
                          icon={ShieldAlert}
                          response={historyDetail.defacementDetection}
                          serviceStatus={historyDetail.defacementDetectionStatus}
                        />
                        <DetectionCard
                          title="Deteksi tautan"
                          icon={Globe2}
                          response={historyDetail.linkDetection}
                          serviceStatus={historyDetail.linkDetectionStatus}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
    </AppShell>
  );
}

export default function App() {
  const [authStatus, setAuthStatus] = useState("checking");
  const [username, setUsername] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [currentHash, setCurrentHash] = useState(() => window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const cleanRoute = currentHash.replace(/^#\/?/, "").trim();
  const isLandingRoute =
    cleanRoute === "" ||
    cleanRoute === "landing" ||
    cleanRoute === "beranda" ||
    cleanRoute === "fitur" ||
    cleanRoute === "alur-kerja" ||
    cleanRoute === "tentang";
  const isLoginRoute = cleanRoute === "login";

  useEffect(() => {
    let active = true;
    fetchAuthSession()
      .then((session) => {
        if (!active) return;
        if (session.authenticated) {
          setUsername(session.username);
          setAuthStatus("authenticated");
        } else {
          setAuthStatus("unauthenticated");
        }
      })
      .catch((error) => {
        if (!active) return;
        setAuthError(error.message);
        setAuthStatus("unauthenticated");
      });
    return () => {
      active = false;
    };
  }, []);

  // Jika pengguna sudah login dan membuka route awal (landing) atau login, arahkan ke dashboard
  useEffect(() => {
    if (authStatus === "authenticated" && (isLandingRoute || isLoginRoute)) {
      window.location.hash = "ringkasan";
    }
  }, [authStatus, isLandingRoute, isLoginRoute]);

  async function handleLogin(adminUsername, password) {
    setAuthBusy(true);
    setAuthError("");
    try {
      const session = await loginAdmin(adminUsername, password);
      setUsername(session.username);
      setAuthStatus("authenticated");
      if (isLandingRoute || isLoginRoute || !cleanRoute) {
        window.location.hash = "ringkasan";
      }
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    setAuthError("");
    try {
      await logoutAdmin();
      setUsername("");
      setAuthStatus("unauthenticated");
      window.location.hash = "login";
    } catch (error) {
      setAuthError(error.message);
    }
  }

  if (import.meta.env.DEV && ComponentGallery && (cleanRoute === "_komponen" || currentHash === "#/_komponen")) {
    return (
      <Suspense fallback={<div style={{ padding: "32px", textAlign: "center" }}>Memuat Galeri Komponen...</div>}>
        <ComponentGallery />
      </Suspense>
    );
  }

  if (authStatus === "checking") {
    return (
      <main className="login-shell" aria-live="polite">
        <div className="login-bg" />
        <div className="login-loading">
          <LoaderCircle className="spin" size={20} />
          Memeriksa sesi Admin...
        </div>
      </main>
    );
  }

  if (authStatus !== "authenticated") {
    if (isLandingRoute) {
      return (
        <LandingPage
          onEnterDashboard={() => {
            window.location.hash = "login";
          }}
        />
      );
    }

    return (
      <LoginPage
        onLogin={handleLogin}
        error={authError}
        busy={authBusy}
        onBackToLanding={() => {
          window.location.hash = "landing";
        }}
      />
    );
  }

  return <Dashboard username={username} onLogout={handleLogout} logoutError={authError} />;
}
