/**
 * audit-ui/tools/mock-api.js
 * Realistic mock data and multi-scenario API request handler for UI verification & testing.
 * Conforms 1:1 with dashboard/src/api.js and dashboard/src/App.test.jsx fixtures.
 */

const mockSession = {
  authenticated: true,
  username: "admin_kominfo",
  role: "ADMIN",
  email: "petugas.sandi@sumbawakab.go.id",
  displayName: "Petugas Persandian",
  lastLogin: "2026-11-09T08:00:00.000Z",
};

// 14 Resmi Situs OPD Kabupaten Sumbawa
const normalSites = [
  { id: "site-01", name: "Portal Resmi Kabupaten Sumbawa", url: "https://sumbawakab.go.id", status: "ACTIVE", category: "PORTAL", monitored: true, lastScanAt: "2026-11-09T06:00:00.000Z", lastStatus: "clean" },
  { id: "site-02", name: "Dinas Komunikasi, Informatika, Statistik dan Persandian", url: "https://kominfosandi.sumbawakab.go.id", status: "ACTIVE", category: "OPD", monitored: true, lastScanAt: "2026-11-09T05:30:00.000Z", lastStatus: "clean" },
  { id: "site-03", name: "Badan Perencanaan Pembangunan Daerah", url: "https://bappeda.sumbawakab.go.id", status: "ACTIVE", category: "OPD", monitored: true, lastScanAt: "2026-11-09T05:00:00.000Z", lastStatus: "clean" },
  { id: "site-04", name: "Dinas Kependudukan dan Pencatatan Sipil", url: "https://disdukcapil.sumbawakab.go.id", status: "ACTIVE", category: "OPD", monitored: true, lastScanAt: "2026-11-09T04:30:00.000Z", lastStatus: "clean" },
  { id: "site-05", name: "Dinas Kesehatan Kabupaten Sumbawa", url: "https://dinkes.sumbawakab.go.id", status: "ACTIVE", category: "OPD", monitored: true, lastScanAt: "2026-11-09T04:00:00.000Z", lastStatus: "clean" },
  { id: "site-06", name: "Dinas Pendidikan dan Kebudayaan", url: "https://dikbud.sumbawakab.go.id", status: "ACTIVE", category: "OPD", monitored: true, lastScanAt: "2026-11-09T03:30:00.000Z", lastStatus: "clean" },
  { id: "site-07", name: "Badan Pendapatan Daerah", url: "https://bapenda.sumbawakab.go.id", status: "ACTIVE", category: "OPD", monitored: true, lastScanAt: "2026-11-09T03:00:00.000Z", lastStatus: "clean" },
  { id: "site-08", name: "Badan Kepegawaian dan Pengembangan SDM", url: "https://bkpsdm.sumbawakab.go.id", status: "ACTIVE", category: "OPD", monitored: true, lastScanAt: "2026-11-09T02:30:00.000Z", lastStatus: "clean" },
  { id: "site-09", name: "Sekretariat Daerah Kabupaten Sumbawa", url: "https://setda.sumbawakab.go.id", status: "ACTIVE", category: "SETDA", monitored: true, lastScanAt: "2026-11-09T02:00:00.000Z", lastStatus: "clean" },
  { id: "site-10", name: "Inspektorat Daerah Kabupaten Sumbawa", url: "https://inspektorat.sumbawakab.go.id", status: "ACTIVE", category: "OPD", monitored: true, lastScanAt: "2026-11-09T01:30:00.000Z", lastStatus: "clean" },
  { id: "site-11", name: "Dinas Penanaman Modal dan PTSP", url: "https://dpmptsp.sumbawakab.go.id", status: "ACTIVE", category: "OPD", monitored: true, lastScanAt: "2026-11-09T01:00:00.000Z", lastStatus: "clean" },
  { id: "site-12", name: "Dinas Lingkungan Hidup", url: "https://dlh.sumbawakab.go.id", status: "ACTIVE", category: "OPD", monitored: true, lastScanAt: "2026-11-08T23:30:00.000Z", lastStatus: "clean" },
  { id: "site-13", name: "Satuan Polisi Pamong Praja", url: "https://satpolpp.sumbawakab.go.id", status: "ACTIVE", category: "OPD", monitored: true, lastScanAt: "2026-11-08T22:00:00.000Z", lastStatus: "clean" },
  { id: "site-14", name: "Dinas Perhubungan Kabupaten Sumbawa", url: "https://dishub.sumbawakab.go.id", status: "ACTIVE", category: "OPD", monitored: true, lastScanAt: "2026-11-08T20:00:00.000Z", lastStatus: "clean" },
];

