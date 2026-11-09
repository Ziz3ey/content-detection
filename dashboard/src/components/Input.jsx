import React, { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useField } from "./Field.jsx";

/**
 * INPUT COMPONENT
 *
 * Props:
 * - type: string (default: "text")
 * - icon: LucideIcon component / ReactNode (opsional, diletakkan di sisi kiri)
 * - invalid: boolean (menandai status error, default mewarisi dari Field)
 * - showPasswordToggle: boolean (khusus type="password", menampilkan tombol intip sandi)
 * - disabled: boolean
 * - placeholder: string
 * - className: string
 * - id, name, value, onChange, etc.
 */

export const Input = forwardRef(function Input(
  {
    type = "text",
    icon: Icon,
    invalid,
    showPasswordToggle = false,
    disabled = false,
    className = "",
    id: directId,
    "aria-describedby": directDescribedBy,
    "aria-invalid": directAriaInvalid,
    ...rest
  },
  ref,
) {
  const fieldContext = useField();
  const [showPassword, setShowPassword] = useState(false);

  const resolvedId = directId || fieldContext?.id;
  const isInvalid = invalid !== undefined ? invalid : fieldContext?.isInvalid;
  const describedBy = directDescribedBy || fieldContext?.describedBy;
  const required = fieldContext?.required;

  const actualType =
    type === "password" && showPasswordToggle
      ? showPassword
        ? "text"
        : "password"
      : type;

  const hasPrefix = Boolean(Icon);
  const hasSuffix = type === "password" && showPasswordToggle;

  const inputElement = (
    <input
      ref={ref}
      id={resolvedId}
      type={actualType}
      disabled={disabled}
      required={required}
      aria-invalid={isInvalid ? "true" : directAriaInvalid}
      aria-describedby={describedBy}
      className={[
        "ui-input",
        isInvalid ? "is-invalid" : "",
        hasPrefix ? "has-prefix" : "",
        hasSuffix ? "has-suffix" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );

  if (!hasPrefix && !hasSuffix) {
    return inputElement;
  }

  return (
    <div className={`ui-input-wrapper ${disabled ? "is-disabled" : ""} ${isInvalid ? "is-invalid" : ""}`}>
      {Icon && (
        <span className="ui-input-prefix" aria-hidden="true">
          {React.isValidElement(Icon) ? Icon : <Icon size={16} />}
        </span>
      )}
      {inputElement}
      {hasSuffix && (
        <button
          type="button"
          tabIndex={-1}
          className="ui-input-password-toggle"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  );
});

export default Input;
