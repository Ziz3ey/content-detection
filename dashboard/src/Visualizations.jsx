import React, { useMemo, useState } from "react";
import { CircleCheck, Info } from "lucide-react";
import tokens from "./styles/tokens.js";

export function formatCategoryName(rawLabel = "") {
  const lower = rawLabel.toLowerCase();
  if (lower.includes("judi") || lower.includes("gambling")) return "Judi online";
  if (lower.includes("porno")) return "Pornografi";
  if (lower.includes("tipu") || lower.includes("fraud") || lower.includes("phishing")) return "Penipuan";
  if (lower.includes("tautan") || lower.includes("link") || lower.includes("suspicious")) return "Tautan mencurigakan";
  if (lower.includes("perubahan") || lower.includes("deface")) return "Perubahan halaman";
  return rawLabel;
}

export function getCategoryColor(rawLabel = "") {
  const lower = rawLabel.toLowerCase();
  if (lower.includes("judi") || lower.includes("gambling")) return "var(--color-cat-gambling, #8F2D56)";
  if (lower.includes("porno")) return "var(--color-cat-pornography, #5B3F8C)";
  if (lower.includes("tipu") || lower.includes("fraud") || lower.includes("phishing")) return "var(--color-cat-fraud, #945E00)";
  if (lower.includes("tautan") || lower.includes("link") || lower.includes("suspicious")) return "var(--color-cat-link, #0F6B7A)";
  if (lower.includes("perubahan") || lower.includes("deface")) return "var(--color-cat-defacement, #B3261E)";
  return "var(--color-primary, #1A365D)";
}

