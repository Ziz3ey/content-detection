import React from "react";

/**
 * BRAND_MARK COMPONENT
 *
 * Menampilkan identitas resmi sistem:
 * - Mencari logo resmi secara dinamis di `../assets/brand/logo-*.{svg,png,webp}`
 * - Jika `logo-pemkab` ada, tampilkan sebagai <img> (tinggi 40px)
 * - Jika tidak ada, tampilkan monogram institusional netral: kotak 36×36px, radius 6px, latar --color-primary, berisi huruf "CD"
 *
 * Props:
 * - variant: "full" | "compact" (default: "full")
 *   - "full": logo + 2 baris teks institusional (Pemkab Sumbawa & Dinas Kominfosandi)
 *   - "compact": logo + teks "Content Detection"
 * - className: string
 */

// Cari file logo yang ada di folder assets/brand
const brandLogos = import.meta.glob("../assets/brand/logo-*.{svg,png,webp}", {
  eager: true,
});

function findPemkabLogo() {
  for (const path in brandLogos) {
    if (path.includes("logo-pemkab")) {
      return brandLogos[path]?.default || brandLogos[path];
    }
  }
  return null;
}

export function BrandMark({ variant = "full", onDark = false, className = "" }) {
  const pemkabLogoSrc = findPemkabLogo();

  const logoElement = pemkabLogoSrc ? (
    <img
      src={pemkabLogoSrc}
      alt="Lambang Pemerintah Kabupaten Sumbawa"
      className="ui-brandmark__img"
      height={40}
    />
  ) : (
    <span className="ui-brandmark__monogram" aria-hidden="true">
      CD
    </span>
  );

  return (
    <div
      className={`ui-brandmark ui-brandmark--${variant} ${onDark ? "ui-brandmark--on-dark" : ""} ${className}`}
    >
      {logoElement}
      {variant !== "icon" && (
        <div className="ui-brandmark__text-group">
          {variant === "full" ? (
            <>
              <span className="ui-brandmark__title">Pemerintah Kabupaten Sumbawa</span>
              <span className="ui-brandmark__subtitle">
                Dinas Komunikasi, Informatika, Statistik dan Persandian
              </span>
            </>
          ) : (
            <span className="ui-brandmark__compact-title">Content Detection</span>
          )}
        </div>
      )}
    </div>
  );
}

export default BrandMark;
