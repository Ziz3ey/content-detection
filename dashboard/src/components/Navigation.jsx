import React, { useRef } from "react";

/**
 * NAVIGATION COMPONENTS: SEGMENTED_CONTROL & TABS
 *
 * Props SegmentedControl:
 * - items: Array<{ value: string, label: ReactNode, count?: number|string, disabled?: boolean }>
 * - value: string (nilai yang sedang aktif)
 * - onChange: function(value)
 * - size: "sm" | "md" (default: "md")
 * - role: "radiogroup" | "tablist" (default: "radiogroup")
 * - className: string
 *
 * Props Tabs:
 * - items: Array<{ id: string, label: ReactNode, icon?: LucideIcon, count?: number|string, disabled?: boolean }>
 * - activeId: string
 * - onChange: function(id)
 * - className: string
 */

export function SegmentedControl({
  items = [],
  value,
  onChange,
  size = "md",
  role = "radiogroup",
  className = "",
  ...rest
}) {
  const containerRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

    const enabledItems = items.filter((item) => !item.disabled);
    const currentIndex = enabledItems.findIndex((item) => item.value === value);
    if (currentIndex === -1) return;

    e.preventDefault();
    let nextIndex;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % enabledItems.length;
    } else {
      nextIndex = (currentIndex - 1 + enabledItems.length) % enabledItems.length;
    }

    const nextItem = enabledItems[nextIndex];
    if (nextItem && onChange) {
      onChange(nextItem.value);
      // Pindahkan fokus ke tombol baru
      const buttons = containerRef.current?.querySelectorAll("button:not([disabled])");
      if (buttons && buttons[nextIndex]) {
        buttons[nextIndex].focus();
      }
    }
  };

  const isRadio = role === "radiogroup";

  return (
    <div
      ref={containerRef}
      role={role}
      className={["ui-segmented-control", `ui-segmented-control--${size}`, className]
        .filter(Boolean)
        .join(" ")}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {items.map((item) => {
        const isSelected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            disabled={item.disabled}
            role={isRadio ? "radio" : "tab"}
            aria-checked={isRadio ? isSelected : undefined}
            aria-selected={!isRadio ? isSelected : undefined}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => !item.disabled && onChange?.(item.value)}
            className={[
              "ui-segmented-control__item",
              isSelected ? "is-selected" : "",
              item.disabled ? "is-disabled" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="ui-segmented-control__label">{item.label}</span>
            {item.count !== undefined && (
              <span className="ui-segmented-control__count">{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Tabs({
  items = [],
  activeId,
  onChange,
  className = "",
  ...rest
}) {
  const listRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

    const enabledItems = items.filter((item) => !item.disabled);
    const currentIndex = enabledItems.findIndex((item) => item.id === activeId);
    if (currentIndex === -1) return;

    e.preventDefault();
    let nextIndex;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % enabledItems.length;
    } else {
      nextIndex = (currentIndex - 1 + enabledItems.length) % enabledItems.length;
    }

    const nextItem = enabledItems[nextIndex];
    if (nextItem && onChange) {
      onChange(nextItem.id);
      const tabs = listRef.current?.querySelectorAll('[role="tab"]:not([disabled])');
      if (tabs && tabs[nextIndex]) {
        tabs[nextIndex].focus();
      }
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      className={`ui-tabs ${className}`}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {items.map((item) => {
        const isSelected = item.id === activeId;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-controls={`panel-${item.id}`}
            aria-selected={isSelected}
            disabled={item.disabled}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => !item.disabled && onChange?.(item.id)}
            className={[
              "ui-tab-item",
              isSelected ? "is-active" : "",
              item.disabled ? "is-disabled" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {Icon && (
              <span className="ui-tab-item__icon" aria-hidden="true">
                {React.isValidElement(Icon) ? Icon : <Icon size={16} />}
              </span>
            )}
            <span className="ui-tab-item__label">{item.label}</span>
            {item.count !== undefined && (
              <span className="ui-tab-item__count">{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
