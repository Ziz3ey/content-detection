import React, { forwardRef } from "react";
import { useField } from "./Field.jsx";

/**
 * TEXTAREA COMPONENT
 *
 * Props:
 * - mono: boolean (menggunakan font IBM Plex Mono untuk input regex, URL, markup HTML)
 * - invalid: boolean (status galat, default mewarisi dari Field)
 * - disabled: boolean
 * - rows: number (default: 3)
 * - placeholder: string
 * - className: string
 * - id, name, value, onChange, etc.
 */

export const Textarea = forwardRef(function Textarea(
  {
    mono = false,
    invalid,
    disabled = false,
    rows = 3,
    className = "",
    id: directId,
    "aria-describedby": directDescribedBy,
    "aria-invalid": directAriaInvalid,
    ...rest
  },
  ref,
) {
  const fieldContext = useField();
  const resolvedId = directId || fieldContext?.id;
  const isInvalid = invalid !== undefined ? invalid : fieldContext?.isInvalid;
  const describedBy = directDescribedBy || fieldContext?.describedBy;
  const required = fieldContext?.required;

  return (
    <textarea
      ref={ref}
      id={resolvedId}
      rows={rows}
      disabled={disabled}
      required={required}
      aria-invalid={isInvalid ? "true" : directAriaInvalid}
      aria-describedby={describedBy}
      className={[
        "ui-textarea",
        mono ? "ui-textarea--mono" : "",
        isInvalid ? "is-invalid" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
});

export default Textarea;
