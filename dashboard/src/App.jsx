import { useEffect, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileSearch,
  Globe2,
  History,
  LoaderCircle,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import {
  API_BASE_URL,
  fetchRecentScans,
  fetchScanById,
  requestApi,
  submitScan,
  validateTargetUrl,
} from "./api.js";

const CATEGORY_LABELS = {
  gambling: "Judi online",
  fraud: "Penipuan",
  pornography: "Pornografi",
};

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

function DetectionCard({ title, icon: Icon, response, serviceStatus }) {
  const isSkipped =
    serviceStatus === "skipped" ||
    response?.error?.code === "BASELINE_NOT_PROVIDED";
  const isError = !isSkipped && response?.success === false;
  const data = response?.success === true ? response.data : null;
  const detected = typeof data?.detected === "boolean" ? data.detected : null;
  const findings =
    title === "Text Detection"
      ? (data?.categories || []).flatMap((category) =>
          (category.matches || []).map((match) => ({
            label: CATEGORY_LABELS[category.category] || category.category,
            detail: match.pattern,
          })),
        )
      : (data?.indicators || []).map((indicator) => ({
          label: indicator.type,
          detail: indicator.description,
        }));

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
              : serviceStatus || (isError ? "error" : "success")
          }
        >
          {isSkipped ? "SKIPPED" : isError ? "ERROR" : "SUCCESS"}
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
          <span>{detected ? "Pattern cocok" : "Tidak ada pattern cocok"}</span>
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
      {isSkipped && title === "Defacement" && (
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
          title="Text Detection"
          icon={FileSearch}
          response={page.textDetection}
        />
        <DetectionCard
          title="Defacement"
          icon={ShieldAlert}
          response={page.defacementDetection}
        />
        <DetectionCard
          title="Link Detection"
          icon={Globe2}
          response={page.linkDetection}
        />
      </div>
    </article>
  );
}

function historyToPage(scan) {
  return {
    id: scan.id,
    url: scan.url,
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
    defacementDetection:
      scan.defacementDetectionStatus === "skipped"
        ? null
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
    defacementDetectionStatus: scan.defacementDetectionStatus,
    linkDetectionStatus: scan.linkDetectionStatus,
  };
}

export default function App() {
  const [url, setUrl] = useState("");
  const [maxDepth, setMaxDepth] = useState("1");
  const [maxPages, setMaxPages] = useState("20");
  const [baselineHtml, setBaselineHtml] = useState("");
  const [scanStatus, setScanStatus] = useState("ready");
  const [scanError, setScanError] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyDetail, setHistoryDetail] = useState(null);
  const [historyDetailError, setHistoryDetailError] = useState("");
  const [urlError, setUrlError] = useState("");
  const [apiHealth, setApiHealth] = useState("checking");

  async function loadHistory() {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const data = await fetchRecentScans(10);
      setHistory(data.scans || []);
    } catch (error) {
      setHistoryError(error.message);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
    requestApi("/health")
      .then(() => setApiHealth("online"))
      .catch(() => setApiHealth("offline"));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setUrlError("");
    setScanError("");
    setHistoryDetail(null);

    try {
      validateTargetUrl(url);
    } catch (error) {
      setUrlError(error.message);
      setScanStatus("failed");
      return;
    }

    setScanStatus("scanning");
    setScanResult(null);
    try {
      const data = await submitScan({
        url,
        maxDepth: Number(maxDepth),
        maxPages: Number(maxPages),
        baselineHtml,
      });
      setScanResult(data);
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
    } catch (error) {
      setHistoryDetailError(error.message);
    }
  }

  const resultPages = scanResult?.pages || [];
  const targetHost = hostLabel(url);

  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#top"
          aria-label="Content Detection dashboard"
        >
          <span className="brand-symbol">
            <Activity size={19} strokeWidth={2.2} />
          </span>
          <span className="brand-name">
            content<span> / </span>detection
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
          <span className="topbar-divider" />
          <span className="research-tag">PROTOTIPE PENELITIAN</span>
        </div>
      </header>

      <main id="top" className="main-content">
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
            <span>API BASE</span>
            <code>{API_BASE_URL}</code>
          </div>
        </section>

        <section className="workbench" aria-label="Form analisis">
          <form className="scan-form" onSubmit={handleSubmit} noValidate>
            <div className="section-heading">
              <div className="section-icon">
                <Globe2 size={18} />
              </div>
              <div>
                <h2>Target pemeriksaan</h2>
                <p>Scope crawling dibatasi ke host URL ini.</p>
              </div>
            </div>

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
                placeholder="https://example.local/"
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
                Host allowlist: <code>{targetHost}</code>
              </p>
            )}

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
                <span>SCOPE</span>
                <strong>{targetHost}</strong>
              </div>
            </div>

            <details className="baseline-field">
              <summary>
                Baseline Defacement <span>Opsional</span>
              </summary>
              <label className="visually-hidden" htmlFor="baseline-html">
                HTML baseline
              </label>
              <textarea
                id="baseline-html"
                rows="4"
                placeholder="Tempel HTML baseline untuk URL awal..."
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
                {scanStatus === "scanning" ? "Memindai" : "Mulai analisis"}
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
                ? "Masukkan target untuk memulai pemeriksaan."
                : scanStatus === "scanning"
                  ? "Crawler dan detector sedang memproses halaman."
                  : scanStatus === "completed"
                    ? `${resultPages.length} halaman diproses.`
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
            <div className="state-rule" />
            <div className="state-foot">
              <span>Indikator</span>
              <span>BUKAN KESIMPULAN ABSOLUT</span>
            </div>
          </aside>
        </section>

        {scanResult && (
          <section className="results-section" aria-label="Hasil pemeriksaan">
            <div className="results-header">
              <div>
                <p className="eyebrow">
                  <span /> HASIL PEMERIKSAAN
                </p>
                <h2>Ringkasan scan</h2>
              </div>
              <span className="result-count">
                {resultPages.length} halaman <span>·</span> tersimpan
              </span>
            </div>
            {resultPages.length === 0 ? (
              <div className="empty-result">
                <FileSearch size={20} />
                <span>Data tidak tersedia</span>
              </div>
            ) : (
              resultPages.map((page) => (
                <ScanPage key={page.id || page.url} page={page} />
              ))
            )}
          </section>
        )}

        <section className="history-section" aria-label="Riwayat scan">
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
            <button
              className="icon-button"
              type="button"
              onClick={loadHistory}
              disabled={historyLoading}
              aria-label="Muat ulang riwayat"
            >
              <RotateCw size={16} className={historyLoading ? "spin" : ""} />
            </button>
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
                    <th>URL</th>
                    <th>Waktu</th>
                    <th>Crawl</th>
                    <th>Text</th>
                    <th>Defacement</th>
                    <th>Link</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {history.map((scan) => (
                    <tr key={scan.id}>
                      <td className="history-url">
                        <span>{scan.title || scan.url}</span>
                        <code>{scan.url}</code>
                      </td>
                      <td className="history-time">
                        {formatTime(scan.scannedAt)}
                      </td>
                      <td>
                        <StatusBadge status={scan.crawlStatus}>
                          {scan.crawlStatus === "success" ? "SUCCESS" : "ERROR"}
                        </StatusBadge>
                      </td>
                      <td>
                        <StatusBadge status={scan.textDetectionStatus}>
                          {scan.textDetectionStatus?.toUpperCase() || "—"}
                        </StatusBadge>
                      </td>
                      <td>
                        <StatusBadge status={scan.defacementDetectionStatus}>
                          {scan.defacementDetectionStatus?.toUpperCase() || "—"}
                        </StatusBadge>
                      </td>
                      <td>
                        <StatusBadge status={scan.linkDetectionStatus}>
                          {scan.linkDetectionStatus?.toUpperCase() || "—"}
                        </StatusBadge>
                      </td>
                      <td>
                        <button
                          className="view-button"
                          type="button"
                          onClick={() => handleViewHistory(scan.id)}
                        >
                          View <ArrowDownRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  title="Text Detection"
                  icon={FileSearch}
                  response={historyDetail.textDetection}
                  serviceStatus={historyDetail.textDetectionStatus}
                />
                <DetectionCard
                  title="Defacement"
                  icon={ShieldAlert}
                  response={historyDetail.defacementDetection}
                  serviceStatus={historyDetail.defacementDetectionStatus}
                />
                <DetectionCard
                  title="Link Detection"
                  icon={Globe2}
                  response={historyDetail.linkDetection}
                  serviceStatus={historyDetail.linkDetectionStatus}
                />
              </div>
            </div>
          )}
        </section>
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