export function BarChart({
  data = [],
  height = 190,
  ariaLabelledBy,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const hasValues =
    Array.isArray(data) && data.length > 0 && data.some((d) => (d.value || 0) > 0);

  const values = data.map((d) => d.value || 0);
  const maxVal = Math.max(...values, 0);
  const max = Math.max(maxVal, 4);
  const width = 500;
  const paddingLeft = 36;
  const paddingRight = 16;
  const paddingTop = 32;
  const paddingBottom = 32;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;
  const slotWidth = data.length > 0 ? plotWidth / data.length : plotWidth;
  const barWidth = Math.min(32, Math.max(18, slotWidth * 0.52));

  // Integer Y-axis ticks
  const midTick = Math.ceil(max / 2);
  const yTicks = [0, midTick, max];

  return (
    <div className="ov-chart-container">
      {/* Visually hidden accessible data table */}
      <table className="sr-only" aria-label="Aktivitas pemindaian, 7 hari terakhir">
        <caption>Aktivitas pemindaian, 7 hari terakhir</caption>
        <thead>
          <tr>
            <th scope="col">Hari</th>
            <th scope="col">Jumlah Pemindaian</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={item.label || idx}>
              <td>{item.label}</td>
              <td>{item.value || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <svg
        className="ov-bar-chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height={height}
        role="region"
        aria-labelledby={ariaLabelledBy}
      >
        {/* Horizontal grid lines & y-axis integer labels */}
        {yTicks.map((tick, idx) => {
          const y = paddingTop + plotHeight - (tick / max) * plotHeight;
          return (
            <g key={`tick-${tick}-${idx}`} className="ov-chart-grid-line">
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="var(--color-border-subtle, #E5E7EB)"
                strokeDasharray={tick === 0 ? "none" : "3,3"}
                strokeWidth={tick === 0 ? "1.5" : "1"}
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                textAnchor="end"
                fontSize={12}
                fill="var(--color-text-tertiary, #6B7280)"
                fontWeight="500"
                fontFamily="var(--font-mono, monospace)"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Empty state centered text if no activity */}
        {!hasValues && (
          <text
            x={width / 2}
            y={paddingTop + plotHeight / 2 + 4}
            textAnchor="middle"
            fontSize={12}
            fill="var(--color-text-tertiary, #6B7280)"
            className="ov-chart-empty-text"
          >
            Belum ada pemindaian dalam 7 hari terakhir.
          </text>
        )}

        {/* Bars and labels */}
        {data.map((item, index) => {
          const val = item.value || 0;
          const barHeight = val > 0 ? Math.max(6, (val / max) * plotHeight) : 2;
          const x = paddingLeft + index * slotWidth + (slotWidth - barWidth) / 2;
          const y = paddingTop + plotHeight - barHeight;
          const centerX = x + barWidth / 2;
          const isHovered = hoveredIndex === index;
          const isToday = index === data.length - 1;

          // Solid primary or primary-hover for today
          const barFill = val > 0
            ? isToday
              ? "var(--color-primary-hover, #10233D)"
              : "var(--color-primary, #1A365D)"
            : "var(--color-border, #E5E7EB)";

          return (
            <g
              key={item.label || index}
              tabIndex={0}
              role="img"
              aria-label={`${item.label}: ${val} pemindaian`}
              className={`ov-bar-group ${isHovered ? "is-hovered" : ""}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              style={{ cursor: "pointer", outline: "none" }}
            >
              {/* Invisible wider hit area */}
              <rect
                x={x - 6}
                y={paddingTop}
                width={barWidth + 12}
                height={plotHeight}
                fill="transparent"
              />

              {/* Bar Rect with top rounded corners rx="3" */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={val > 0 ? 3 : 1}
                className="ov-bar-rect"
                fill={barFill}
              />

              {/* Top value */}
              {val > 0 && (
                <text
                  x={centerX}
                  y={y - 7}
                  textAnchor="middle"
                  className="ov-bar-value"
                  fontSize={12}
                  fontWeight={isHovered ? "700" : "600"}
                  fill={isHovered ? "var(--color-primary-hover, #10233D)" : "var(--color-text, #111827)"}
                  fontFamily="var(--font-mono, monospace)"
                >
                  {val}
                </text>
              )}

              {/* X axis Day label */}
              <text
                x={centerX}
                y={paddingTop + plotHeight + 18}
                textAnchor="middle"
                className="ov-bar-label"
                fontSize={12}
                fontWeight={isHovered || isToday ? "600" : "500"}
                fill={
                  isHovered
                    ? "var(--color-primary-hover, #10233D)"
                    : isToday
                      ? "var(--color-text, #111827)"
                      : "var(--color-text-secondary, #4B5563)"
                }
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip / hint */}
      <div className="ov-chart-footer-hint" aria-live="polite">
        {!hasValues ? (
          <span className="ov-hint-text">
            <Info size={13} aria-hidden="true" /> Belum ada pemindaian dalam 7 hari terakhir.
          </span>
        ) : hoveredIndex !== null && data[hoveredIndex] ? (
          <span className="ov-hint-text">
            <strong>{data[hoveredIndex].label}</strong>: {data[hoveredIndex].value || 0} pemindaian
          </span>
        ) : (
          <span className="ov-hint-text">
            Arahkan kursor atau fokus pada diagram untuk melihat rincian pemindaian.
          </span>
        )}
      </div>
    </div>
  );
}

export function DonutChart({
  data = [],
  size = 190,
  ariaLabelledBy,
}) {
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const total = useMemo(
    () => data.reduce((sum, d) => sum + (d.value || 0), 0),
    [data],
  );

  // Accessible data table
  const accessibleTable = (
    <table className="sr-only" aria-label="Sebaran kategori temuan">
      <caption>Sebaran kategori temuan</caption>
      <thead>
        <tr>
          <th scope="col">Kategori</th>
          <th scope="col">Jumlah</th>
          <th scope="col">Persentase</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, idx) => {
          const val = item.value || 0;
          const pct = total > 0 ? Math.round((val / total) * 100) : 0;
          return (
            <tr key={item.label || idx}>
              <td>{formatCategoryName(item.label)}</td>
              <td>{val}</td>
              <td>{pct}%</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  // Zero findings state: CircleCheck icon and text (no empty ring or green box)
  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="ov-donut-wrapper ov-donut-empty-container">
        {accessibleTable}
        <div className="ov-donut-empty">
          <CircleCheck size={20} className="ov-donut-empty-icon" aria-hidden="true" />
          <p className="ov-donut-empty-text">
            Tidak ada temuan pada riwayat pemindaian terbaru.
          </p>
        </div>
      </div>
    );
  }

  // Ring dimensions: radius 68, strokeWidth 12 (~17% of radius)
  const radius = 68;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius; // ~427.2566
  const gap = data.length > 1 ? 2 : 0; // 2px separator between segments

  let accumulated = 0;
  const slices = data.map((item) => {
    const val = item.value || 0;
    const rawDash = (val / total) * circumference;
    const dash = Math.max(0, rawDash - gap);
    const offset = -(accumulated / total) * circumference;
    accumulated += val;
    return {
      ...item,
      val,
      color: getCategoryColor(item.label),
      displayName: formatCategoryName(item.label),
      dash: `${dash} ${circumference - dash}`,
      offset,
    };
  });

  const centerValue = hoveredCategory ? hoveredCategory.value : total;
  const centerLabel = "temuan";

  return (
    <div className="ov-donut-wrapper">
      {accessibleTable}
      <div className="ov-donut-svg-holder">
        <svg
          className="ov-donut-chart-svg"
          viewBox="0 0 200 200"
          width={size}
          height={size}
          role="region"
          aria-labelledby={ariaLabelledBy}
        >
          {/* Background track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--color-border-subtle, #E5E7EB)"
            strokeWidth={strokeWidth}
          />
          {/* Segments */}
          {slices.map((slice, i) => {
            const isHovered =
              hoveredCategory && hoveredCategory.label === slice.label;
            return (
              <circle
                key={slice.label || i}
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={slice.dash}
                strokeDashoffset={slice.offset}
                transform="rotate(-90 100 100)"
                className="ov-donut-slice"
                onMouseEnter={() => setHoveredCategory(slice)}
                onMouseLeave={() => setHoveredCategory(null)}
                style={{
                  cursor: "pointer",
                  transition: "opacity 0.15s ease, stroke-width 0.15s ease",
                  opacity:
                    hoveredCategory && hoveredCategory.label !== slice.label
                      ? 0.4
                      : 1,
                }}
              />
            );
          })}
          {/* Center count & label */}
          <text
            x="100"
            y="98"
            textAnchor="middle"
            fontSize="26"
            fontWeight="700"
            fill="var(--color-text, #111827)"
            fontFamily="var(--font-mono, monospace)"
          >
            {centerValue}
          </text>
          <text
            x="100"
            y="118"
            textAnchor="middle"
            fontSize="12"
            fontWeight="500"
            fill="var(--color-text-tertiary, #6B7280)"
          >
            {centerLabel}
          </text>
        </svg>
      </div>

      {/* Focusable legend list */}
      <ul className="ov-donut-legend" role="list">
        {data.map((item, idx) => {
          const val = item.value || 0;
          const pct = total > 0 ? Math.round((val / total) * 100) : 0;
          const isHovered =
            hoveredCategory && hoveredCategory.label === item.label;
          const displayName = formatCategoryName(item.label);
          const color = getCategoryColor(item.label);

          return (
            <li
              key={item.label || idx}
              tabIndex={0}
              role="button"
              aria-label={`${displayName}: ${val} (${pct}%)`}
              className={`ov-donut-legend-item ${isHovered ? "is-hovered" : ""}`}
              onMouseEnter={() => setHoveredCategory(item)}
              onMouseLeave={() => setHoveredCategory(null)}
              onFocus={() => setHoveredCategory(item)}
              onBlur={() => setHoveredCategory(null)}
            >
              <span
                className="ov-donut-legend-swatch"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <span className="ov-donut-legend-label">{displayName}</span>
              <span className="ov-donut-legend-val">
                {val} <span className="ov-donut-legend-pct">({pct}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Visualizations({
  type = "activity",
  title = "",
  data = [],
  cardTitleId,
}) {
  return (
    <div className={`ov-visualizations ov-visualizations--${type}`}>
      {title && <h4 className="ov-visualizations-title">{title}</h4>}
      <div className="ov-visualizations-body">
        {type === "activity" && (
          <BarChart
            data={data}
            height={190}
            ariaLabelledBy={cardTitleId}
          />
        )}
        {(type === "distribution" || type === "status") && (
          <DonutChart
            data={data}
            size={190}
            ariaLabelledBy={cardTitleId}
          />
        )}
      </div>
    </div>
  );
}

export default Visualizations;
