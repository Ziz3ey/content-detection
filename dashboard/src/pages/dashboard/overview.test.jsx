import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import OverviewPage from "./OverviewPage.jsx";

describe("OverviewPage (Redesain Ringkasan)", () => {
  afterEach(() => {
    cleanup();
  });
  const defaultProps = {
    totalSites: 14,
    totalScans: 40,
    sitesWithIndications: 0,
    activityData: [
      { label: "Sen", value: 3 },
      { label: "Sel", value: 5 },
      { label: "Rab", value: 2 },
      { label: "Kam", value: 6 },
      { label: "Jum", value: 4 },
      { label: "Sab", value: 1 },
      { label: "Min", value: 7 },
    ],
    distributionData: [
      { label: "Judi online (Gambling)", value: 5 },
      { label: "Pornografi (Pornography)", value: 2 },
    ],
    history: [
      {
        id: "scan-1",
        url: "https://sumbawakab.go.id",
        scannedAt: "2026-11-09T08:00:00Z",
        scanSource: "SCHEDULED",
        crawlStatus: "success",
        textDetection: { success: true, data: { detected: false } },
      },
      {
        id: "scan-2",
        url: "https://dinkes.sumbawakab.go.id",
        scannedAt: "2026-11-09T09:00:00Z",
        scanSource: "MANUAL",
        crawlStatus: "success",
        textDetection: {
          success: true,
          data: {
            detected: true,
            gambling: { detected: true, count: 2 },
          },
        },
      },
    ],
    sites: [
      {
        id: 1,
        name: "Portal Resmi Kabupaten Sumbawa",
        url: "https://sumbawakab.go.id",
      },
      {
        id: 2,
        name: "Dinas Kesehatan",
        url: "https://dinkes.sumbawakab.go.id",
      },
    ],
    historyLoading: false,
    historyError: "",
    onRefreshHistory: vi.fn(),
    onNavigate: vi.fn(),
    onViewHistory: vi.fn(),
    historyToPage: (s) => s,
    summarizeIndications: (page) => {
      if (page.textDetection?.data?.detected) {
        return {
          categories: [{ label: "Judi online (Gambling)", count: 2 }],
          total: 2,
        };
      }
      return { categories: [], total: 0 };
    },
  };

  it("renders page header with title, description, and action buttons", () => {
    render(<OverviewPage {...defaultProps} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Ringkasan" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Kondisi pemantauan situs web OPD berdasarkan pemindaian terbaru.",
      ),
    ).toBeInTheDocument();

    const refreshBtn = screen.getByRole("button", { name: /perbarui data/i });
    const scanBtn = screen.getByRole("button", { name: /mulai pemindaian/i });
    expect(refreshBtn).toBeInTheDocument();
    expect(scanBtn).toBeInTheDocument();

    fireEvent.click(refreshBtn);
    expect(defaultProps.onRefreshHistory).toHaveBeenCalled();

    fireEvent.click(scanBtn);
    expect(defaultProps.onNavigate).toHaveBeenCalledWith("pemeriksaan");
  });

  it("StatCard 'Situs terindikasi' is neutral (default tone) when 0", () => {
    render(<OverviewPage {...defaultProps} sitesWithIndications={0} />);

    const neutralCard = screen
      .getByText(/^Situs terindikasi$/i)
      .closest(".ui-stat-card");
    expect(neutralCard).toHaveClass("ui-stat-card--default");
    expect(neutralCard).not.toHaveClass("ui-stat-card--danger");
    expect(screen.getByText("Tidak ada indikasi terdeteksi")).toBeInTheDocument();
  });

  it("StatCard 'Situs terindikasi' has danger tone when > 0", () => {
    render(<OverviewPage {...defaultProps} sitesWithIndications={3} />);

    const dangerCard = screen
      .getByText(/^Situs terindikasi$/i)
      .closest(".ui-stat-card");
    expect(dangerCard).toHaveClass("ui-stat-card--danger");
    expect(screen.getByText("Perlu tindakan verifikasi")).toBeInTheDocument();
  });

  it("condition banner appears only when indicated sites or crawl failures exist", () => {
    // 1. Clean condition: no banner
    const { rerender } = render(
      <OverviewPage
        {...defaultProps}
        sitesWithIndications={0}
        history={[
          { id: "1", crawlStatus: "success", textDetection: { success: true } },
        ]}
      />,
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    // 2. Danger condition banner when sitesWithIndications > 0
    rerender(
      <OverviewPage
        {...defaultProps}
        sitesWithIndications={2}
        history={[
          { id: "1", crawlStatus: "success", textDetection: { success: true } },
        ]}
      />,
    );
    const dangerBanner = screen.getByRole("alert");
    expect(dangerBanner).toHaveClass("ui-alert--danger");
    expect(
      screen.getByText(/2 situs terindikasi pada pemindaian terbaru/i),
    ).toBeInTheDocument();

    const resultLink = screen.getByRole("button", { name: /lihat hasil/i });
    fireEvent.click(resultLink);
    expect(defaultProps.onNavigate).toHaveBeenCalledWith("hasil");

    // 3. Warning condition banner when crawl failed
    rerender(
      <OverviewPage
        {...defaultProps}
        sitesWithIndications={0}
        history={[
          { id: "1", crawlStatus: "failed", textDetection: { success: false } },
        ]}
      />,
    );
    const warningBanner = screen.getByRole("alert");
    expect(warningBanner).toHaveClass("ui-alert--warning");
    expect(
      screen.getByText(/1 pemindaian gagal dijalankan/i),
    ).toBeInTheDocument();

    const historyLink = screen.getByRole("button", { name: /lihat riwayat/i });
    fireEvent.click(historyLink);
    expect(defaultProps.onNavigate).toHaveBeenCalledWith("riwayat");
  });

  it("renders table with site name and host, fallback '—' when fields are missing", () => {
    const incompleteHistory = [
      {
        id: "scan-incomplete",
        url: "",
        scannedAt: null,
        scanSource: "",
        crawlStatus: "success",
      },
    ];

    render(
      <OverviewPage
        {...defaultProps}
        history={incompleteHistory}
        sites={[]}
      />,
    );

    // Site cell should display "—"
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });

  it("renders empty state when history is empty", () => {
    render(<OverviewPage {...defaultProps} history={[]} />);
    expect(screen.getByText("Belum ada pemindaian")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /mulai pemindaian/i }).length,
    ).toBe(2);
  });

  it("renders error state when historyError is provided with retry button", () => {
    render(
      <OverviewPage
        {...defaultProps}
        historyError="Gagal terhubung ke basis data"
      />,
    );
    expect(
      screen.getByText("Gagal memuat data riwayat pemindaian"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Gagal terhubung ke basis data"),
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /coba lagi/i });
    fireEvent.click(retryBtn);
    expect(defaultProps.onRefreshHistory).toHaveBeenCalled();
  });

  it("provides visually hidden alternative tables for both BarChart and DonutChart", () => {
    render(<OverviewPage {...defaultProps} />);

    expect(
      screen.getByRole("table", {
        name: "Aktivitas pemindaian, 7 hari terakhir",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("table", {
        name: "Sebaran kategori temuan",
      }),
    ).toBeInTheDocument();
  });

  it("DonutChart legend items are keyboard focusable and highlight categories", () => {
    render(<OverviewPage {...defaultProps} />);

    const legendItems = screen.getAllByRole("button", {
      name: /Judi online|Pornografi/,
    });
    expect(legendItems.length).toBeGreaterThanOrEqual(2);

    // Focus first legend item
    fireEvent.focus(legendItems[0]);
    expect(legendItems[0]).toHaveClass("is-hovered");

    fireEvent.blur(legendItems[0]);
    expect(legendItems[0]).not.toHaveClass("is-hovered");
  });

  it("DonutChart renders CircleCheck with message when zero findings exist", () => {
    render(
      <OverviewPage
        {...defaultProps}
        distributionData={[]}
      />,
    );

    expect(
      screen.getByText("Tidak ada temuan pada riwayat pemindaian terbaru."),
    ).toBeInTheDocument();
    // No green "Status bersih" box or old text
    expect(
      screen.queryByText(/Status Bersih & Terlindungi/i),
    ).not.toBeInTheDocument();
  });

  it("displays '—' in StatCards when historyLoading is true", () => {
    render(<OverviewPage {...defaultProps} historyLoading={true} />);
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(4);
  });
});
