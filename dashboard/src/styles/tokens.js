/**
 * CONTENT DETECTION — INSTITUTIONAL DESIGN TOKENS (JS EXPORT)
 *
 * Nilai token JavaScript untuk digunakan pada:
 * - Komponen SVG Chart (Visualizations.jsx)
 * - Generator Laporan Dokumen PDF (reportExporter.js)
 * - Komponen Dialog/Modal (Modal.jsx)
 *
 * PENTING: Nilai warna dalam file ini harus selalu sinkron dengan
 * deklarasi CSS di `dashboard/src/styles/tokens.css`.
 */

export const tokens = {
  // ── Warna Netral ──
  bg: "#F1F3F6",
  surface: "#FFFFFF",
  surfaceMuted: "#F7F8FA",
  border: "#D5DAE1",
  borderSubtle: "#E6E9EE",
  text: "#111C2E",
  textSecondary: "#3F4B5E",
  textTertiary: "#5B6677",
  textDisabled: "#8A94A3",

  // ── Warna Merek (Primary) ──
  primary: "#0F3D7A",
  primaryHover: "#0B3063",
  primaryActive: "#082549",
  primarySoft: "#E8EFF8",
  primaryBorder: "#BFD0E8",
  onPrimary: "#FFFFFF",
  sidebar: "#0B1F3A",
  sidebarHover: "#12294B",
  sidebarActive: "#1A3A66",
  sidebarText: "#C9D3E3",
  focusRing: "#2F6FD0",
  overlay: "rgba(11, 31, 58, 0.55)",

  // ── Aksen Daerah (Penanda Khas Instansi) ──
  accent: "#945E00",
  accentOnDark: "#F59E0B",
  accentSoft: "#FBF1DC",

  // ── Status Fungsional ──
  danger: "#B3261E",
  dangerHover: "#991B1B",
  dangerActive: "#7F1D1D",
  dangerSoft: "#FCEBEA",
  dangerBorder: "#F0B8B4",

  warning: "#8A5A00",
  warningSoft: "#FFF4D6",
  warningBorder: "#EBD08A",

  success: "#1E6B3A",
  successSoft: "#E6F3EA",
  successBorder: "#A9D3B6",

  info: "#0F3D7A",
  infoSoft: "#E8EFF8",
  infoBorder: "#BFD0E8",

  // ── Kategori Deteksi Insiden ──
  categories: {
    gambling: "#8F2D56",
    gamblingSoft: "#FDF2F7",
    gamblingBorder: "#F4B8D1",
    fraud: "#945E00",
    pornography: "#5B3F8C",
    pornographySoft: "#F5F0FB",
    pornographyBorder: "#D8C7ED",
    link: "#0F6B7A",
    linkSoft: "#E6F6F8",
    linkBorder: "#A7DDE3",
    defacement: "#B3261E",
  },

  // ── Tipografi ──
  typography: {
    xs: "12px",
    sm: "13px",
    base: "14px",
    text15: "15px",
    md: "16px",
    lg: "18px",
    xl: "20px",
    text2xl: "24px",
    text28: "28px",
    text3xl: "30px",
    text4xl: "40px",
  },
};

/**
 * Konversi nilai string HEX (#RRGGBB) ke array [r, g, b] untuk pustaka jsPDF.
 */
export function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

/**
 * Nilai RGB siap pakai untuk dokumen jsPDF (reportExporter.js)
 */
export const pdfColors = {
  headerBg: hexToRgb(tokens.sidebar),             // [11, 31, 58]
  headerSubtext: hexToRgb(tokens.sidebarText),    // [201, 211, 227]
  accentLine: hexToRgb(tokens.primary),           // [15, 61, 122]
  textMain: hexToRgb(tokens.text),                // [17, 28, 46]
  textSecondary: hexToRgb(tokens.textSecondary),  // [63, 75, 94]
  textMuted: hexToRgb(tokens.textTertiary),       // [91, 102, 119]
  border: hexToRgb(tokens.border),                // [213, 218, 225]
  borderSubtle: hexToRgb(tokens.borderSubtle),    // [230, 233, 238]
  cardBg: hexToRgb(tokens.surfaceMuted),          // [247, 248, 250]
  danger: hexToRgb(tokens.danger),                // [179, 38, 30]
  dangerSoft: hexToRgb(tokens.dangerSoft),        // [252, 235, 234]
  dangerBorder: hexToRgb(tokens.dangerBorder),    // [240, 184, 180]
  warning: hexToRgb(tokens.warning),              // [138, 90, 0]
  warningSoft: hexToRgb(tokens.warningSoft),      // [255, 244, 214]
  warningBorder: hexToRgb(tokens.warningBorder),  // [235, 208, 138]
  success: hexToRgb(tokens.success),              // [30, 107, 58]
  successSoft: hexToRgb(tokens.successSoft),      // [230, 243, 234]
  primary: hexToRgb(tokens.primary),              // [15, 61, 122]
};

export default tokens;
