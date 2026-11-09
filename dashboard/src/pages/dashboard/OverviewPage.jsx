import React, { useMemo } from "react";
import {
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import Visualizations from "../../Visualizations.jsx";
import { formatTime } from "../../formatters.js";
import {
  PageHeader,
  Button,
  Alert,
  Card,
  CardHeader,
  CardBody,
  StatCard,
  Table,
  TableRow,
  TableCell,
  TableEmpty,
  TableSkeleton,
  Badge,
  StatusBadge,
} from "../../components/index.js";

function formatLocalTime(value) {
  if (!value) return "—";
  const formatted = formatTime(value);
  if (!formatted || formatted === "Data tidak tersedia") return "—";
  return formatted;
}

function getSiteInfo(url, sites = []) {
  if (!url) return { name: "—", host: "—" };
  let host = "—";
  try {
    host = new URL(url).hostname;
  } catch {
    host = url;
  }

  // Find site name in site register if available
  const matched = sites.find(
    (s) => s.url === url || (s.url && url.startsWith(s.url))
  );
  const name = matched?.name || host || "—";
  return { name, host };
}

export function OverviewPage({
  totalSites = 0,
  totalScans = 0,
  sitesWithIndications = 0,
  activityData = [],
  distributionData = [],
  history = [],
  historyLoading = false,
  historyError = "",
  onRefreshHistory,
  onNavigate,
  onViewHistory,
  historyToPage,
  summarizeIndications,
  sites = [],
}) {
  const handleRowClick = async (scanId) => {
    if (onViewHistory) {
      await onViewHistory(scanId);
    }
    if (onNavigate) {
      onNavigate("riwayat");
    }
  };

  // Count failed scans for condition banner
  const failedScansCount = useMemo(() => {
    return (history || []).filter(
      (s) => s.crawlStatus === "failed" || s.status === "failed"
    ).length;
  }, [history]);

  // Condition banner: danger if indications exist, warning if failed scans exist, else null
  const conditionBanner = useMemo(() => {
    if (sitesWithIndications > 0) {
      return (
        <Alert
          tone="danger"
          title={`${sitesWithIndications} situs terindikasi pada pemindaian terbaru`}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate && onNavigate("hasil")}
            >
              Lihat hasil &rarr;
            </Button>
          }
          className="ov-condition-banner"
        >
          Ditemukan potensi konten negatif yang membutuhkan verifikasi dan tindakan lebih lanjut.
        </Alert>
      );
    }
    if (failedScansCount > 0) {
      return (
        <Alert
          tone="warning"
          title={`${failedScansCount} pemindaian gagal dijalankan`}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate && onNavigate("riwayat")}
            >
              Lihat riwayat &rarr;
            </Button>
          }
          className="ov-condition-banner"
        >
          Beberapa pemeriksaan tidak dapat menyelesaikan perayapan situs target.
        </Alert>
      );
    }
    return null;
  }, [sitesWithIndications, failedScansCount, onNavigate]);

  const cleanSitesCount = Math.max(0, totalSites - sitesWithIndications);

  return (
    <div className="ov-page">
      {/* ── 1. Page Header ── */}
      <PageHeader
        title="Ringkasan"
        description="Kondisi pemantauan situs web OPD berdasarkan pemindaian terbaru."
        action={
          <div className="ov-header-actions">
            <Button
              variant="secondary"
              icon={RefreshCw}
              loading={historyLoading}
              onClick={onRefreshHistory}
            >
              Perbarui data
            </Button>
            <Button
              variant="primary"
              onClick={() => onNavigate && onNavigate("pemeriksaan")}
            >
              Mulai pemindaian
            </Button>
          </div>
        }
      />

      {/* ── 2. Condition Banner (only when relevant) ── */}
      {conditionBanner}

      {/* ── 3. Metrics Grid ── */}
      <section className="ov-metrics-grid" aria-label="Metrik Ringkasan">
        <StatCard
          label="Situs terdaftar"
          value={historyLoading ? "—" : totalSites}
          description="Situs OPD aktif dipantau"
          tone="default"
          className="ov-stat-card"
        />
        <StatCard
          label="Pemindaian terbaru"
          value={historyLoading ? "—" : totalScans}
          description="Dari riwayat pemeriksaan terakhir"
          tone="default"
          className="ov-stat-card"
        />
        <StatCard
          label="Situs terindikasi"
          value={historyLoading ? "—" : sitesWithIndications}
          description={
            sitesWithIndications > 0
              ? "Perlu tindakan verifikasi"
              : "Tidak ada indikasi terdeteksi"
          }
          tone={sitesWithIndications > 0 ? "danger" : "default"}
          className="ov-stat-card"
        />
        <StatCard
          label="Situs bebas indikasi"
          value={historyLoading ? "—" : cleanSitesCount}
          description="Kondisi aman dan bersih"
          tone="default"
          className="ov-stat-card"
        />
      </section>

      {/* ── 4. Charts Grid ── */}
      <section className="ov-charts-grid" aria-label="Grafik Analitik">
        <Card className="ov-chart-card">
          <CardHeader
            title="Aktivitas pemindaian, 7 hari terakhir"
            id="ov-chart-activity-title"
          />
          <CardBody>
            <Visualizations
              type="activity"
              data={activityData}
              cardTitleId="ov-chart-activity-title"
            />
          </CardBody>
        </Card>

        <Card className="ov-chart-card">
          <CardHeader
            title="Sebaran kategori temuan"
            id="ov-chart-distribution-title"
          />
          <CardBody>
            <Visualizations
              type="distribution"
              data={distributionData}
              cardTitleId="ov-chart-distribution-title"
            />
          </CardBody>
        </Card>
      </section>

      {/* ── 5. Recent Scans Table ── */}
      <section className="ov-recent-scans-section" aria-label="Pemindaian Terbaru">
        <Card className="ov-scans-card">
          <CardHeader
            title="Pemindaian terbaru"
            description="5 pemindaian terakhir"
            action={
              history.length > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate && onNavigate("riwayat")}
                >
                  Lihat semua riwayat &rarr;
                </Button>
              ) : null
            }
          />
          <CardBody>
            {historyError ? (
              <Alert
                tone="danger"
                title="Gagal memuat data riwayat pemindaian"
                action={
                  onRefreshHistory ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onRefreshHistory}
                    >
                      Coba lagi
                    </Button>
                  ) : null
                }
              >
                {historyError}
              </Alert>
            ) : historyLoading ? (
              <Table caption="Pemindaian terbaru">
                <thead>
                  <tr>
                    <th scope="col">Situs</th>
                    <th scope="col" className="ov-col-time">Waktu</th>
                    <th scope="col" className="ov-col-source">Sumber</th>
                    <th scope="col">Hasil</th>
                    <th scope="col">Aksi</th>
                  </tr>
                </thead>
                <TableSkeleton rows={5} cols={5} />
              </Table>
            ) : history.length === 0 ? (
              <Table caption="Pemindaian terbaru">
                <thead>
                  <tr>
                    <th scope="col">Situs</th>
                    <th scope="col" className="ov-col-time">Waktu</th>
                    <th scope="col" className="ov-col-source">Sumber</th>
                    <th scope="col">Hasil</th>
                    <th scope="col">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <TableEmpty
                    colSpan={5}
                    title="Belum ada pemindaian"
                    description="Belum ada catatan pemindaian yang tersimpan di sistem."
                    action={
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onNavigate && onNavigate("pemeriksaan")}
                      >
                        Mulai pemindaian
                      </Button>
                    }
                  />
                </tbody>
              </Table>
            ) : (
              <Table caption="Pemindaian terbaru">
                <thead>
                  <tr>
                    <th scope="col">Situs</th>
                    <th scope="col" className="ov-col-time">Waktu</th>
                    <th scope="col" className="ov-col-source">Sumber</th>
                    <th scope="col">Hasil</th>
                    <th scope="col">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 5).map((scan) => {
                    const { name, host } = getSiteInfo(scan.url, sites);
                    const isFailed =
                      scan.crawlStatus === "failed" || scan.status === "failed";
                    const page = historyToPage ? historyToPage(scan) : scan;
                    const summary = summarizeIndications
                      ? summarizeIndications(page)
                      : { total: 0 };
                    const hasIndication = summary.total > 0;
                    const statusKey = isFailed
                      ? "failed"
                      : hasIndication
                        ? "indicated"
                        : "clean";
                    const formattedTime = formatLocalTime(scan.scannedAt);
                    const sourceLabel =
                      scan.scanSource === "SCHEDULED" ? "Terjadwal" : "Manual";

                    return (
                      <TableRow
                        key={scan.id}
                        onRowClick={() => handleRowClick(scan.id)}
                      >
                        <TableCell>
                          <div className="ov-site-info">
                            <span className="ov-site-name">{name || "—"}</span>
                            <span className="ov-site-host">{host || "—"}</span>
                            <span className="ov-site-meta-mobile">
                              {formattedTime} • {sourceLabel}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="ov-col-time">
                          <span className="ov-time-text">{formattedTime}</span>
                        </TableCell>
                        <TableCell className="ov-col-source">
                          <Badge tone="neutral">{sourceLabel}</Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={statusKey} />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ov-btn-detail"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(scan.id);
                            }}
                          >
                            Detail <ArrowRight size={13} aria-hidden="true" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

export default OverviewPage;
