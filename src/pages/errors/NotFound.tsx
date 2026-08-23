import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import Logo from '@/components/common/Logo';
import { ROUTES } from '@/constants';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        background: 'var(--color-bg)',
      }}
    >
      <Logo size="md" />

      <div
        style={{
          fontSize: '8rem',
          fontWeight: 900,
          lineHeight: 1,
          marginTop: '2rem',
          background: 'linear-gradient(135deg, #6366F1, #0EA5E9)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        404
      </div>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '1rem', color: 'var(--color-text)' }}>
        Page Not Found
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginTop: '0.75rem', maxWidth: 380, lineHeight: 1.7 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>

      <Link to={ROUTES.HOME} style={{ marginTop: '2rem' }}>
        <Button variant="primary" size="lg">← Back to Home</Button>
      </Link>
    </div>
  );
}
