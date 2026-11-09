import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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
const sessionResponse = jsonResponse({
  success: true,
  data: { authenticated: true, username: "admin" },
});

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
    error: { code: "BASELINE_NOT_PROVIDED", message: "Baseline belum tersedia." },
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
  window.history.replaceState(null, "", "#ringkasan");
  window.localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn((url) =>
      String(url).includes("/auth/session")
        ? Promise.resolve(sessionResponse)
        : Promise.resolve(historyResponse),
    ),
  );
});

const ROUTE_NAME_MAP = {
  Dashboard: /Ringkasan|Dashboard/i,
  "Situs Web": /Manajemen situs|Situs Web/i,
  "Jadwal Pemindaian": /Jadwal pemeriksaan|Jadwal Pemindaian/i,
  "Hasil Deteksi": /Hasil terbaru|Hasil Deteksi/i,
  "Riwayat Pemindaian": /Riwayat|Riwayat Pemindaian/i,
  Pemindaian: /Pemindaian/i,
};

function navigateTo(label) {
  const matcher = ROUTE_NAME_MAP[label] || label;
  fireEvent.click(screen.getByRole("link", { name: matcher }));
}

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
    expect(() => validateTargetUrl("fixture.local/path")).toThrow("URL absolut");
    expect(() => validateTargetUrl("javascript:alert(1)")).toThrow(
      "HTTP atau HTTPS",
    );
  });
});

