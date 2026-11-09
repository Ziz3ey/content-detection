import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { tokens } from "./tokens.js";

describe("Token Synchronization Test (tokens.css <-> tokens.js)", () => {
  it("semua token warna di tokens.js harus sinkron 1:1 dengan tokens.css", () => {
    const cssPath = path.resolve(__dirname, "tokens.css");
    const cssContent = fs.readFileSync(cssPath, "utf8");

    // Ekstrak semua deklarasi --var: value;
    const cssVars = {};
    const regex = /(--[a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;
    let match;
    while ((match = regex.exec(cssContent)) !== null) {
      cssVars[match[1]] = match[2].trim();
    }

    const mappings = [
      ["--color-bg", tokens.bg],
      ["--color-surface", tokens.surface],
      ["--color-surface-muted", tokens.surfaceMuted],
      ["--color-border", tokens.border],
      ["--color-border-subtle", tokens.borderSubtle],
      ["--color-text", tokens.text],
      ["--color-text-secondary", tokens.textSecondary],
      ["--color-text-tertiary", tokens.textTertiary],
      ["--color-text-disabled", tokens.textDisabled],

      ["--color-primary", tokens.primary],
      ["--color-primary-hover", tokens.primaryHover],
      ["--color-primary-active", tokens.primaryActive],
      ["--color-primary-soft", tokens.primarySoft],
      ["--color-primary-border", tokens.primaryBorder],
      ["--color-on-primary", tokens.onPrimary],
      ["--color-sidebar", tokens.sidebar],
      ["--color-sidebar-hover", tokens.sidebarHover],
      ["--color-sidebar-active", tokens.sidebarActive],
      ["--color-sidebar-text", tokens.sidebarText],
      ["--color-focus-ring", tokens.focusRing],
      ["--color-overlay", tokens.overlay],

      ["--color-accent", tokens.accent],
      ["--color-accent-on-dark", tokens.accentOnDark],
      ["--color-accent-soft", tokens.accentSoft],

      ["--color-danger", tokens.danger],
      ["--color-danger-hover", tokens.dangerHover],
      ["--color-danger-active", tokens.dangerActive],
      ["--color-danger-soft", tokens.dangerSoft],
      ["--color-danger-border", tokens.dangerBorder],

      ["--color-warning", tokens.warning],
      ["--color-warning-soft", tokens.warningSoft],
      ["--color-warning-border", tokens.warningBorder],

      ["--color-success", tokens.success],
      ["--color-success-soft", tokens.successSoft],
      ["--color-success-border", tokens.successBorder],

      ["--color-info", tokens.info],
      ["--color-info-soft", tokens.infoSoft],
      ["--color-info-border", tokens.infoBorder],

      ["--color-cat-gambling", tokens.categories.gambling],
      ["--color-cat-gambling-soft", tokens.categories.gamblingSoft],
      ["--color-cat-gambling-border", tokens.categories.gamblingBorder],
      ["--color-cat-fraud", tokens.categories.fraud],
      ["--color-cat-pornography", tokens.categories.pornography],
      ["--color-cat-pornography-soft", tokens.categories.pornographySoft],
      ["--color-cat-pornography-border", tokens.categories.pornographyBorder],
      ["--color-cat-link", tokens.categories.link],
      ["--color-cat-link-soft", tokens.categories.linkSoft],
      ["--color-cat-link-border", tokens.categories.linkBorder],
      ["--color-cat-defacement", tokens.categories.defacement],
    ];

    for (const [varName, jsValue] of mappings) {
      expect(
        cssVars[varName],
        `Token CSS ${varName} (${cssVars[varName]}) tidak cocok dengan tokens.js (${jsValue})`,
      ).toBe(jsValue);
    }
  });
});
