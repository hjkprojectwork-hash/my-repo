import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Logo from '@/components/common/Logo';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';

/**
 * MainLayout — public-facing layout (landing + auth pages).
 * Features premium mobile drawer with staggered animations.
 */
export default function MainLayout() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  /** Resolve the correct "go to app" link based on role */
  function getAppLink(): { to: string; label: string } {
    if (!user) return { to: ROUTES.REGISTER, label: 'Get Started' };
    if (user.role === 'student') return { to: ROUTES.DASHBOARD, label: 'Home' };
    if (user.role === 'canteen_staff') return { to: ROUTES.STAFF_CANTEEN, label: 'Staff Dashboard' };
    return { to: ROUTES.STAFF_BOOKSTORE, label: 'Staff Dashboard' };
  }
  const appLink = getAppLink();

  // Lock body scroll when drawer open
  useEffect(() => {
    if (drawerOpen) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }
    return () => document.body.classList.remove('drawer-open');
  }, [drawerOpen]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  async function handleLogout() {
    closeDrawer();
    await logout();
  }

  const navLinks = isAuthenticated
    ? [{ to: appLink.to, label: appLink.label }]
    : [
        { to: ROUTES.HOME, label: 'Home' },
        { to: ROUTES.LOGIN, label: 'Sign In' },
        { to: ROUTES.REGISTER, label: 'Get Started' },
        { to: ROUTES.LOGIN_STAFF, label: 'Staff Login' },
      ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Navbar ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(9,10,15,0.75)',
        }}
      >
        <nav
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 1.25rem',
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          {/* Logo */}
          <Link to={ROUTES.HOME} aria-label="CampusOne home" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <Logo size="sm" />
          </Link>

          {/* Desktop right actions */}
          <div className="hide-mobile" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', alignItems: 'center' }}>
            {isAuthenticated ? (
              <>
                <Link to={appLink.to}>
                  <button style={{ background: '#6366F1', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', fontSize: '0.875rem', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer' }}>
                    {appLink.label}
                  </button>
                </Link>
                <button className="btn-ghost" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }} onClick={handleLogout}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to={ROUTES.LOGIN}>
                  <button className="btn-ghost" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', borderRadius: '9999px', color: '#fff' }}>Sign In</button>
                </Link>
                <Link to={ROUTES.REGISTER}>
                  <button style={{ background: '#6366F1', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', fontSize: '0.875rem', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)' }}>
                    Get Started
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="btn-icon hide-desktop"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </nav>
      </header>

      {/* ── Main content ── */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* ── Mobile Drawer Overlay + Drawer ── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="overlay"
            onClick={closeDrawer}
            aria-hidden="true"
          />

          {/* Drawer */}
          <nav
            className="drawer"
            aria-label="Navigation menu"
          >
            {/* Drawer header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
              <Logo size="sm" />
              <button
                className="btn-icon"
                onClick={closeDrawer}
                aria-label="Close menu"
                style={{ width: 36, height: 36 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <div style={{ flex: 1, padding: '1.25rem 1rem' }}>
              {navLinks.map((link, i) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeDrawer}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.875rem 1rem',
                    borderRadius: 'var(--r-md)',
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: location.pathname === link.to ? 'var(--accent)' : 'var(--text-secondary)',
                    background: location.pathname === link.to ? 'var(--accent-subtle)' : 'transparent',
                    marginBottom: '0.25rem',
                    transition: 'all 0.2s',
                    animation: `staggerIn 0.3s ease ${i * 0.06}s both`,
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Drawer bottom */}
            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--glass-border)' }}>
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    borderRadius: 'var(--r-md)',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: '#FCA5A5',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  Sign Out
                </button>
              ) : (
                <Link to={ROUTES.REGISTER} onClick={closeDrawer}>
                  <button className="btn-primary" style={{ width: '100%', borderRadius: 'var(--r-md)' }}>
                    Get Started
                  </button>
                </Link>
              )}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
