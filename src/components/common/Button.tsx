import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  // Since we rely on global CSS classes (btn-primary, btn-secondary, btn-ghost) 
  // for the redesign, we map variants to those classes to maintain compatibility
  let variantClass = 'btn-primary';
  if (variant === 'secondary') variantClass = 'btn-secondary';
  if (variant === 'ghost') variantClass = 'btn-ghost';
  
  // Custom variants for danger/success
  const isDanger = variant === 'danger';
  const isSuccess = variant === 'success';

  let inlineStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    width: fullWidth ? '100%' : 'auto',
    opacity: isDisabled ? 0.6 : 1,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    ...props.style,
  };

  if (isDanger) {
    inlineStyle.background = 'var(--danger)';
    inlineStyle.color = '#fff';
    inlineStyle.border = 'none';
  } else if (isSuccess) {
    inlineStyle.background = '#25D366'; // WhatsApp Green
    inlineStyle.color = '#fff';
    inlineStyle.border = 'none';
  }

  // Handle sizes using padding
  if (size === 'sm') {
    inlineStyle.padding = '0.5rem 1rem';
    inlineStyle.fontSize = '0.85rem';
  } else if (size === 'md') {
    inlineStyle.padding = '0.75rem 1.5rem';
    inlineStyle.fontSize = '0.95rem';
  } else if (size === 'lg') {
    inlineStyle.padding = '1rem 2rem';
    inlineStyle.fontSize = '1.05rem';
  }

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`${isDanger || isSuccess ? 'focus-ring' : variantClass} ${className}`}
      style={inlineStyle}
    >
      {isLoading ? (
        <>
          <svg
            style={{ width: size === 'sm' ? 14 : 16, height: size === 'sm' ? 14 : 16, animation: 'spin 1s linear infinite' }}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              opacity="0.75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          <span>Loading…</span>
        </>
      ) : (
        <>
          {leftIcon && <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{leftIcon}</span>}
          {children}
          {rightIcon && <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