// Helper membuat item scan realistis
function createScanRecord({
  id,
  url,
  title,
  scannedAt,
  scanSource = "SCHEDULED",
  crawlStatus = "success",
  httpStatus = 200,
  findings = null, // { gambling: 2, fraud: 1, pornography: 0, link: 0, defacement: 0 }
  officerEmail = "petugas.sandi@sumbawakab.go.id",
}) {
  const isCrawlFailed = crawlStatus === "failed";
  const hasTextFindings = findings && (findings.gambling || findings.pornography || findings.fraud);
  const hasLinkFindings = findings && findings.link;
  const hasDefacement = findings && findings.defacement;

  const categories = [];
  if (findings?.gambling) {
    categories.push({
      category: "gambling",
      label: "Judi online (Gambling)",
      matches: Array(findings.gambling).fill("slot deposit pulsa gacor"),
    });
  }
  if (findings?.pornography) {
    categories.push({
      category: "pornography",
      label: "Pornografi",
      matches: Array(findings.pornography).fill("konten dewasa terlarang"),
    });
  }
  if (findings?.fraud) {
    categories.push({
      category: "fraud",
      label: "Penipuan (Fraud)",
      matches: Array(findings.fraud).fill("klaim hadiah undian palsu"),
    });
  }

  return {
    id,
    url,
    title,
    scannedAt,
    scanSource,
    officerEmail,
    crawlStatus,
    httpStatus: isCrawlFailed ? (httpStatus === 200 ? 503 : httpStatus) : httpStatus,
    contentType: isCrawlFailed ? null : "text/html",
    crawlMetadata: {
      depth: 1,
      durationMs: isCrawlFailed ? 1200 : 4500,
      ...(isCrawlFailed ? { error: "Koneksi ke host tujuan gagal atau waktu habis (timeout)." } : {}),
    },
    textDetectionStatus: isCrawlFailed ? "skipped" : "success",
    textDetection: isCrawlFailed
      ? null
      : {
          success: true,
          data: {
            detected: Boolean(hasTextFindings),
            categories,
          },
        },
    linkDetectionStatus: isCrawlFailed ? "skipped" : "success",
    linkDetection: isCrawlFailed
      ? null
      : {
          success: true,
          data: {
            detected: Boolean(hasLinkFindings),
            links: hasLinkFindings ? [{ url: "https://suspicious-tracker.xyz", indicators: ["blacklisted"] }] : [],
          },
        },
    defacementDetectionStatus: isCrawlFailed ? "skipped" : (hasDefacement ? "success" : "skipped"),
    defacementDetection: isCrawlFailed || !hasDefacement
      ? null
      : {
          success: true,
          data: {
            detected: true,
            indicators: ["Hacked by Anonymous Team - script injection detected"],
          },
        },
    emailNotification: {
      sent: true,
      sentAt: scannedAt,
      recipient: officerEmail,
    },
  };
}

