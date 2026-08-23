import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants';
import Button from '@/components/common/Button';

interface PlaceholderPageProps {
  title: string;
  description: string;
  backTo?: string;
  backLabel?: string;
}

/** Reusable placeholder for pages not yet implemented */
export default function PlaceholderPage({ title, description, backTo = ROUTES.HOME, backLabel = 'Go Home' }: PlaceholderPageProps) {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.5rem',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)' }}>{title}</h1>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: 400, lineHeight: 1.7 }}>{description}</p>

      <div
        style={{
          marginTop: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 8,
          color: '#F59E0B',
          fontSize: '0.8rem',
          fontWeight: 500,
        }}
      >
        🚧 Coming in a future phase
      </div>

      <Link to={backTo} style={{ marginTop: '0.5rem' }}>
        <Button variant="secondary" size="sm">← {backLabel}</Button>
      </Link>
    </div>
  );
}
