import { type InputHTMLAttributes, type ReactNode, useState } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  /** If true, shows a password visibility toggle button */
  isPassword?: boolean;
}

export default function FormInput({
  label,
  error,
  hint,
  leftIcon,
  isPassword = false,
  id,
  type,
  ...props
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      {/* Label */}
      <label
        htmlFor={inputId}
        style={{
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </label>

      {/* Input wrapper */}
      <div style={{ position: 'relative' }}>
        {leftIcon && (
          <span
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            {leftIcon}
          </span>
        )}

        <input
          id={inputId}
          type={resolvedType}
          className="input-glass focus-ring"
          style={{
            width: '100%',
            paddingLeft: leftIcon ? '2.75rem' : '1rem',
            paddingRight: isPassword ? '3rem' : '1rem',
            borderColor: error ? 'var(--danger)' : undefined,
          }}
          {...props}
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((v) => !v)}
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: '0.25rem',
              zIndex: 2,
            }}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Error or hint */}
      {error ? (
        <p
          role="alert"
          style={{ fontSize: '0.8rem', color: 'var(--danger)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
        >
          <span aria-hidden="true">⚠</span> {error}
        </p>
      ) : hint ? (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
