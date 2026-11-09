import React, { forwardRef, useId } from "react";

/**
 * CHECKBOX COMPONENT
 *
 * Props:
 * - label: ReactNode (label yang dapat diklik)
 * - description: ReactNode (keterangan tambahan di bawah label)
 * - checked: boolean
 * - defaultChecked: boolean
 * - onChange: function
 * - disabled: boolean
 * - id: string (otomatis dibuatkan bila kosong)
 * - className: string
 */

export const Checkbox = forwardRef(function Checkbox(
  {
    label,
    description,
    checked,
    defaultChecked,
    onChange,
    disabled = false,
    id: customId,
    className = "",
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const id = customId || `checkbox-${generatedId}`;
  const descId = description ? `${id}-desc` : undefined;

  return (
    <label
      htmlFor={id}
      className={`ui-checkbox-container ${disabled ? "is-disabled" : ""} ${className}`}
    >
      <div className="ui-checkbox-box-wrapper">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={onChange}
          disabled={disabled}
          aria-describedby={descId}
          className="ui-checkbox-input"
          {...rest}
        />
        <span className="ui-checkbox-custom" aria-hidden="true" />
      </div>
      {(label || description) && (
        <div className="ui-checkbox-label-wrap">
          {label && <span className="ui-checkbox-label">{label}</span>}
          {description && (
            <span id={descId} className="ui-checkbox-description">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
});

export default Checkbox;
