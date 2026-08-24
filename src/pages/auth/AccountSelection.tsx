import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/common/Logo';

const options = [
  {
    to: ROUTES.REGISTER_STUDENT,
    icon: '🎓',
    role: 'Student',
    description: 'Reserve campus products and services before you arrive. Browse the canteen menu and bookstore items, add to cart, and collect without queuing.',
    highlight: 'For students',
    color: 'var(--accent)',
    bg: 'var(--accent-subtle)',
    border: 'rgba(16,217,138,0.25)',
  },
  {
    to: ROUTES.REGISTER_STAFF,
    icon: '🏪',
    role: 'Staff',
    description: 'Manage reservations and prepare student orders. View pending pickups, mark items as ready, and keep your stall running smoothly.',
    highlight: 'Canteen & Bookstore',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.25)',
  },
] as const;

export default function AccountSelection() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Already authenticated? Redirect to appropriate dashboard
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'student') navigate(ROUTES.DASHBOARD, { replace: true });
      else if (user.role === 'canteen_staff') navigate(ROUTES.STAFF_CANTEEN, { replace: true });
      else if (user.role === 'bookstore_staff') navigate(ROUTES.STAFF_BOOKSTORE, { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="has-bg-image" style={{ minHeight: 'calc(100vh - 60px)' }}>
      <div className="bg-layer bg-auth" />
      
      <div
        style={{
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 1.5rem',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div style={{ width: '100%', maxWidth: 720 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <Logo size="md" className="justify-center" style={{ marginBottom: '1.5rem' }} />
            <h1 className="animate-slide-up" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, marginBottom: '0.75rem' }}>
              Choose Account Type
            </h1>
            <p className="animate-slide-up" style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, animationDelay: '0.1s' }}>
              Select how you want to use CampusOne.
            </p>
          </div>

          {/* Options grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {options.map((opt, i) => (
              <Link
                key={opt.to}
                to={opt.to}
                id={`register-${opt.role.toLowerCase()}`}
                style={{ textDecoration: 'none', animation: `slideInUp 0.4s ease ${0.2 + i * 0.1}s forwards`, opacity: 0 }}
                className="group"
              >
                <div
                  className="glass-hover"
                  style={{
                    padding: '2.5rem',
                    borderRadius: 'var(--r-xl)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    cursor: 'pointer',
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'absolute', top: -30, right: -20, fontSize: '12rem', opacity: 0.03, transform: 'rotate(15deg)' }}>
                    {opt.icon}
                  </div>
                  
                  <div style={{ width: 64, height: 64, borderRadius: 'var(--r-lg)', background: opt.bg, border: `1px solid ${opt.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                    {opt.icon}
                  </div>

                  <div style={{ marginTop: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: opt.color,
                        display: 'inline-block',
                        marginBottom: '0.5rem'
                      }}
                    >
                      {opt.highlight}
                    </span>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {opt.role}
                    </h2>
                  </div>

                  <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                    {opt.description}
                  </p>

                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      color: opt.color,
                    }}
                  >
                    Continue as {opt.role}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Sign in link */}
          <p style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)', fontSize: '0.95rem', animation: 'fadeIn 0.7s ease 0.5s forwards', opacity: 0 }}>
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', marginLeft: '0.5rem' }}>
              Sign in as Student
            </Link>
            {' '}<span style={{ margin: '0 0.5rem', opacity: 0.5 }}>|</span>{' '}
            <Link to={ROUTES.LOGIN_STAFF} style={{ color: '#38BDF8', fontWeight: 600, textDecoration: 'none' }}>
              Sign in as Staff
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
