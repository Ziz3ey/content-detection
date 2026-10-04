import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "./App.jsx";
import { validateTargetUrl } from "./api.js";

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

const historyResponse = jsonResponse({ success: true, data: { scans: [] } });

const scanPage = {
  id: "scan-001",
  url: "https://fixture.local/",
  scannedAt: "2026-09-29T12:00:00.000Z",
  depth: 0,
  crawl: {
    success: true,
    status: 200,
    contentType: "text/html",
    title: "Local fixture",
  },
  textDetection: { success: true, data: { detected: false, categories: [] } },
  defacementDetection: {
    success: false,
    error: {
      code: "BASELINE_NOT_PROVIDED",
      message: "Baseline belum tersedia.",
    },
  },
  linkDetection: {
    success: true,
    data: {
      detected: true,
      indicators: [{ type: "ip_hostname", description: "IP host" }],
    },
  },
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(historyResponse));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("URL validation", () => {
  it("accepts and normalizes HTTP and HTTPS URLs", () => {
    expect(validateTargetUrl(" https://fixture.local/path/#section ")).toBe(
      "https://fixture.local/path",
    );
    expect(validateTargetUrl("http://fixture.local/")).toBe(
      "http://fixture.local/",
    );
  });

  it("rejects empty, malformed, and non-HTTP URLs", () => {
    expect(() => validateTargetUrl(" ")).toThrow("URL wajib diisi");
    expect(() => validateTargetUrl("fixture.local/path")).toThrow(
      "URL absolut",
    );
    expect(() => validateTargetUrl("javascript:alert(1)")).toThrow(
      "HTTP atau HTTPS",
    );
  });
});

describe("Dashboard", () => {
  it("renders the scan form and ready status", async () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Analisis halaman web" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("URL situs")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /mulai analisis/i }),
    ).toBeEnabled();
    expect(screen.getByText("Siap")).toBeInTheDocument();
    await screen.findByText("Belum ada riwayat scan.");
  });

  it("shows loading state and renders a successful scan", async () => {
    let finishScan;
    fetch.mockImplementation((url) => {
      if (String(url).includes("/scans/recent"))
        return Promise.resolve(historyResponse);
      return new Promise((resolve) => {
        finishScan = () =>
          resolve(jsonResponse({ success: true, data: { pages: [scanPage] } }));
      });
    });
    render(<App />);

    fireEvent.change(screen.getByLabelText("URL situs"), {
      target: { value: "https://fixture.local/" },
    });
    fireEvent.click(screen.getByRole("button", { name: /mulai analisis/i }));
    expect(
      await screen.findByRole("button", { name: /memindai/i }),
    ).toBeDisabled();

    finishScan();
    expect(
      await screen.findByRole("heading", { name: "Ringkasan scan" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tidak ada pattern cocok")).toBeInTheDocument();
    expect(
      screen.getByText("Baseline belum tersedia untuk halaman ini."),
    ).toBeInTheDocument();
    expect(screen.getByText("Pattern cocok")).toBeInTheDocument();
  });

  it("shows a backend error without rendering a false detection result", async () => {
    fetch.mockImplementation((url) =>
      String(url).includes("/scans/recent")
        ? Promise.resolve(historyResponse)
        : Promise.resolve(
            jsonResponse(
              {
                success: false,
                error: {
                  code: "INTERNAL_ERROR",
                  message: "Database belum tersedia.",
                },
              },
              500,
            ),
          ),
    );
    render(<App />);

    fireEvent.change(screen.getByLabelText("URL situs"), {
      target: { value: "https://fixture.local/" },
    });
    fireEvent.click(screen.getByRole("button", { name: /mulai analisis/i }));

    expect(
      await screen.findByText("Database belum tersedia."),
    ).toBeInTheDocument();
    expect(screen.getByText("Gagal")).toBeInTheDocument();
    expect(screen.queryByText("Tidak ada indikasi")).not.toBeInTheDocument();
  });

  it("distinguishes detector errors from successful no-indication results", async () => {
    render(<App />);
    const errorPage = {
      ...scanPage,
      textDetection: {
        success: false,
        error: { code: "SERVICE_TIMEOUT", message: "Text service timeout." },
      },
    };
    fetch.mockImplementation((url) =>
      String(url).includes("/scans/recent")
        ? Promise.resolve(historyResponse)
        : Promise.resolve(
            jsonResponse({ success: true, data: { pages: [errorPage] } }),
          ),
    );

    fireEvent.change(screen.getByLabelText("URL situs"), {
      target: { value: "https://fixture.local/" },
    });
    fireEvent.click(screen.getByRole("button", { name: /mulai analisis/i }));

    expect(
      await screen.findByText("Text service timeout."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Tidak ada indikasi")).not.toBeInTheDocument();
  });

  it("renders an empty scan result without inventing pages", async () => {
    fetch.mockImplementation((url) =>
      String(url).includes("/scans/recent")
        ? Promise.resolve(historyResponse)
        : Promise.resolve(jsonResponse({ success: true, data: { pages: [] } })),
    );
    render(<App />);

    fireEvent.change(screen.getByLabelText("URL situs"), {
      target: { value: "https://fixture.local/" },
    });
    fireEvent.click(screen.getByRole("button", { name: /mulai analisis/i }));

    expect(await screen.findByText("Data tidak tersedia")).toBeInTheDocument();
  });

  it("renders history and loads a selected scan detail", async () => {
    const savedScan = {
      id: "history-01",
      url: scanPage.url,
      scannedAt: scanPage.scannedAt,
      crawlStatus: "success",
      httpStatus: 200,
      contentType: "text/html",
      title: "Local fixture",
      textDetectionStatus: "success",
      textDetection: scanPage.textDetection,
      defacementDetectionStatus: "skipped",
      defacementDetection: null,
      linkDetectionStatus: "success",
      linkDetection: scanPage.linkDetection,
      crawlMetadata: { depth: 0, links: [] },
    };
    fetch.mockImplementation((url) =>
      String(url).includes("/scans/recent")
        ? Promise.resolve(
            jsonResponse({ success: true, data: { scans: [savedScan] } }),
          )
        : Promise.resolve(
            jsonResponse({ success: true, data: { scan: savedScan } }),
          ),
    );
    render(<App />);

    expect(await screen.findByText("Local fixture")).toBeInTheDocument();
    expect(screen.getByText("https://fixture.local/")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /view/i }));
    expect(await screen.findByText("DETAIL RIWAYAT")).toBeInTheDocument();
    expect(screen.getAllByText("SKIPPED")).toHaveLength(2);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/scans/history-01"),
      {},
    );
  });
});