describe("Landing Page", () => {
  it("shows the landing page when opening without authentication on the initial route", async () => {
    window.history.replaceState(null, "", "#landing");
    fetch.mockImplementation((url) =>
      String(url).includes("/auth/session")
        ? Promise.resolve(
            jsonResponse({ success: true, data: { authenticated: false } }),
          )
        : Promise.resolve(historyResponse),
    );
    render(<App />);

    expect(
      await screen.findByRole("heading", {
        name: /Pemantauan dan Deteksi Indikasi Konten Negatif/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Pemerintah Kabupaten Sumbawa/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Judi online")).toBeInTheDocument();
    expect(screen.getByText("Pornografi")).toBeInTheDocument();
    expect(screen.getByText("Penipuan")).toBeInTheDocument();
    expect(screen.getByText("Tautan atau elemen mencurigakan")).toBeInTheDocument();
    expect(screen.getByText("Perubahan halaman (indikasi defacement)")).toBeInTheDocument();
    expect(screen.getByText("Penelusuran Halaman")).toBeInTheDocument();
    expect(screen.getByText("Pemeriksaan")).toBeInTheDocument();
  });

  it("navigates from landing page to login page when clicking Masuk", async () => {
    window.history.replaceState(null, "", "#landing");
    fetch.mockImplementation((url) =>
      String(url).includes("/auth/session")
        ? Promise.resolve(
            jsonResponse({ success: true, data: { authenticated: false } }),
          )
        : Promise.resolve(historyResponse),
    );
    render(<App />);

    const masukButtons = await screen.findAllByRole("button", {
      name: "Masuk",
    });
    expect(masukButtons.length).toBeGreaterThan(0);
    fireEvent.click(masukButtons[0]);

    expect(
      await screen.findByRole("heading", { name: "Masuk" }),
    ).toBeInTheDocument();
  });

  it("redirects authenticated user from landing route to dashboard", async () => {
    window.history.replaceState(null, "", "#landing");
    fetch.mockImplementation((url) =>
      String(url).includes("/auth/session")
        ? Promise.resolve(
            jsonResponse({ success: true, data: { authenticated: true, username: "admin" } }),
          )
        : Promise.resolve(historyResponse),
    );
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Ringkasan", level: 1 }),
    ).toBeInTheDocument();
  });

  it("Landing Page anchor links target valid section IDs (#fitur, #alur-kerja, #tentang)", async () => {
    window.history.replaceState(null, "", "#landing");
    fetch.mockImplementation((url) =>
      String(url).includes("/auth/session")
        ? Promise.resolve(
            jsonResponse({ success: true, data: { authenticated: false } }),
          )
        : Promise.resolve(historyResponse),
    );
    const { container } = render(<App />);

    await screen.findByRole("heading", {
      name: /Pemantauan dan Deteksi Indikasi Konten Negatif/i,
    });

    const fiturLink = container.querySelector('a[href="#fitur"]');
    const alurKerjaLink = container.querySelector('a[href="#alur-kerja"]');
    const tentangLink = container.querySelector('a[href="#tentang"]');
    const skipLink = container.querySelector('a[href="#main-content"]');

    expect(fiturLink).toBeInTheDocument();
    expect(alurKerjaLink).toBeInTheDocument();
    expect(tentangLink).toBeInTheDocument();
    expect(skipLink).toBeInTheDocument();

    expect(container.querySelector("#fitur")).toBeInTheDocument();
    expect(container.querySelector("#alur-kerja")).toBeInTheDocument();
    expect(container.querySelector("#tentang")).toBeInTheDocument();
    expect(container.querySelector("#main-content")).toBeInTheDocument();
  });

  it("A1: ensures no horizontal overflow on Landing and Login across 390px, 768px, and 1440px viewports", async () => {
    window.history.replaceState(null, "", "#landing");
    fetch.mockImplementation((url) =>
      String(url).includes("/auth/session")
        ? Promise.resolve(jsonResponse({ success: true, data: { authenticated: false } }))
        : Promise.resolve(historyResponse),
    );

    const viewports = [390, 768, 1440];
    for (const width of viewports) {
      window.innerWidth = width;
      window.dispatchEvent(new Event("resize"));
      const { container, unmount } = render(<App />);
      await screen.findByRole("heading", {
        name: /Pemantauan dan Deteksi Indikasi Konten Negatif/i,
      });

      const landingEl = container.querySelector(".pub-landing");
      expect(landingEl).toBeInTheDocument();
      expect(document.documentElement.scrollWidth <= window.innerWidth).toBe(true);
      unmount();
    }
  });
});

describe("Login", () => {
  it("renders the institutional login form and branding elements", async () => {
    window.history.replaceState(null, "", "#login");
    fetch.mockImplementation((url) =>
      String(url).includes("/auth/session")
        ? Promise.resolve(
            jsonResponse({ success: true, data: { authenticated: false } }),
          )
        : Promise.resolve(historyResponse),
    );
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Masuk" })).toBeInTheDocument();
    expect(screen.getAllByText(/Pemerintah Kabupaten Sumbawa/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/^nama pengguna/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^kata sandi/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Masuk" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /kembali ke beranda/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Akses khusus petugas CSIRT/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Akses dibatasi. Seluruh aktivitas pemindaian dicatat./i),
    ).toBeInTheDocument();
  });

  it("toggles password visibility between password and text", async () => {
    window.history.replaceState(null, "", "#login");
    fetch.mockImplementation((url) =>
      String(url).includes("/auth/session")
        ? Promise.resolve(
            jsonResponse({ success: true, data: { authenticated: false } }),
          )
        : Promise.resolve(historyResponse),
    );
    render(<App />);

    const passwordInput = await screen.findByLabelText(/^kata sandi/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = screen.getByRole("button", { name: "Tampilkan kata sandi" });
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    const hideButton = screen.getByRole("button", { name: "Sembunyikan kata sandi" });
    fireEvent.click(hideButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("navigates back to landing page when clicking Kembali ke Beranda", async () => {
    window.history.replaceState(null, "", "#login");
    fetch.mockImplementation((url) =>
      String(url).includes("/auth/session")
        ? Promise.resolve(
            jsonResponse({ success: true, data: { authenticated: false } }),
          )
        : Promise.resolve(historyResponse),
    );
    render(<App />);

    const backButton = await screen.findByRole("link", { name: /kembali ke beranda/i });
    expect(backButton).toBeInTheDocument();
    fireEvent.click(backButton);

    expect(
      await screen.findByRole("heading", {
        name: /Pemantauan dan Deteksi Indikasi Konten Negatif/i,
      }),
    ).toBeInTheDocument();
  });

  it("shows the login screen when the session is not authenticated", async () => {
    window.history.replaceState(null, "", "#login");
    fetch.mockImplementation((url) =>
      String(url).includes("/auth/session")
        ? Promise.resolve(
            jsonResponse({ success: true, data: { authenticated: false } }),
          )
        : Promise.resolve(historyResponse),
    );
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Masuk" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^nama pengguna/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^kata sandi/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /kata sandi/i }),
    ).toBeInTheDocument();
  });

  it("shows Alert when submitting with empty fields", async () => {
    window.history.replaceState(null, "", "#login");
    fetch.mockImplementation((url) =>
      String(url).includes("/auth/session")
        ? Promise.resolve(
            jsonResponse({ success: true, data: { authenticated: false } }),
          )
        : Promise.resolve(historyResponse),
    );
    render(<App />);
    await screen.findByRole("heading", { name: "Masuk" });

    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nama pengguna dan kata sandi wajib diisi.",
    );
  });

  it("shows Alert when server returns an error on login", async () => {
    window.history.replaceState(null, "", "#login");
    fetch.mockImplementation((url) => {
      const path = String(url);
      if (path.includes("/auth/session")) {
        return Promise.resolve(
          jsonResponse({ success: true, data: { authenticated: false } }),
        );
      }
      if (path.includes("/auth/login")) {
        return Promise.resolve(
          jsonResponse(
            {
              success: false,
              error: {
                code: "SERVER_ERROR",
                message: "Koneksi ke server gagal. Coba beberapa saat lagi.",
              },
            },
            500,
          ),
        );
      }
      return Promise.resolve(historyResponse);
    });

    render(<App />);
    await screen.findByRole("heading", { name: "Masuk" });

    fireEvent.change(screen.getByLabelText(/^nama pengguna/i), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText(/^kata sandi/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Koneksi ke server gagal. Coba beberapa saat lagi.",
    );
  });

  it("calls loginAdmin on valid submit and disables button in loading state", async () => {
    window.history.replaceState(null, "", "#login");
    let resolveLogin;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });

    fetch.mockImplementation((url, options = {}) => {
      const path = String(url);
      if (path.includes("/auth/session")) {
        return Promise.resolve(
          jsonResponse({ success: true, data: { authenticated: false } }),
        );
      }
      if (path.includes("/auth/login")) {
        const credentials = JSON.parse(options.body);
        expect(credentials).toEqual({
          username: "admin",
          password: "valid-password",
        });
        return loginPromise;
      }
      return Promise.resolve(historyResponse);
    });

    render(<App />);
    await screen.findByRole("heading", { name: "Masuk" });

    fireEvent.change(screen.getByLabelText(/^nama pengguna/i), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText(/^kata sandi/i), {
      target: { value: "valid-password" },
    });

    const submitBtn = screen.getByRole("button", { name: "Masuk" });
    fireEvent.click(submitBtn);

    // Saat proses login, tombol submit disabled
    expect(submitBtn).toBeDisabled();

    // Selesaikan login
    resolveLogin(
      jsonResponse({
        success: true,
        data: { authenticated: true, username: "admin" },
      }),
    );

    expect(
      await screen.findByRole("heading", { name: "Ringkasan", level: 1 }),
    ).toBeInTheDocument();
  });

  it("submits valid credentials and logs out", async () => {
    window.history.replaceState(null, "", "#login");
    let authenticated = false;
    fetch.mockImplementation((url, options = {}) => {
      const path = String(url);
      if (path.includes("/auth/session")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            data: authenticated
              ? { authenticated: true, username: "admin" }
              : { authenticated: false },
          }),
        );
      }
      if (path.includes("/auth/login")) {
        const credentials = JSON.parse(options.body);
        if (credentials.password !== "prototype-password") {
          return Promise.resolve(
            jsonResponse(
              {
                success: false,
                error: {
                  code: "INVALID_CREDENTIALS",
                  message: "Nama pengguna atau kata sandi tidak sesuai.",
                },
              },
              401,
            ),
          );
        }
        authenticated = true;
        return Promise.resolve(
          jsonResponse({
            success: true,
            data: { authenticated: true, username: "admin" },
          }),
        );
      }
      if (path.includes("/auth/logout")) {
        authenticated = false;
        return Promise.resolve(
          jsonResponse({
            success: true,
            data: { authenticated: false },
          }),
        );
      }
      return Promise.resolve(historyResponse);
    });

    render(<App />);
    await screen.findByRole("heading", { name: "Masuk" });

    fireEvent.change(screen.getByLabelText(/^nama pengguna/i), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText(/^kata sandi/i), {
      target: { value: "salah" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nama pengguna atau kata sandi tidak sesuai.",
    );

    fireEvent.change(screen.getByLabelText(/^kata sandi/i), {
      target: { value: "prototype-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));
    expect(
      await screen.findByRole("heading", { name: "Ringkasan", level: 1 }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /keluar/i }));
    expect(
      await screen.findByRole("heading", { name: "Masuk" }),
    ).toBeInTheDocument();
  });
});

describe("Dashboard", () => {
  it("renders the ringkasan tab with stat cards", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: "Ringkasan", level: 1 });
    navigateTo("Dashboard");

    expect(screen.getByText(/^Situs terdaftar$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^Pemindaian terbaru$/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/^Situs terindikasi$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Situs bebas indikasi$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Ringkasan", level: 1 }),
    ).toBeInTheDocument();
  });

  it("renders the scan form and ready status", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: "Ringkasan", level: 1 });

    navigateTo("Pemindaian");
    expect(screen.getByLabelText("URL situs")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /mulai analisis/i }),
    ).toBeEnabled();
    expect(screen.getByRole("heading", { level: 2, name: "Siap" })).toBeInTheDocument();
    expect(window.location.hash).toBe("#pemeriksaan");

    navigateTo("Hasil Deteksi");
    expect(
      screen.getByText("Belum ada hasil pemeriksaan terbaru."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("URL situs")).not.toBeInTheDocument();

    navigateTo("Riwayat Pemindaian");
    await waitFor(() =>
      expect(screen.getByText("Belum ada riwayat scan.")).toBeInTheDocument(),
    );
    expect(window.location.hash).toBe("#riwayat");
  });

  it("opens the section selected by the URL hash", async () => {
    window.history.replaceState(null, "", "#riwayat");
    render(<App />);
    expect(await screen.findByText("Belum ada riwayat scan.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Riwayat/i }),
    ).toHaveAttribute("aria-current", "page");
    expect(screen.queryByLabelText("URL situs")).not.toBeInTheDocument();
  });

  it("shows loading state and renders a successful scan", async () => {
    let finishScan;
    fetch.mockImplementation((url) => {
      if (String(url).includes("/auth/session")) return Promise.resolve(sessionResponse);
      if (String(url).includes("/scans/recent")) return Promise.resolve(historyResponse);
      return new Promise((resolve) => {
        finishScan = () => resolve(jsonResponse({ success: true, data: { pages: [scanPage] } }));
      });
    });
    render(<App />);
    await screen.findByRole("heading", { name: "Ringkasan", level: 1 });
    navigateTo("Pemindaian");

    fireEvent.change(screen.getByLabelText("URL situs"), {
      target: { value: "https://fixture.local/" },
    });
    fireEvent.click(screen.getByRole("button", { name: /mulai analisis/i }));
    expect(await screen.findByRole("button", { name: /memindai/i })).toBeDisabled();

    finishScan();
    expect(
      await screen.findByRole("heading", { name: "Hasil pemeriksaan terbaru" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tidak ada indikasi berdasarkan pola")).toBeInTheDocument();
    expect(
      screen.getByText("Baseline belum tersedia untuk halaman ini."),
    ).toBeInTheDocument();
    expect(screen.getByText("Indikasi terdeteksi")).toBeInTheDocument();

    fireEvent.click(
      await screen.findByRole("button", { name: /Notifikasi(?: indikasi)?, 1 belum dibaca/i }),
    );
    expect(
      screen.getByText("Tautan mencurigakan (Suspicious Link): 1 temuan"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tandai dibaca" }));
    expect(
      screen.getByRole("button", { name: /Notifikasi(?: indikasi)?, 0 belum dibaca/i }),
    ).toBeInTheDocument();
    expect(
      JSON.parse(
        window.localStorage.getItem("content-detection:notifications:v1"),
      )[0].read,
    ).toBe(true);
    // Seluruh baris notifikasi kini dapat diaktifkan untuk membuka detail (0.3)
    fireEvent.click(
      screen.getByRole("button", { name: /notifikasi fixture\.local/i }),
    );
    expect(
      screen.getByRole("heading", { name: "Hasil pemeriksaan terbaru" }),
    ).toBeInTheDocument();
  });

  it("shows a backend error without rendering a false detection result", async () => {
    fetch.mockImplementation((url) =>
      String(url).includes("/auth/session")
        ? Promise.resolve(sessionResponse)
        : String(url).includes("/scans/recent")
        ? Promise.resolve(historyResponse)
        : Promise.resolve(
            jsonResponse(
              {
                success: false,
                error: { code: "INTERNAL_ERROR", message: "Database belum tersedia." },
              },
              500,
            ),
          ),
    );
    render(<App />);
    await screen.findByRole("heading", { name: "Ringkasan", level: 1 });
    navigateTo("Pemindaian");

    fireEvent.change(screen.getByLabelText("URL situs"), {
      target: { value: "https://fixture.local/" },
    });
    fireEvent.click(screen.getByRole("button", { name: /mulai analisis/i }));

    expect(await screen.findByText("Database belum tersedia.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Gagal" })).toBeInTheDocument();
    expect(screen.queryByText("Tidak ada indikasi")).not.toBeInTheDocument();
  });

  it("distinguishes detector errors from successful no-indication results", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: "Ringkasan", level: 1 });
    navigateTo("Pemindaian");
    const errorPage = {
      ...scanPage,
      textDetection: {
        success: false,
        error: { code: "SERVICE_TIMEOUT", message: "Text service timeout." },
      },
    };
    fetch.mockImplementation((url) =>
      String(url).includes("/auth/session")
        ? Promise.resolve(sessionResponse)
        : String(url).includes("/scans/recent")
        ? Promise.resolve(historyResponse)
        : Promise.resolve(jsonResponse({ success: true, data: { pages: [errorPage] } })),
    );

    fireEvent.change(screen.getByLabelText("URL situs"), {
      target: { value: "https://fixture.local/" },
    });
    fireEvent.click(screen.getByRole("button", { name: /mulai analisis/i }));

    await screen.findByText("Text service timeout.");
    navigateTo("Hasil Deteksi");
    expect(await screen.findByText("Text service timeout.")).toBeInTheDocument();
    expect(screen.queryByText("Tidak ada indikasi")).not.toBeInTheDocument();
  });

  it("renders an empty scan result without inventing pages", async () => {
    fetch.mockImplementation((url) =>
      String(url).includes("/auth/session")
        ? Promise.resolve(sessionResponse)
        : String(url).includes("/scans/recent")
        ? Promise.resolve(historyResponse)
        : Promise.resolve(jsonResponse({ success: true, data: { pages: [] } })),
    );
    render(<App />);
    await screen.findByRole("heading", { name: "Ringkasan", level: 1 });
    navigateTo("Pemindaian");

    fireEvent.change(screen.getByLabelText("URL situs"), {
      target: { value: "https://fixture.local/" },
    });
    fireEvent.click(screen.getByRole("button", { name: /mulai analisis/i }));

    await waitFor(() =>
      expect(screen.getByText("Belum ada hasil pemeriksaan terbaru.")).toBeInTheDocument(),
    );
  });

  it("shows the selected history record details and deletes only after confirmation", async () => {
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
    const secondScan = {
      ...savedScan,
      id: "history-02",
      url: "https://second.fixture.local/selected",
      scannedAt: "2026-09-30T12:00:00.000Z",
      title: "Selected historical page",
      textDetection: {
        success: true,
        data: {
          detected: true,
          categories: [{ category: "gambling", matches: [{ pattern: "sports betting" }] }],
        },
      },
    };
    let deleted = false;
    const confirm = vi.fn().mockReturnValue(false);
    vi.stubGlobal("confirm", confirm);
    fetch.mockImplementation((url, options = {}) => {
      const path = String(url);
      if (path.includes("/auth/session")) return Promise.resolve(sessionResponse);
      if (path.includes("/scans/recent")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            data: { scans: deleted ? [savedScan] : [savedScan, secondScan] },
          }),
        );
      }
      if (path.endsWith("/history-02") && options.method !== "DELETE") {
        return Promise.resolve(jsonResponse({ success: true, data: { scan: secondScan } }));
      }
      if (path.endsWith("/history-01") && options.method !== "DELETE") {
        return Promise.resolve(jsonResponse({ success: true, data: { scan: savedScan } }));
      }
      if (options.method === "DELETE") {
        deleted = true;
        return Promise.resolve(jsonResponse({ success: true, data: { deleted: true } }));
      }
      return Promise.resolve(historyResponse);
    });

    render(<App />);
    await screen.findByRole("heading", { name: "Ringkasan", level: 1 });
    navigateTo("Riwayat Pemindaian");

    await waitFor(() => expect(screen.getByText("Local fixture")).toBeInTheDocument());
    const viewButtons = await screen.findAllByRole("button", { name: /lihat/i });
    fireEvent.click(viewButtons[1]);
    expect(await screen.findByText("DETAIL RIWAYAT")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "https://second.fixture.local/selected" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/sports betting/)).toBeInTheDocument();
    expect(screen.getByText(/Waktu: 30 Sep 2026, 20\.00/)).toBeInTheDocument();
    expect(screen.getAllByText("DILEWATI")).toHaveLength(3);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/scans/history-02"),
      expect.objectContaining({ credentials: "include" }),
    );

    const deleteButtons = screen.getAllByRole("button", { name: "Hapus" });
    fireEvent.click(deleteButtons[1]);
    expect(confirm).toHaveBeenCalledWith("Hapus riwayat pemeriksaan ini?");
    expect(
      screen.getByRole("heading", { name: "https://second.fixture.local/selected" }),
    ).toBeInTheDocument();
    expect(
      fetch.mock.calls.some(([, options]) => options?.method === "DELETE"),
    ).toBe(false);

    confirm.mockReturnValue(true);
    fireEvent.click(screen.getAllByRole("button", { name: "Hapus" })[1]);
    await waitFor(() => expect(screen.getByText("Local fixture")).toBeInTheDocument());
    expect(
      screen.queryByText("https://second.fixture.local/selected"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("DETAIL RIWAYAT")).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/scans/history-02"),
      expect.objectContaining({
        credentials: "include",
        method: "DELETE",
      }),
    );
  });

  it("manages sites: renders site information, adds, edits, toggles status, searches, and deletes with confirmation", async () => {
    let mockSites = [
      {
        id: "site-101",
        name: "Dinas Kominfo Sumbawa",
        url: "https://kominfo.sumbawakab.go.id/",
        allowedHost: "kominfo.sumbawakab.go.id",
        status: "active",
        maxDepth: 1,
        maxPages: 20,
        baselineHtml: null,
        createdAt: "2026-10-01T10:00:00.000Z",
        updatedAt: "2026-10-01T10:00:00.000Z",
      },
      {
        id: "site-102",
        name: "BKD Sumbawa",
        url: "https://bkd.sumbawakab.go.id/",
        allowedHost: "bkd.sumbawakab.go.id",
        status: "inactive",
        maxDepth: 2,
        maxPages: 30,
        baselineHtml: null,
        createdAt: "2026-10-02T11:00:00.000Z",
        updatedAt: "2026-10-02T11:00:00.000Z",
      },
    ];

    const confirm = vi.fn().mockReturnValue(false);
    vi.stubGlobal("confirm", confirm);

    fetch.mockImplementation((url, options = {}) => {
      const path = String(url);
      if (path.includes("/auth/session")) return Promise.resolve(sessionResponse);
      if (path.includes("/scans/recent")) return Promise.resolve(historyResponse);
      if (path.includes("/health")) return Promise.resolve(jsonResponse({ success: true }));

      if (path.endsWith("/api/v1/sites") && !options.method) {
        return Promise.resolve(jsonResponse({ success: true, data: { sites: mockSites } }));
      }
      if (path.endsWith("/api/v1/sites") && options.method === "POST") {
        const body = JSON.parse(options.body);
        const newSite = {
          id: "site-103",
          name: body.name,
          url: body.url,
          allowedHost: new URL(body.url).hostname,
          status: body.status || "active",
          maxDepth: body.maxDepth || 1,
          maxPages: body.maxPages || 20,
          baselineHtml: body.baselineHtml || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockSites = [newSite, ...mockSites];
        return Promise.resolve(jsonResponse({ success: true, data: { site: newSite } }, 201));
      }
      if (path.includes("/api/v1/sites/site-101") && options.method === "PUT") {
        const body = JSON.parse(options.body);
        mockSites = mockSites.map((s) => (s.id === "site-101" ? { ...s, ...body } : s));
        return Promise.resolve(
          jsonResponse({
            success: true,
            data: { site: mockSites.find((s) => s.id === "site-101") },
          }),
        );
      }
      if (path.includes("/api/v1/sites/site-102") && options.method === "PUT") {
        const body = JSON.parse(options.body);
        mockSites = mockSites.map((s) => (s.id === "site-102" ? { ...s, ...body } : s));
        return Promise.resolve(
          jsonResponse({
            success: true,
            data: { site: mockSites.find((s) => s.id === "site-102") },
          }),
        );
      }
      if (path.includes("/api/v1/sites/site-102") && options.method === "DELETE") {
        mockSites = mockSites.filter((s) => s.id !== "site-102");
        return Promise.resolve(jsonResponse({ success: true, data: { deleted: true } }));
      }
      return Promise.resolve(historyResponse);
    });

    render(<App />);
    await screen.findByRole("heading", { name: "Ringkasan", level: 1 });

    navigateTo("Situs Web");
    expect(
      await screen.findByRole("heading", { name: "Daftar situs pemantauan" }),
    ).toBeInTheDocument();

    expect(screen.getByText("Dinas Kominfo Sumbawa")).toBeInTheDocument();
    expect(screen.getByText("https://kominfo.sumbawakab.go.id/")).toBeInTheDocument();
    expect(screen.getByText("AKTIF")).toBeInTheDocument();
    expect(screen.getByText("BKD Sumbawa")).toBeInTheDocument();
    expect(screen.getByText("NONAKTIF")).toBeInTheDocument();

    const searchInput = screen.getByLabelText("Cari situs");
    fireEvent.change(searchInput, { target: { value: "Kominfo" } });
    expect(screen.getByText("Dinas Kominfo Sumbawa")).toBeInTheDocument();
    expect(screen.queryByText("BKD Sumbawa")).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "" } });
    const statusSelect = screen.getByLabelText("Filter status:");
    fireEvent.change(statusSelect, { target: { value: "inactive" } });
    expect(screen.getByText("BKD Sumbawa")).toBeInTheDocument();
    expect(screen.queryByText("Dinas Kominfo Sumbawa")).not.toBeInTheDocument();

    fireEvent.change(statusSelect, { target: { value: "all" } });
    expect(screen.getByText("Dinas Kominfo Sumbawa")).toBeInTheDocument();
    expect(screen.getByText("BKD Sumbawa")).toBeInTheDocument();

    // Verify filter pills also filter correctly
    fireEvent.click(screen.getByRole("button", { name: /^Aktif\b/i }));
    expect(screen.getByText("Dinas Kominfo Sumbawa")).toBeInTheDocument();
    expect(screen.queryByText("BKD Sumbawa")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Semua\b/i }));
    expect(screen.getByText("Dinas Kominfo Sumbawa")).toBeInTheDocument();
    expect(screen.getByText("BKD Sumbawa")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Nonaktifkan" }));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/sites/site-101"),
        expect.objectContaining({ method: "PUT" }),
      );
    });

    fireEvent.click(screen.getByRole("button", { name: /tambah situs/i }));
    expect(screen.getByRole("heading", { name: "Tambah Situs Baru" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nama instansi"), {
      target: { value: "Inspektorat Sumbawa" },
    });
    fireEvent.change(screen.getByLabelText("URL situs"), {
      target: { value: "https://inspektorat.sumbawakab.go.id/" },
    });
    fireEvent.click(screen.getByRole("button", { name: /simpan situs/i }));
    await waitFor(() => expect(screen.getByText("Inspektorat Sumbawa")).toBeInTheDocument());

    confirm.mockReturnValue(false);
    fireEvent.click(screen.getByLabelText("Hapus BKD Sumbawa"));
    expect(confirm).toHaveBeenCalled();
    expect(screen.getByText("BKD Sumbawa")).toBeInTheDocument();

    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByLabelText("Hapus BKD Sumbawa"));
    await waitFor(() => expect(screen.queryByText("BKD Sumbawa")).not.toBeInTheDocument());
  });

  it("selects all active sites, starts batch scan, and displays separate results with status", async () => {
    const mockSites = [
      {
        id: "site-201",
        name: "Dinas Kesehatan",
        url: "https://dinkes.sumbawakab.go.id/",
        allowedHost: "dinkes.sumbawakab.go.id",
        status: "active",
        maxDepth: 1,
        maxPages: 10,
      },
      {
        id: "site-202",
        name: "Dinas Pendidikan",
        url: "https://disdik.sumbawakab.go.id/",
        allowedHost: "disdik.sumbawakab.go.id",
        status: "active",
        maxDepth: 1,
        maxPages: 10,
      },
    ];

    const dinkesPage = {
      ...scanPage,
      id: "scan-dinkes-01",
      url: "https://dinkes.sumbawakab.go.id/",
    };

    fetch.mockImplementation((url, options = {}) => {
      const path = String(url);
      if (path.includes("/auth/session")) return Promise.resolve(sessionResponse);
      if (path.includes("/scans/recent")) return Promise.resolve(historyResponse);
      if (path.includes("/health")) return Promise.resolve(jsonResponse({ success: true }));
      if (path.endsWith("/api/v1/sites")) {
        return Promise.resolve(jsonResponse({ success: true, data: { sites: mockSites } }));
      }
      if (path.includes("/api/v1/scan-sites")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            data: {
              scanned: 2,
              results: [
                {
                  siteId: "site-201",
                  siteName: "Dinas Kesehatan",
                  url: "https://dinkes.sumbawakab.go.id/",
                  status: "completed",
                  scanOutcome: "success",
                  result: { pages: [dinkesPage] },
                },
                {
                  siteId: "site-202",
                  siteName: "Dinas Pendidikan",
                  url: "https://disdik.sumbawakab.go.id/",
                  status: "failed",
                  scanOutcome: "failed",
                  error: { code: "FETCH_FAILED", message: "Koneksi ke situs gagal (timeout)." },
                },
              ],
            },
          }),
        );
      }
      return Promise.resolve(historyResponse);
    });

    render(<App />);
    await screen.findByRole("heading", { name: "Ringkasan", level: 1 });

    navigateTo("Pemindaian");
    await waitFor(() => {
      expect(screen.getByText("Dinas Kesehatan")).toBeInTheDocument();
      expect(screen.getByText("Dinas Pendidikan")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Pilih semua situs aktif" }));
    expect(screen.getByText("2 situs dipilih")).toBeInTheDocument();

    const startButton = screen.getByRole("button", { name: /mulai pemeriksaan/i });
    expect(startButton).toBeInTheDocument();
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Hasil pemeriksaan situs terdaftar" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("SEBAGIAN BERHASIL")).toBeInTheDocument();
    expect(screen.getAllByText("BERHASIL").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("GAGAL")).toBeInTheDocument();
    expect(
      screen.getByText("Koneksi ke situs gagal (timeout)."),
    ).toBeInTheDocument();
  });

  it("manages scheduled scans: renders schedule list, creates schedule, toggles status, and runs now", async () => {
    let mockSchedules = [
      {
        id: "sched-1",
        name: "Pemantauan Harian OPD",
        targetType: "all_active",
        siteIds: [],
        frequency: "daily",
        timeOfDay: "03:00",
        dayOfWeek: null,
        dayOfMonth: null,
        timezone: "Asia/Makassar",
        status: "active",
        isRunning: 0,
        lastRunAt: "2026-10-29T19:00:00.000Z",
        lastRunStatus: "success",
        lastRunMessage: "2/2 situs berhasil diperiksa",
        nextRunAt: "2026-10-30T19:00:00.000Z",
        createdAt: "2026-10-28T00:00:00.000Z",
        updatedAt: "2026-10-29T19:00:00.000Z",
      },
    ];

    const mockSites = [
      {
        id: "site-301",
        name: "Diskominfo Sumbawa",
        url: "https://diskominfo.sumbawakab.go.id/",
        status: "active",
      },
    ];

    fetch.mockImplementation((url, options = {}) => {
      const path = String(url);
      const method = options.method || "GET";

      if (path.includes("/auth/session")) return Promise.resolve(sessionResponse);
      if (path.includes("/scans/recent")) return Promise.resolve(historyResponse);
      if (path.includes("/health")) return Promise.resolve(jsonResponse({ success: true }));
      if (path.endsWith("/api/v1/sites")) {
        return Promise.resolve(jsonResponse({ success: true, data: { sites: mockSites } }));
      }
      if (path.endsWith("/api/v1/schedules") && method === "GET") {
        return Promise.resolve(jsonResponse({ success: true, data: { schedules: mockSchedules } }));
      }
      if (path.endsWith("/api/v1/schedules") && method === "POST") {
        const body = JSON.parse(options.body);
        const created = {
          id: "sched-new",
          ...body,
          isRunning: 0,
          lastRunAt: null,
          lastRunStatus: null,
          nextRunAt: "2026-10-31T00:00:00.000Z",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockSchedules = [...mockSchedules, created];
        return Promise.resolve(jsonResponse({ success: true, data: { schedule: created } }));
      }
      if (path.includes("/run-now") && method === "POST") {
        return Promise.resolve(
          jsonResponse({
            success: true,
            data: { summary: "1/1 situs berhasil diperiksa" },
          }),
        );
      }
      if (path.includes("/api/v1/schedules/sched-1") && method === "PUT") {
        const body = JSON.parse(options.body);
        mockSchedules = mockSchedules.map((s) =>
          s.id === "sched-1" ? { ...s, ...body } : s,
        );
        return Promise.resolve(
          jsonResponse({ success: true, data: { schedule: mockSchedules[0] } }),
        );
      }
      if (path.includes("/api/v1/schedules/sched-1") && method === "DELETE") {
        mockSchedules = mockSchedules.filter((s) => s.id !== "sched-1");
        return Promise.resolve(jsonResponse({ success: true, data: { deleted: true } }));
      }
      return Promise.resolve(historyResponse);
    });

    render(<App />);
    await screen.findByRole("heading", { name: "Ringkasan", level: 1 });

    navigateTo("Jadwal Pemindaian");
    await waitFor(() => {
      expect(screen.getByText("Pemantauan Harian OPD")).toBeInTheDocument();
      expect(screen.getByText("Semua situs aktif")).toBeInTheDocument();
      expect(screen.getByText("AKTIF")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Nonaktifkan" }));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/schedules/sched-1"),
        expect.objectContaining({ method: "PUT" }),
      );
    });

    fireEvent.click(screen.getByRole("button", { name: /jalankan/i }));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/schedules/sched-1/run-now"),
        expect.objectContaining({ method: "POST" }),
      );
      expect(screen.getByText(/1\/1 situs berhasil diperiksa/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /tambah jadwal/i }));
    expect(
      screen.getByRole("heading", { name: "Buat Jadwal Pemeriksaan Baru" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nama jadwal"), {
      target: { value: "Jadwal Mingguan Diskominfo" },
    });
    fireEvent.click(screen.getByRole("button", { name: /simpan jadwal/i }));
    await waitFor(() =>
      expect(screen.getByText("Jadwal Mingguan Diskominfo")).toBeInTheDocument(),
    );
  });

  it("filters scan history by source and displays manual vs scheduled badges", async () => {
    const mockHistory = [
      {
        id: "scan-m-1",
        url: "https://diskominfo.sumbawakab.go.id/",
        title: "Diskominfo Sumbawa",
        scannedAt: "2026-10-30T01:00:00.000Z",
        crawlStatus: "success",
        textDetectionStatus: "success",
        defacementDetectionStatus: "skipped",
        linkDetectionStatus: "success",
        scanSource: "MANUAL",
      },
      {
        id: "scan-s-1",
        url: "https://dinkes.sumbawakab.go.id/",
        title: "Dinkes Sumbawa",
        scannedAt: "2026-10-30T02:00:00.000Z",
        crawlStatus: "success",
        textDetectionStatus: "success",
        defacementDetectionStatus: "skipped",
        linkDetectionStatus: "success",
        scanSource: "SCHEDULED",
      },
    ];

    let lastSourceParam = null;

    fetch.mockImplementation((url) => {
      const path = String(url);
      if (path.includes("/auth/session")) return Promise.resolve(sessionResponse);
      if (path.includes("/health")) return Promise.resolve(jsonResponse({ success: true }));
      if (path.endsWith("/api/v1/sites")) {
        return Promise.resolve(jsonResponse({ success: true, data: { sites: [] } }));
      }
      if (path.endsWith("/api/v1/schedules")) {
        return Promise.resolve(jsonResponse({ success: true, data: { schedules: [] } }));
      }
      if (path.includes("/scans/recent")) {
        const urlObj = new URL(path, "http://localhost");
        lastSourceParam = urlObj.searchParams.get("source");
        let filtered = mockHistory;
        if (lastSourceParam) {
          filtered = mockHistory.filter((s) => s.scanSource === lastSourceParam);
        }
        return Promise.resolve(jsonResponse({ success: true, data: { scans: filtered } }));
      }
      return Promise.resolve(historyResponse);
    });

    render(<App />);
    await screen.findByRole("heading", { name: "Ringkasan", level: 1 });

    navigateTo("Riwayat Pemindaian");
    await waitFor(() => {
      expect(screen.getByText("Diskominfo Sumbawa")).toBeInTheDocument();
      expect(screen.getByText("Dinkes Sumbawa")).toBeInTheDocument();
      expect(screen.getByText("MANUAL")).toBeInTheDocument();
      expect(screen.getByText("TERJADWAL")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Terjadwal" }));
    await waitFor(() => {
      expect(lastSourceParam).toBe("SCHEDULED");
      expect(screen.getByText("Dinkes Sumbawa")).toBeInTheDocument();
      expect(screen.queryByText("Diskominfo Sumbawa")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Manual" }));
    await waitFor(() => {
      expect(lastSourceParam).toBe("MANUAL");
      expect(screen.getByText("Diskominfo Sumbawa")).toBeInTheDocument();
      expect(screen.queryByText("Dinkes Sumbawa")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Semua" }));
    await waitFor(() => {
      expect(lastSourceParam).toBe(null);
      expect(screen.getByText("Diskominfo Sumbawa")).toBeInTheDocument();
      expect(screen.getByText("Dinkes Sumbawa")).toBeInTheDocument();
    });
  });

  it("Landing Page displays the static 'Ruang lingkup pemeriksaan' card with three factual inspection scopes", async () => {
    window.history.replaceState(null, "", "#landing");
    let sitesApiCalled = false;
    fetch.mockImplementation((url) => {
      const path = String(url);
      if (path.includes("/auth/session")) {
        return Promise.resolve(jsonResponse({ success: true, data: { authenticated: false } }));
      }
      if (path.includes("/api/v1/sites")) {
        sitesApiCalled = true;
        return Promise.resolve(jsonResponse({ success: true, data: { sites: [] } }));
      }
      return Promise.resolve(historyResponse);
    });

    render(<App />);
    expect(
      await screen.findByRole("heading", { name: "Ruang lingkup pemeriksaan" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Teks dan elemen HTML halaman")).toBeInTheDocument();
    expect(screen.getByText("Tautan dan pengalihan")).toBeInTheDocument();
    expect(screen.getByText("Perubahan halaman terhadap kondisi acuan")).toBeInTheDocument();
    // A4: Verifikasi bahwa Landing Page tidak memanggil API /api/v1/sites
    expect(sitesApiCalled).toBe(false);
  });

  it("Landing Page displays accurate code-backed scope methods and removes Aho-Corasick algorithm naming", async () => {
    window.history.replaceState(null, "", "#landing");
    fetch.mockImplementation((url) => {
      const path = String(url);
      if (path.includes("/auth/session")) {
        return Promise.resolve(jsonResponse({ success: true, data: { authenticated: false } }));
      }
      return Promise.resolve(historyResponse);
    });

    render(<App />);
    await screen.findByRole("heading", { name: "Ruang lingkup pemeriksaan" });

    // B2: Kolom ketiga Metode berupa teks biasa
    expect(screen.getAllByText("Pencocokan kata kunci").length).toBe(3);
    expect(screen.getByText("Aturan URL dan HTML")).toBeInTheDocument();
    expect(screen.getByText("Perbandingan dengan kondisi acuan")).toBeInTheDocument();

    // B3: Algoritma Aho-Corasick tidak boleh dicantumkan pada teks publik
    expect(screen.queryByText(/Aho-Corasick/i)).toBeNull();

    // A2: Footer memuat hak cipta dan keterangan prototipe penelitian
    expect(screen.getByText(/Prototipe Penelitian/i)).toBeInTheDocument();
    expect(screen.getByText(/Hak cipta dilindungi undang-undang/i)).toBeInTheDocument();
  });

  it("Hasil Deteksi displays Indonesian crawl failure explanations and marks status as GAGAL DIPERIKSA and detectors as DILEWATI", async () => {
    window.history.replaceState(null, "", "#ringkasan");
    const failedScanHistory = [
      {
        id: "scan-failed-1",
        url: "http://127.0.0.1:8999/unreachable.html",
        scannedAt: "2026-10-31T08:00:00.000Z",
        crawlStatus: "failed",
        httpStatus: null,
        contentType: null,
        title: null,
        crawlMetadata: {
          depth: 0,
          links: [],
          error: {
            code: "ROBOTS_UNAVAILABLE",
            message: "robots.txt could not be checked; the host was blocked.",
          },
        },
        scanSource: "MANUAL",
        textDetectionStatus: "skipped",
        textDetection: null,
        defacementDetectionStatus: "skipped",
        defacementDetection: null,
        linkDetectionStatus: "skipped",
        linkDetection: null,
      },
    ];

    fetch.mockImplementation((url) => {
      const path = String(url);
      if (path.includes("/auth/session")) {
        return Promise.resolve(sessionResponse);
      }
      if (path.includes("/api/v1/scans/recent")) {
        return Promise.resolve(jsonResponse({ success: true, data: { scans: failedScanHistory } }));
      }
      if (path.includes("/api/v1/sites")) {
        return Promise.resolve(jsonResponse({ success: true, data: { sites: [] } }));
      }
      if (path.includes("/api/v1/schedules")) {
        return Promise.resolve(jsonResponse({ success: true, data: { schedules: [] } }));
      }
      return Promise.resolve(historyResponse);
    });

    render(<App />);
    await screen.findByRole("heading", { name: "Ringkasan", level: 1 });

    navigateTo("Hasil Deteksi");
    await waitFor(() => {
      expect(screen.getByText("CRAWL ERROR")).toBeInTheDocument();
      expect(screen.getByText("GAGAL DIPERIKSA")).toBeInTheDocument();
      expect(
        screen.getByText(/Pemeriksaan robots\.txt gagal: Host target tidak dapat dijangkau/i),
      ).toBeInTheDocument();
      expect(screen.getAllByText("DILEWATI").length).toBeGreaterThanOrEqual(3);
      expect(screen.queryByText("TIDAK DITEMUKAN INDIKASI")).not.toBeInTheDocument();
    });
  });
});