// 40 Scan Riwayat untuk Skenario Normal (7 hari terakhir, sebagian besar aman, 1 gagal)
function generateNormalScans() {
  const scans = [];
  const baseDate = new Date("2026-11-09T08:00:00.000Z");

  for (let i = 0; i < 40; i++) {
    const site = normalSites[i % normalSites.length];
    // Sebar waktu dalam 7 hari terakhir
    const dateOffsetHours = i * 4;
    const scanDate = new Date(baseDate.getTime() - dateOffsetHours * 3600000);
    const id = `scan-norm-${String(i + 1).padStart(3, "0")}`;

    if (i === 12) {
      // 1 scan gagal perayapan (kesimpulan Gagal, BUKAN Aman)
      scans.push(
        createScanRecord({
          id,
          url: "https://dishub.sumbawakab.go.id/pelayanan",
          title: "Dinas Perhubungan Kabupaten Sumbawa",
          scannedAt: scanDate.toISOString(),
          scanSource: "SCHEDULED",
          crawlStatus: "failed",
          httpStatus: 504,
        })
      );
    } else {
      scans.push(
        createScanRecord({
          id,
          url: site.url,
          title: site.name,
          scannedAt: scanDate.toISOString(),
          scanSource: i % 3 === 0 ? "MANUAL" : "SCHEDULED",
          crawlStatus: "success",
          httpStatus: 200,
          findings: null,
        })
      );
    }
  }
  return scans;
}

// Skenario Indicated (beberapa situs terindikasi kategori campuran)
function generateIndicatedScans() {
  const scans = generateNormalScans();
  // Ubah 4 scan terbaru menjadi ada temuan indikasi
  scans[0] = createScanRecord({
    id: "scan-ind-001",
    url: "https://bappeda.sumbawakab.go.id",
    title: "Badan Perencanaan Pembangunan Daerah",
    scannedAt: "2026-11-09T07:45:00.000Z",
    scanSource: "SCHEDULED",
    findings: { gambling: 3, fraud: 1 },
  });
  scans[1] = createScanRecord({
    id: "scan-ind-002",
    url: "https://kominfosandi.sumbawakab.go.id",
    title: "Dinas Komunikasi, Informatika, Statistik dan Persandian",
    scannedAt: "2026-11-09T06:30:00.000Z",
    scanSource: "MANUAL",
    findings: { defacement: 1 },
  });
  scans[2] = createScanRecord({
    id: "scan-ind-003",
    url: "https://dpmptsp.sumbawakab.go.id",
    title: "Dinas Penanaman Modal dan PTSP",
    scannedAt: "2026-11-09T04:15:00.000Z",
    scanSource: "SCHEDULED",
    findings: { pornography: 2, link: 1 },
  });
  scans[3] = createScanRecord({
    id: "scan-ind-004",
    url: "https://bapenda.sumbawakab.go.id",
    title: "Badan Pendapatan Daerah",
    scannedAt: "2026-11-08T22:00:00.000Z",
    scanSource: "SCHEDULED",
    findings: { fraud: 2 },
  });
  return scans;
}

const mockSchedules = [
  {
    id: "sched-01",
    name: "Pemindaian Rutin Subuh - Portal Utama & OPD",
    siteId: "site-01",
    cron: "0 4 * * *",
    status: "ACTIVE",
    lastRunAt: "2026-11-09T04:00:00.000Z",
    nextRunAt: "2026-11-10T04:00:00.000Z",
  },
  {
    id: "sched-02",
    name: "Pemeriksaan Mingguan Defacement OPD",
    siteId: "site-02",
    cron: "0 2 * * 0",
    status: "ACTIVE",
    lastRunAt: "2026-11-08T02:00:00.000Z",
    nextRunAt: "2026-11-15T02:00:00.000Z",
  },
];

