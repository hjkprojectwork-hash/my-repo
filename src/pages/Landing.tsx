import { Link, Navigate } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';

export default function Landing() {
  const { user, loading } = useAuth();

  // If already logged in, go to the correct app entry point
  if (!loading && user) {
    if (user.role === 'student') return <Navigate to={ROUTES.DASHBOARD} replace />;
    if (user.role === 'canteen_staff') return <Navigate to={ROUTES.STAFF_CANTEEN} replace />;
    if (user.role === 'bookstore_staff') return <Navigate to={ROUTES.STAFF_BOOKSTORE} replace />;
  }

  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 60px)', width: '100%', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Background Image — Food vibe */}
      <div 
        className="bg-landing" 
        style={{ 
          position: 'fixed', // Use fixed to ensure it covers the viewport even if content scrolls
          inset: 0,
          backgroundImage: 'url("https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000&auto=format&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0
        }} 
        aria-hidden="true" 
      />
      {/* Dark overlay */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 7, 10, 0.72)', zIndex: 1 }} />

      {/* Main Content Area */}
      <div 
        style={{
          flex: 1,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 5%',
          position: 'relative',
          zIndex: 10,
          gap: '3rem'
        }}
      >
        
        {/* Left Side (Text & CTA) */}
        <div style={{ flex: '1 1 500px', paddingRight: '2rem' }}>
          {/* Pill Badge */}
          <div 
            className="animate-slide-up" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'rgba(59, 130, 246, 0.2)', 
              border: '1px solid rgba(59, 130, 246, 0.3)', 
              padding: '0.4rem 1rem', 
              borderRadius: '9999px',
              marginBottom: '1.5rem',
              backdropFilter: 'blur(10px)',
              color: '#60A5FA',
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.05em',
              animationDelay: '0.1s'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
              <line x1="6" y1="1" x2="6" y2="4"></line>
              <line x1="10" y1="1" x2="10" y2="4"></line>
              <line x1="14" y1="1" x2="14" y2="4"></line>
            </svg>
            CANTEEN
          </div>

          <h1 
            className="animate-slide-up" 
            style={{ 
              fontSize: 'clamp(2.75rem, 5vw, 4.5rem)', 
              fontWeight: 800, 
              lineHeight: 1.1, 
              marginBottom: '1.25rem',
              letterSpacing: '-0.02em',
              color: '#FFFFFF',
              textShadow: '0 4px 20px rgba(0,0,0,0.5)',
              animationDelay: '0.2s'
            }}
          >
            Reserve Before<br/>You Arrive.
          </h1>

          <p 
            className="animate-slide-up" 
            style={{ 
              fontSize: 'clamp(1rem, 1.5vw, 1.15rem)', 
              color: 'rgba(255,255,255,0.8)', 
              marginBottom: '3rem',
              maxWidth: 480,
              lineHeight: 1.6,
              animationDelay: '0.3s'
            }}
          >
            Reserve food, drinks, and snacks before reaching the counter. Skip the queue completely.
          </p>

          <div 
            className="animate-slide-up"
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '9999px',
              padding: '0.5rem',
              maxWidth: 500,
              backdropFilter: 'blur(16px)',
              animationDelay: '0.4s'
            }}
          >
            <input 
              type="text" 
              placeholder="Quick Reservation Search..." 
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                padding: '0.75rem 1.25rem',
                flex: 1,
                outline: 'none',
                fontSize: '0.95rem'
              }}
            />
            <Link to={ROUTES.REGISTER}>
              <button 
                style={{ 
                  background: '#6366F1', // Purple/blue pill from screenshot
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem 1.5rem', 
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
                }}
              >
                Get Started
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </Link>
          </div>
        </div>

        {/* Right Side (Stats Cards) */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          
          {/* Canteen Status */}
          <div className="glass animate-slide-up" style={{ width: '100%', maxWidth: 480, padding: '1.5rem', borderRadius: '24px', background: 'rgba(11, 12, 16, 0.65)', border: '1px solid rgba(255,255,255,0.08)', animationDelay: '0.5s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '12px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                     <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                     <line x1="6" y1="1" x2="6" y2="4"></line>
                     <line x1="10" y1="1" x2="10" y2="4"></line>
                     <line x1="14" y1="1" x2="14" y2="4"></line>
                  </svg>
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Canteen</h4>
              </div>
              <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', border: '1px solid rgba(16, 217, 138, 0.3)', background: 'rgba(16, 217, 138, 0.1)', color: '#10D98A', fontSize: '0.8rem', fontWeight: 600 }}>Open</span>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1rem' }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  Waiting
                </p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>12</h3>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1rem' }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Avg Pickup
                </p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>4 min</h3>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
