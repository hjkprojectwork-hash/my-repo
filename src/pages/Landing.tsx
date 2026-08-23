import { Link, Navigate } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/common/Logo';

/**
 * Landing Page — single viewport, cinematic, premium.
 * Redesigned to remove the long scrolling sections.
 */
export default function Landing() {
  const { user, loading } = useAuth();

  // If already logged in, go to the correct app entry point
  if (!loading && user) {
    if (user.role === 'student') return <Navigate to={ROUTES.DASHBOARD} replace />;
    if (user.role === 'canteen_staff') return <Navigate to={ROUTES.STAFF_CANTEEN} replace />;
    if (user.role === 'bookstore_staff') return <Navigate to={ROUTES.STAFF_BOOKSTORE} replace />;
  }

  return (
    <div className="has-bg-image" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
      {/* Background Image — Cinematic Campus/Food vibe */}
      <div 
        className="bg-layer" 
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1541844053589-346841d0b34c?w=1920&q=80")' }} 
        aria-hidden="true" 
      />

      <div 
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div style={{ maxWidth: 800, textAlign: 'center', width: '100%' }}>
          
          {/* Logo / Badge */}
          <div 
            className="animate-slide-up" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              padding: '0.5rem 1.25rem', 
              borderRadius: '9999px',
              marginBottom: '2.5rem',
              backdropFilter: 'blur(12px)',
              animationDelay: '0.1s'
            }}
          >
            <Logo size="sm" variant="icon" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.05em', color: '#E2E8F0' }}>
              CAMPUS RESERVATION PLATFORM
            </span>
          </div>

          {/* Headline */}
          <h1 
            className="animate-slide-up" 
            style={{ 
              fontSize: 'clamp(2.75rem, 6vw, 4.5rem)', 
              fontWeight: 800, 
              lineHeight: 1.1, 
              marginBottom: '1.25rem',
              letterSpacing: '-0.02em',
              textShadow: '0 10px 30px rgba(0,0,0,0.5)',
              animationDelay: '0.2s'
            }}
          >
            Skip the queue.<br/>
            <span className="gradient-text">Pick up faster.</span>
          </h1>

          {/* Subheadline */}
          <p 
            className="animate-slide-up" 
            style={{ 
              fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', 
              color: 'var(--text-secondary)', 
              marginBottom: '3rem',
              maxWidth: 580,
              margin: '0 auto 3rem',
              lineHeight: 1.6,
              animationDelay: '0.3s'
            }}
          >
            Reserve food, books, and campus essentials instantly without waiting in line.
          </p>

          {/* CTAs */}
          <div 
            className="animate-slide-up" 
            style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'center', 
              flexWrap: 'wrap',
              animationDelay: '0.4s'
            }}
          >
            <Link to={ROUTES.REGISTER}>
              <button 
                className="btn-primary focus-ring" 
                style={{ 
                  padding: '1.1rem 2.5rem', 
                  fontSize: '1.1rem', 
                  borderRadius: 'var(--r-full)' 
                }}
              >
                Browse Campus
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
