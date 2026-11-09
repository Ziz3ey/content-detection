import { useEffect, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileSearch,
  Globe2,
  History,
  LoaderCircle,
  LogOut,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  Trash2,
  UserRound,
} from "lucide-react";
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
  fetchSchedules,
  fetchSites,
  loginAdmin,
  logoutAdmin,
  requestApi,
  runScheduleNow,
  submitScan,
  submitSiteScan,
  updateSchedule,
  updateSite,
  validateTargetUrl,
} from "./api.js";
import SiteManagement from "./SiteManagement.jsx";
import ScheduleManagement from "./ScheduleManagement.jsx";

const NOTIFICATION_STORAGE_KEY = "content-detection:notifications:v1";
const DASHBOARD_TABS = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "situs", label: "Manajemen situs" },
  { id: "jadwal", label: "Jadwal pemeriksaan" },
  { id: "pemeriksaan", label: "Pemeriksaan" },
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
      })),
    );
  }

  if (title === "Deteksi tautan") {
    if (Array.isArray(data?.links)) {
      return data.links.flatMap((link) =>
        (link.indicators || []).map((indicator) => ({
          label: indicator.type,
          detail: `${link.url} — ${indicator.description}`,
        })),
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
  const tone =
    status === "success" || status === "completed"
      ? "good"
      : status === "error" || status === "failed"
        ? "bad"
        : status === "skipped"
          ? "muted"
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
  const isSkipped =
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
        <p className="detector-message">Data tidak tersedia</p>
      ) : detected === null ? (
        <p className="detector-message">Data tidak tersedia</p>
      ) : (
        <div className="detector-outcome">
          <span
            className={`outcome-mark ${detected ? "outcome-found" : "outcome-clear"}`}
          >
            {detected ? <ArrowUpRight size={15} /> : <Check size={15} />}
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
        <ul className="finding-list">
          {findings.map((finding, index) => (
            <li key={`${finding.label}-${index}`}>
              <span>{finding.label}</span>
              <code>{finding.detail || "Data tidak tersedia"}</code>
            </li>
          ))}
        </ul>
      )}
      {isSkipped && title === "Perubahan halaman" && (
        <p className="detector-note">
          Baseline belum tersedia untuk halaman ini.
        </p>
      )}
    </section>
  );
}

function ScanPage({ page }) {
  const crawl = page.crawl || {};
  const crawlSucceeded = crawl.success === true || crawl.status === "success";
  return (
    <article className="page-result">
      <div className="page-result-heading">
        <div className="page-title-line">
          <span className="page-number">
            {String(page.depth ?? 0).padStart(2, "0")}
          </span>
          <div className="page-url-block">
            <a
              href={page.url}
              target="_blank"
              rel="noreferrer"
              className="page-url"
            >
              {page.url}
              <ExternalLink size={13} />
            </a>
            <span className="page-title">
              {crawl.title || "Judul tidak tersedia"}
            </span>
          </div>
        </div>
        <StatusBadge status={crawlSucceeded ? "success" : "failed"}>
          {crawlSucceeded ? `HTTP ${crawl.status ?? "OK"}` : "CRAWL ERROR"}
        </StatusBadge>
      </div>
      <div className="page-meta">
        <span>{crawl.contentType || "Content-Type tidak tersedia"}</span>
        <span>Depth {page.depth ?? "-"}</span>
        <span>{formatTime(page.scannedAt)}</span>
      </div>
      {crawl.error && (
        <p className="page-error">{crawl.error.message || "Crawl gagal."}</p>
      )}
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

function LoginPage({ onLogin, error, busy }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setValidationError("");
    if (!username.trim() || !password) {
      setValidationError("Nama pengguna dan kata sandi wajib diisi.");
      return;
    }
    onLogin(username.trim(), password);
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <a className="brand login-brand" href="#login" aria-label="Beranda">
          <span className="brand-symbol">
            <Activity size={19} strokeWidth={2.2} />
          </span>
          <span className="brand-name">Pemantauan Situs</span>
        </a>
        <p className="eyebrow">
          <span /> AKSES ADMINISTRATOR
        </p>
        <h1 id="login-title">Masuk ke dashboard</h1>
        <p className="login-copy">
          Gunakan akun Admin untuk mengakses pemantauan situs Pemerintah
          Kabupaten Sumbawa.
        </p>
        <form onSubmit={handleSubmit} noValidate>
          <label className="field-label" htmlFor="admin-username">
            Nama pengguna
          </label>
          <input
            className="login-input"
            id="admin-username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
          <label className="field-label" htmlFor="admin-password">
            Kata sandi
          </label>
          <input
            className="login-input"
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {(validationError || error) && (
            <p className="login-error" role="alert">
              {validationError || error}
            </p>
          )}
          <button className="login-button" type="submit" disabled={busy}>
            {busy ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <UserRound size={17} />
            )}
            {busy ? "Memverifikasi..." : "Masuk"}
          </button>
        </form>
        <p className="login-footnote">
          Akses dilindungi sesi Admin. Hasil pemeriksaan merupakan indikasi
          berdasarkan pola yang tersedia.
        </p>
      </section>
    </main>
  );
}

