import React, { useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, HelpCircle } from "lucide-react";
import { Button } from "./Button.jsx";

/**
 * MODAL & CONFIRM_DIALOG COMPONENTS
 *
 * Props Modal:
 * - open: boolean
 * - onClose: function
 * - title: ReactNode
 * - size: "sm" | "md" | "lg" (default: "md")
 * - closeOnBackdropClick: boolean (default: true)
 * - closeOnEsc: boolean (default: true)
 * - footer: ReactNode
 * - children: ReactNode
 * - className: string
 *
 * Props ConfirmDialog:
 * - open: boolean
 * - title: ReactNode
 * - description: ReactNode
 * - confirmLabel: string (default: "Konfirmasi")
 * - cancelLabel: string (default: "Batal")
 * - tone: "default" | "danger" (default: "default")
 * - busy: boolean
 * - onConfirm: function
 * - onCancel: function
 */

export function Modal({
  open = false,
  onClose,
  title,
  size = "md",
  closeOnBackdropClick = true,
  closeOnEsc = true,
  footer,
  className = "",
  children,
}) {
  const modalRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);
  const titleId = useId();

  // Simpan elemen pemicu saat modal dibuka untuk dikembalikan saat ditutup
  useEffect(() => {
    if (open) {
      previouslyFocusedElementRef.current = document.activeElement;

      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Pindahkan fokus ke dalam modal
      const timer = setTimeout(() => {
        if (modalRef.current) {
          const focusable = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          } else {
            modalRef.current.focus();
          }
        }
      }, 30);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
        if (previouslyFocusedElementRef.current?.focus) {
          previouslyFocusedElementRef.current.focus();
        }
      };
    }
  }, [open]);

  // Keyboard navigation: Escape & Focus Trap
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (closeOnEsc && e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );

        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === modalRef.current) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, closeOnEsc, onClose]);

  if (!open) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose?.();
    }
  };

  return createPortal(
    <div
      className="ui-modal-backdrop"
      onClick={handleBackdropClick}
      data-testid="modal-backdrop"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={["ui-modal", `ui-modal--${size}`, className].filter(Boolean).join(" ")}
      >
        <div className="ui-modal__header">
          {title && (
            <h3 id={titleId} className="ui-modal__title">
              {title}
            </h3>
          )}
          {onClose && (
            <button
              type="button"
              className="ui-modal__close-btn"
              onClick={onClose}
              aria-label="Tutup dialog"
              title="Tutup dialog"
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="ui-modal__body">{children}</div>

        {footer && <div className="ui-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open = false,
  title = "Konfirmasi Tindakan",
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  tone = "default",
  busy = false,
  onConfirm,
  onCancel,
}) {
  const cancelBtnRef = useRef(null);

  // Khusus tone danger: default fokus pada tombol batal agar aman dari salah tekan
  useEffect(() => {
    if (open && tone === "danger") {
      const timer = setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, tone]);

  const IconComponent = tone === "danger" ? AlertTriangle : HelpCircle;

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onCancel}
      size="sm"
      className="ui-confirm-dialog"
      footer={
        <div className="ui-confirm-dialog__actions">
          <Button
            ref={cancelBtnRef}
            variant="secondary"
            size="md"
            disabled={busy}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            size="md"
            loading={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="ui-confirm-dialog__content">
        <div className={`ui-confirm-dialog__icon-wrap ui-confirm-dialog__icon-wrap--${tone}`} aria-hidden="true">
          <IconComponent size={22} />
        </div>
        <div className="ui-confirm-dialog__text">
          <h4 className="ui-confirm-dialog__title">{title}</h4>
          {description && (
            <p className="ui-confirm-dialog__desc">{description}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default Modal;
