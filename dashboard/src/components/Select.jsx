import React, { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { useField } from "./Field.jsx";

/**
 * SELECT COMPONENT
 *
 * Props:
 * - options: Array<{ value: string|number, label: string, disabled?: boolean }> (opsional)
 * - invalid: boolean (status galat, default mewarisi dari Field)
 * - disabled: boolean
 * - children: ReactNode (opsional, elemen <option> langsung)
 * - className: string
 * - id, name, value, onChange, etc.
 */

export const Select = forwardRef(function Select(
  {
    options = [],
    invalid,
    disabled = false,
    className = "",
    children,
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
    <div className={`ui-select-wrapper ${disabled ? "is-disabled" : ""} ${isInvalid ? "is-invalid" : ""}`}>
      <select
        ref={ref}
        id={resolvedId}
        disabled={disabled}
        required={required}
        aria-invalid={isInvalid ? "true" : directAriaInvalid}
        aria-describedby={describedBy}
        className={["ui-select", isInvalid ? "is-invalid" : "", className].filter(Boolean).join(" ")}
        {...rest}
      >
        {children ||
          options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
      </select>
      <span className="ui-select-chevron" aria-hidden="true">
        <ChevronDown size={16} />
      </span>
    </div>
  );
});

export default Select;
