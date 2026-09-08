import { type CSSProperties } from 'react';
import { APP_NAME } from '@/constants';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  className?: string;
  style?: CSSProperties;
}

const sizeMap = {
  sm: { icon: 26, fontSize: '1.1rem' },
  md: { icon: 34, fontSize: '1.4rem' },
  lg: { icon: 44, fontSize: '1.9rem' },
};

export default function Logo({ size = 'md', variant = 'full', className = '', style }: LogoProps) {
  const { icon, fontSize } = sizeMap[size];

  return (
    <div
      className={`flex items-center gap-2 select-none ${className}`}
      style={style}
    >
      {/* Icon mark */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10D98A" />
            <stop offset="50%" stopColor="#16C784" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        {/* Outer ring */}
        <circle cx="24" cy="24" r="21" stroke="url(#logoGrad)" strokeWidth="2.5" />
        {/* "C" arc */}
        <path
          d="M32 17C29.5 13.5 27 12 24 12C18.477 12 14 16.477 14 22C14 27.523 18.477 32 24 32C27 32 29.5 30.5 32 27"
          stroke="url(#logoGrad)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Inner accent dot */}
        <circle cx="24" cy="22" r="3.5" fill="url(#logoGrad)" />
      </svg>

      {/* Wordmark */}
      {variant === 'full' && (
        <span
          style={{
            fontSize,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #10D98A 0%, #3B82F6 80%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: "'Geist', -apple-system, sans-serif",
          }}
        >
          {APP_NAME}
        </span>
      )}
    </div>
  );
}