const mockNotificationsIndicated = [
  {
    id: "notif-ind-01",
    url: "https://bappeda.sumbawakab.go.id",
    scannedAt: "2026-11-09T07:45:00.000Z",
    status: "indicated",
    categories: [
      { category: "gambling", label: "Judi online (Gambling)", count: 3 },
      { category: "fraud", label: "Penipuan (Fraud)", count: 1 },
    ],
    total: 4,
    read: false,
    emailSent: true,
  },
  {
    id: "notif-ind-02",
    url: "https://kominfosandi.sumbawakab.go.id",
    scannedAt: "2026-11-09T06:30:00.000Z",
    status: "indicated",
    categories: [
      { category: "defacement", label: "Perubahan halaman (Defacement)", count: 1 },
    ],
    total: 1,
    read: false,
    emailSent: true,
  },
  {
    id: "notif-ind-03",
    url: "https://dpmptsp.sumbawakab.go.id",
    scannedAt: "2026-11-09T04:15:00.000Z",
    status: "indicated",
    categories: [
      { category: "pornography", label: "Pornografi", count: 2 },
      { category: "link", label: "Tautan mencurigakan", count: 1 },
    ],
    total: 3,
    read: true,
    emailSent: true,
  },
];

function getScenarioData(scenarioName = "normal") {
  switch (scenarioName) {
    case "indicated": {
      const indicatedSites = normalSites.map((site) => {
        if (site.id === "site-03") return { ...site, lastStatus: "indicated", lastScanAt: "2026-11-09T07:45:00.000Z" };
        if (site.id === "site-02") return { ...site, lastStatus: "indicated", lastScanAt: "2026-11-09T06:30:00.000Z" };
        if (site.id === "site-11") return { ...site, lastStatus: "indicated", lastScanAt: "2026-11-09T04:15:00.000Z" };
        if (site.id === "site-07") return { ...site, lastStatus: "indicated", lastScanAt: "2026-11-08T22:00:00.000Z" };
        return site;
      });
      return {
        session: mockSession,
        sites: indicatedSites,
        scans: generateIndicatedScans(),
        schedules: mockSchedules,
        notifications: mockNotificationsIndicated,
      };
    }
    case "empty": {
      return {
        session: mockSession,
        sites: [],
        scans: [],
        schedules: [],
        notifications: [],
      };
    }
    case "error": {
      return {
        session: mockSession,
        sites: [],
        scans: [],
        schedules: [],
        notifications: [],
        error: true,
        errorMessage: "Server analisis tidak dapat dihubungi. Periksa koneksi backend atau konfigurasi gateway.",
      };
    }
    case "normal":
    default: {
      return {
        session: mockSession,
        sites: normalSites,
        scans: generateNormalScans(),
        schedules: mockSchedules,
        notifications: [],
      };
    }
  }
}

function handleMockApiRequest(url, scenarioName = "normal") {
  const data = getScenarioData(scenarioName);
  const parsed = new URL(url, "http://localhost:3004");
  const pathname = parsed.pathname;

  if (pathname.includes("/api/v1/auth/session") || pathname.includes("/auth/session")) {
    return { status: 200, body: { success: true, data: data.session } };
  }

  if (data.error) {
    if (pathname.includes("/health")) {
      return { status: 200, body: { success: true, data: { status: "degraded" } } };
    }
    return {
      status: 503,
      body: { success: false, error: { code: "SERVICE_UNAVAILABLE", message: data.errorMessage } },
    };
  }

  if (pathname.includes("/health")) {
    return { status: 200, body: { success: true, data: { status: "ok" } } };
  }
  if (pathname.includes("/api/v1/auth/session")) {
    return { status: 200, body: { success: true, data: data.session } };
  }
  if (pathname.includes("/api/v1/sites")) {
    return { status: 200, body: { success: true, data: { sites: data.sites } } };
  }
  if (pathname.includes("/api/v1/scans/recent")) {
    return { status: 200, body: { success: true, data: { scans: data.scans } } };
  }
  if (pathname.includes("/api/v1/scans/jobs")) {
    return { status: 200, body: { success: true, data: { jobs: [] } } };
  }
  if (pathname.includes("/api/v1/schedules")) {
    return { status: 200, body: { success: true, data: { schedules: data.schedules } } };
  }

  return { status: 200, body: { success: true, data: {} } };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    mockSession,
    normalSites,
    mockSchedules,
    mockNotificationsIndicated,
    generateNormalScans,
    generateIndicatedScans,
    getScenarioData,
    handleMockApiRequest,
  };
}
