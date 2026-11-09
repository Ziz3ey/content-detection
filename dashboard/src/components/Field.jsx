import React, { createContext, useContext, useId } from "react";

/**
 * FIELD & FORM CONTEXT COMPONENT
 *
 * Props Field:
 * - label: string (teks label form)
 * - id: string (opsional, otomatis dibuatkan useId bila kosong)
 * - hint: string | ReactNode (teks bantuan di bawah kontrol)
 * - error: string | ReactNode (pesan galat, mengubah status anak menjadi invalid)
 * - required: boolean (menampilkan tanda wajib diisi yang dapat diakses pembaca layar)
 * - optional: boolean (menampilkan tanda '(opsional)' bila tidak wajib)
 * - className: string
 * - children: ReactNode
 */

export const FieldContext = createContext(null);

export function useField() {
  return useContext(FieldContext);
}

export function Field({
  label,
  id: customId,
  hint,
  error,
  required = false,
  optional = false,
  className = "",
  children,
  ...rest
}) {
  const generatedId = useId();
  const id = customId || `field-${generatedId}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const contextValue = {
    id,
    hintId,
    errorId,
    describedBy,
    isInvalid: Boolean(error),
    required,
  };

  return (
    <FieldContext.Provider value={contextValue}>
      <div className={`ui-field ${error ? "has-error" : ""} ${className}`} {...rest}>
        {label && (
          <label htmlFor={id} className="ui-field__label">
            <span className="ui-field__label-text">{label}</span>
            {required && (
              <span className="ui-field__required" aria-hidden="true">
                *
                <span className="ui-sr-only"> (wajib diisi)</span>
              </span>
            )}
            {optional && !required && (
              <span className="ui-field__optional" aria-hidden="true">
                (opsional)
              </span>
            )}
          </label>
        )}

        <div className="ui-field__control">{children}</div>

        {hint && (
          <p id={hintId} className="ui-field__hint">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} className="ui-field__error" role="alert">
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}

export default Field;