function NotificationMenu({
  notifications,
  unreadCount,
  open,
  onToggle,
  onMarkRead,
  onMarkAllRead,
  onView,
}) {
  return (
    <div className="notification-menu">
      <button
        className="notification-trigger"
        type="button"
        aria-label={`Notifikasi indikasi, ${unreadCount} belum dibaca`}
        aria-expanded={open}
        onClick={onToggle}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <section className="notification-panel" aria-label="Notifikasi indikasi">
          <div className="notification-panel-heading">
            <div>
              <h2>Notifikasi indikasi</h2>
              <p>{unreadCount} belum dibaca</p>
            </div>
            {unreadCount > 0 && (
              <button type="button" onClick={onMarkAllRead}>
                <CheckCheck size={13} /> Tandai semua dibaca
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="notification-empty">
              Belum ada indikasi yang perlu ditinjau.
            </p>
          ) : (
            <ul className="notification-list">
              {notifications.map((notification) => (
                <li
                  className={notification.read ? "notification-read" : ""}
                  key={notification.id}
                >
                  <div className="notification-message">
                    <span className="notification-indicator">
                      <TriangleAlert size={16} />
                    </span>
                    <div>
                      <strong>
                        Ditemukan indikasi yang perlu ditinjau
                      </strong>
                      <span className="notification-url">{notification.url}</span>
                      <span className="notification-time">
                        {formatTime(notification.scannedAt)}
                      </span>
                      <span className="notification-categories">
                        {notification.categories
                          .map(
                            (category) =>
                              `${category.label}: ${category.count} temuan`,
                          )
                          .join(" · ")}
                      </span>
                      <span className="notification-total">
                        {notification.total} temuan
                      </span>
                    </div>
                  </div>
                  <div className="notification-actions">
                    <button
                      type="button"
                      className="notification-view"
                      onClick={() => onView(notification)}
                    >
                      Lihat detail <ArrowDownRight size={14} />
                    </button>
                    {!notification.read && (
                      <button
                        type="button"
                        onClick={() => onMarkRead(notification.id)}
                      >
                        Tandai dibaca
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function Dashboard({ username, onLogout, logoutError }) {
  const [activeTab, setActiveTab] = useState(tabFromHash);
  const [url, setUrl] = useState("");
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
        ),
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

  function navigateToTab(tabId) {
    setActiveTab(tabId);
    if (window.location.hash !== `#${tabId}`) {
      window.location.hash = tabId;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setUrlError("");
    setScanError("");
    setHistoryDetail(null);
    setSiteSelectionError("");

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
        });
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
              .slice(0, 30),
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
      });
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
            .slice(0, 30),
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
      setHistoryDetail(historyToPage(data.scan));
      setHistoryDetailError("");
    } catch (error) {
      setHistoryDetailError(error.message);
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
        item.id === notificationId ? { ...item, read: true } : item,
      ),
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
  const targetHost = hostLabel(url);
  const pagesWithIndications = history.filter(
    (scan) => summarizeIndications(historyToPage(scan)).total > 0,
  ).length;

  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#top"
          aria-label="Dashboard Pemantauan Situs"
        >
          <span className="brand-symbol">
            <Activity size={19} strokeWidth={2.2} />
          </span>
          <span className="brand-name">
            Pemantauan<span> / </span>Situs
          </span>
        </a>
        <div className="topbar-right">
          <span className={`api-indicator api-${apiHealth}`}>
            <span className="api-dot" /> Aggregator{" "}
            {apiHealth === "online"
              ? "terhubung"
              : apiHealth === "offline"
                ? "offline"
                : "memeriksa"}
          </span>
          <NotificationMenu
            notifications={notifications}
            unreadCount={unreadCount}
            open={notificationOpen}
            onToggle={() => setNotificationOpen((open) => !open)}
            onMarkRead={markNotificationRead}
            onMarkAllRead={() =>
              setNotifications((current) =>
                current.map((item) => ({ ...item, read: true })),
              )
            }
            onView={viewNotification}
          />
          <span className="topbar-divider" />
          <span className="admin-identity">
            <UserRound size={15} /> {username}
          </span>
          <button className="logout-button" type="button" onClick={onLogout}>
            <LogOut size={15} /> Keluar
          </button>
        </div>
      </header>

      <main id="top" className="main-content">
        {logoutError && (
          <div className="history-notice" role="alert">
            <TriangleAlert size={16} /> {logoutError}
          </div>
        )}
        <nav className="dashboard-nav" aria-label="Navigasi dashboard">
          {DASHBOARD_TABS.map((tab) => (
            <a
              key={tab.id}
              href={`#${tab.id}`}
              className={activeTab === tab.id ? "active" : ""}
              aria-current={activeTab === tab.id ? "page" : undefined}
              onClick={() => navigateToTab(tab.id)}
            >
              {tab.label}
            </a>
          ))}
        </nav>

        {activeTab === "ringkasan" && (
          <section className="page-intro">
            <div>
              <p className="eyebrow">
                <span /> PEMANTAUAN SITUS
              </p>
              <h1>Analisis halaman web</h1>
              <p className="intro-copy">
                Pemeriksaan menghasilkan indikasi berdasarkan detector yang
                tersedia.
              </p>
            </div>
            <div className="api-base">
              <span>ALAMAT API</span>
              <code>{API_BASE_URL}</code>
            </div>
          </section>
        )}

        {activeTab === "ringkasan" && (
          <section
            className="summary-grid"
            id="ringkasan"
            aria-label="Ringkasan dashboard"
          >
            <article className="summary-card">
              <span>Catatan riwayat terbaru</span>
              <strong>
                {historyLoading || historyError ? "—" : history.length}
              </strong>
              <small>Maksimal 10 halaman tersimpan</small>
            </article>
            <article className="summary-card summary-warning">
              <span>Halaman dengan indikasi</span>
              <strong>
                {historyLoading || historyError ? "—" : pagesWithIndications}
              </strong>
              <small>Dari 10 halaman terbaru; perlu ditinjau</small>
            </article>
            <article className="summary-card">
              <span>Situs terdaftar aktif</span>
              <strong>
                {sitesLoading ? "—" : activeSites.length}
              </strong>
              <small>Dari {sites.length} total situs di database</small>
            </article>
            <article className="summary-card">
              <span>Status aggregator</span>
              <strong className={`summary-health health-${apiHealth}`}>
                {apiHealth === "online"
                  ? "Terhubung"
                  : apiHealth === "offline"
                    ? "Offline"
                    : "Memeriksa"}
              </strong>
              <small>Gateway layanan analisis</small>
            </article>
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

        {activeTab === "pemeriksaan" && (
          <section
            className="workbench"
            id="pemeriksaan"
            aria-label="Form pemeriksaan"
          >
            <form className="scan-form" onSubmit={handleSubmit} noValidate>
              <div className="section-heading">
                <div className="section-icon">
                  <Globe2 size={18} />
                </div>
                <div>
                  <h2>Target pemeriksaan</h2>
                  <p>
                    Pilih situs aktif terdaftar atau masukkan URL manual di bawah.
                  </p>
                </div>
              </div>

              {sites.length > 0 && (
                <div className="site-selection-panel" aria-label="Panel pemilihan situs">
                  <div className="site-selection-header">
                    <div>
                      <h3 className="site-selection-title">Daftar situs aktif</h3>
                      <p className="site-selection-desc">
                        Centang situs yang ingin diperiksa secara bersamaan.
                      </p>
                    </div>
                    <span className="site-selected-count-badge">
                      {selectedSiteIds.length} situs dipilih
                    </span>
                  </div>

                  <div className="site-selection-toolbar">
                    <button
                      type="button"
                      className="btn-link site-select-all-btn"
                      onClick={() => {
                        const activeIds = activeSites.map((s) => s.id);
                        if (allActiveSelected) {
                          setSelectedSiteIds((current) =>
                            current.filter((id) => !activeIds.includes(id)),
                          );
                        } else {
                          setSelectedSiteIds((current) =>
                            Array.from(new Set([...current, ...activeIds])),
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
                        className="btn-link text-muted"
                        onClick={() => setSelectedSiteIds([])}
                      >
                        Kosongkan pilihan
                      </button>
                    )}
                  </div>

                  {activeSites.length === 0 ? (
                    <p className="site-empty-hint">
                      Tidak ada situs aktif. Silakan tambahkan atau aktifkan situs di
                      menu <a href="#situs" onClick={() => navigateToTab("situs")}>Manajemen Situs</a>.
                    </p>
                  ) : (
                    <div className="site-checklist" role="group" aria-label="Pilihan situs aktif">
                      {activeSites.map((site) => (
                        <label
                          className={`site-checklist-item ${
                            selectedSiteIds.includes(site.id) ? "selected" : ""
                          }`}
                          key={site.id}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSiteIds.includes(site.id)}
                            onChange={() =>
                              setSelectedSiteIds((current) =>
                                current.includes(site.id)
                                  ? current.filter((id) => id !== site.id)
                                  : [...current, site.id],
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
                  className={`url-input-wrap ${urlError ? "field-invalid" : ""}`}
                >
                  <span className="url-prefix">
                    <Globe2 size={16} />
                  </span>
                  <input
                    id="target-url"
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
                  <span className="url-scheme">HTTP / HTTPS</span>
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
                <label>
                  <span>Kedalaman</span>
                  <select
                    value={maxDepth}
                    onChange={(event) => setMaxDepth(event.target.value)}
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </select>
                </label>
                <label>
                  <span>Maks. halaman</span>
                  <select
                    value={maxPages}
                    onChange={(event) => setMaxPages(event.target.value)}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                  </select>
                </label>
                <div className="scope-readout">
                  <span>METODE</span>
                  <strong>
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
                <p>
                  <ShieldCheck size={15} /> Analisis berjalan melalui service
                  backend.
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

            <aside
              className={`scan-state state-${scanStatus}`}
              aria-live="polite"
            >
              <div className="state-orbit">
                <span>
                  {scanStatus === "scanning" ? (
                    <LoaderCircle className="spin" size={25} />
                  ) : scanStatus === "completed" ? (
                    <Check size={25} />
                  ) : scanStatus === "failed" ? (
                    <TriangleAlert size={25} />
                  ) : (
                    <Activity size={25} />
                  )}
                </span>
              </div>
              <p className="eyebrow">STATUS PEMERIKSAAN</p>
              <h2>
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
                    className="btn btn-secondary batch-view-detail-btn"
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

        {activeTab === "hasil" && (
          <section
            className="results-section"
            id="hasil"
            aria-label="Hasil pemeriksaan"
          >
            {batchResults && batchResults.length > 0 ? (
              <div className="batch-results-wrapper">
                <div className="batch-overview-banner">
                  <div>
                    <p className="eyebrow">
                      <span /> HASIL PEMERIKSAAN BATCH
                    </p>
                    <h2>Hasil pemeriksaan situs terdaftar</h2>
                    <p className="batch-summary-copy">
                      {
                        batchResults.filter((r) => getSiteOutcome(r) === "success")
                          .length
                      }{" "}
                      dari {batchResults.length} situs berhasil diperiksa secara penuh.
                    </p>
                  </div>
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
                            <ScanPage key={page.id || page.url} page={page} />
                          ))}
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="results-header">
                  <div>
                    <p className="eyebrow">
                      <span /> HASIL PEMERIKSAAN
                    </p>
                    <h2>Hasil pemeriksaan terbaru</h2>
                  </div>
                  <span className="result-count">
                    {displayedResultPages.length} halaman <span>·</span> tersimpan
                  </span>
                </div>
                {displayedResultPages.length === 0 ? (
                  <div className="empty-result">
                    <FileSearch size={20} />
                    <span>Belum ada hasil pemeriksaan terbaru.</span>
                  </div>
                ) : (
                  displayedResultPages.map((page) => (
                    <ScanPage key={page.id || page.url} page={page} />
                  ))
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
            <div className="history-heading">
              <div className="section-heading compact-heading">
                <div className="section-icon">
                  <History size={18} />
                </div>
                <div>
                  <h2>Riwayat scan</h2>
                  <p>10 pemeriksaan terbaru dari database.</p>
                </div>
              </div>
              <div className="history-heading-right">
                <div className="history-filter-pills" role="radiogroup" aria-label="Filter sumber riwayat">
                  <button
                    type="button"
                    className={`history-filter-pill ${historySourceFilter === "all" ? "active" : ""}`}
                    onClick={() => {
                      setHistorySourceFilter("all");
                      loadHistory("all");
                    }}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    className={`history-filter-pill ${historySourceFilter === "MANUAL" ? "active" : ""}`}
                    onClick={() => {
                      setHistorySourceFilter("MANUAL");
                      loadHistory("MANUAL");
                    }}
                  >
                    Manual
                  </button>
                  <button
                    type="button"
                    className={`history-filter-pill ${historySourceFilter === "SCHEDULED" ? "active" : ""}`}
                    onClick={() => {
                      setHistorySourceFilter("SCHEDULED");
                      loadHistory("SCHEDULED");
                    }}
                  >
                    Terjadwal
                  </button>
                </div>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => loadHistory()}
                  disabled={historyLoading}
                  aria-label="Muat ulang riwayat"
                >
                  <RotateCw size={16} className={historyLoading ? "spin" : ""} />
                </button>
              </div>
            </div>

            {historyError ? (
              <div className="history-notice" role="status">
                <TriangleAlert size={16} /> {historyError}
              </div>
            ) : historyLoading ? (
              <div className="history-notice">
                <LoaderCircle className="spin" size={16} /> Memuat riwayat...
              </div>
            ) : history.length === 0 ? (
              <div className="history-empty">
                <History size={19} />
                <span>Belum ada riwayat scan.</span>
              </div>
            ) : (
              <div className="history-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Website / URL</th>
                      <th>Sumber</th>
                      <th>Waktu</th>
                      <th>Perayapan</th>
                      <th>Deteksi teks</th>
                      <th>Perubahan halaman</th>
                      <th>Deteksi tautan</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((scan) => {
                      const matchedSite = sites.find((s) => s.url === scan.url);
                      const displayName = matchedSite?.name || scan.title || scan.url;
                      const isScheduled = scan.scanSource === "SCHEDULED";
                      return (
                      <tr key={scan.id}>
                        <td className="history-url">
                          <span>{displayName}</span>
                          <code>{scan.url}</code>
                        </td>
                        <td>
                          <span className={`source-badge source-${isScheduled ? "scheduled" : "manual"}`}>
                            {isScheduled ? "TERJADWAL" : "MANUAL"}
                          </span>
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
                              ? "BERHASIL"
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
                              ? "BERHASIL"
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
                              ? "BERHASIL"
                              : scan.linkDetectionStatus === "skipped"
                                ? "DILEWATI"
                                : scan.linkDetectionStatus
                                  ? "GAGAL"
                                  : "—"}
                          </StatusBadge>
                        </td>
                        <td>
                          <div className="history-actions">
                            <button
                              className="view-button"
                              type="button"
                              onClick={() => handleViewHistory(scan.id)}
                            >
                              Lihat <ArrowDownRight size={14} />
                            </button>
                            <button
                              className="delete-button"
                              type="button"
                              disabled={deletingHistoryId === scan.id}
                              onClick={() => handleDeleteHistory(scan.id)}
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
            {historyDetail && (
              <div className="history-detail">
                <div className="history-detail-heading">
                  <div>
                    <span className="eyebrow">DETAIL RIWAYAT</span>
                    <h3>{historyDetail.url}</h3>
                    <div className="history-detail-meta">
                      <span>
                        Waktu: {formatTime(historyDetail.scannedAt)}
                      </span>
                      <span>
                        Sumber:{" "}
                        <strong className={`source-badge source-${historyDetail.scanSource === "SCHEDULED" ? "scheduled" : "manual"}`}>
                          {historyDetail.scanSource === "SCHEDULED" ? "TERJADWAL" : "MANUAL"}
                        </strong>
                      </span>
                      <span>
                        Perayapan:{" "}
                        {historyDetail.crawl.success ? "BERHASIL" : "GAGAL"}
                        {historyDetail.crawl.status
                          ? ` · HTTP ${historyDetail.crawl.status}`
                          : ""}
                      </span>
                    </div>
                  </div>
                  <button
                    className="close-detail"
                    onClick={() => setHistoryDetail(null)}
                    type="button"
                  >
                    Tutup
                  </button>
                </div>
                <div className="detector-grid">
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
          </section>
        )}
      </main>

      <footer className="app-footer">
        <span>CONTENT DETECTION</span>
        <span>Hasil merupakan indikasi berdasarkan rule yang tersedia.</span>
        <span>
          API <code>{API_BASE_URL}</code>
        </span>
      </footer>
    </div>
  );
}

export default function App() {
  const [authStatus, setAuthStatus] = useState("checking");
  const [username, setUsername] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

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

  async function handleLogin(adminUsername, password) {
    setAuthBusy(true);
    setAuthError("");
    try {
      const session = await loginAdmin(adminUsername, password);
      setUsername(session.username);
      setAuthStatus("authenticated");
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
    } catch (error) {
      setAuthError(error.message);
    }
  }

  if (authStatus === "checking") {
    return (
      <main className="login-shell" aria-live="polite">
        <div className="login-loading">
          <LoaderCircle className="spin" size={20} />
          Memeriksa sesi Admin...
        </div>
      </main>
    );
  }

  if (authStatus !== "authenticated") {
    return (
      <LoginPage
        onLogin={handleLogin}
        error={authError}
        busy={authBusy}
      />
    );
  }

  return (
    <Dashboard
      username={username}
      onLogout={handleLogout}
      logoutError={authError}
    />
  );
}
