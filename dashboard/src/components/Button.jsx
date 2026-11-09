import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

/**
 * BUTTON & ICON_BUTTON COMPONENT
 *
 * Props Button:
 * - variant: "primary" | "secondary" | "ghost" | "danger" (default: "primary")
 * - size: "md" | "sm" (default: "md")
 * - icon: LucideIcon component / ReactNode (opsional, diletakkan di sisi kiri)
 * - loading: boolean (menampilkan spinner, pasang aria-busy, nonaktifkan klik)
 * - disabled: boolean (status nonaktif)
 * - type: "button" | "submit" | "reset" (default: "button")
 * - as: string | Component (opsional, misal "a")
 * - href: string (bila dipakai sebagai tautan)
 * - children: ReactNode
 * - className: string
 * - onClick: function
 *
 * Props IconButton:
 * - label: string (WAJIB, menjadi aria-label & title)
 * - icon: LucideIcon component / ReactNode (WAJIB)
 * - variant: "primary" | "secondary" | "ghost" | "danger" (default: "secondary")
 * - size: "md" | "sm" (default: "md", min 36x36px)
 * - loading, disabled, type, onClick, etc.
 */

export const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    icon: Icon,
    loading = false,
    disabled = false,
    type = "button",
    as: Component = "button",
    href,
    children,
    className = "",
    onClick,
    ...rest
  },
  ref,
) {
  const isLink = href !== undefined || Component === "a";
  const Tag = isLink ? "a" : Component;
  const isDisabled = disabled || loading;

  const handleClick = (e) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    if (onClick) onClick(e);
  };

  const classNames = [
    "ui-btn",
    `ui-btn--${variant}`,
    `ui-btn--${size}`,
    loading ? "is-loading" : "",
    isDisabled ? "is-disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const linkProps = isLink
    ? {
        href: isDisabled ? undefined : href,
        role: "button",
        "aria-disabled": isDisabled ? "true" : undefined,
        tabIndex: isDisabled ? -1 : undefined,
      }
    : {
        type,
        disabled: isDisabled,
      };

  return (
    <Tag
      ref={ref}
      className={classNames}
      onClick={handleClick}
      aria-busy={loading ? "true" : undefined}
      {...linkProps}
      {...rest}
    >
      {loading ? (
        <Loader2 className="ui-btn__spinner" aria-hidden="true" size={size === "sm" ? 14 : 16} />
      ) : Icon ? (
        React.isValidElement(Icon) ? (
          Icon
        ) : (
          <Icon className="ui-btn__icon" aria-hidden="true" size={size === "sm" ? 14 : 16} />
        )
      ) : null}
      {children && <span className="ui-btn__label">{children}</span>}
    </Tag>
  );
});

export const IconButton = forwardRef(function IconButton(
  {
    label,
    icon: Icon,
    variant = "secondary",
    size = "md",
    className = "",
    ...rest
  },
  ref,
) {
  if (import.meta.env?.DEV && !label) {
    console.error("IconButton: prop 'label' wajib diisi untuk aksesibilitas (aria-label & title).");
  }

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={`ui-btn--icon-only ${className}`}
      aria-label={label}
      title={label}
      {...rest}
    >
      {React.isValidElement(Icon) ? (
        Icon
      ) : Icon ? (
        <Icon aria-hidden="true" size={size === "sm" ? 16 : 18} />
      ) : null}
    </Button>
  );
});

export default Button;
