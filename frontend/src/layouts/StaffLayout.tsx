import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Logo from '@/components/common/Logo';
import { useAuth } from '@/hooks/useAuth';
import NotificationDropdown from '@/components/common/NotificationDropdown';
import { ROUTES } from '@/constants';

interface StaffLayoutProps {
  shopType?: 'canteen' | 'bookstore';
}

/**
 * StaffLayout — premium app shell for authenticated staff.
 * Auth protection handled by ProtectedRoute in route config.
 */
export default function StaffLayout({ shopType }: StaffLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const shopLabel = shopType === 'canteen'
    ? 'Canteen'
    : shopType === 'bookstore'
    ? 'Bookstore'
    : 'Staff';

  const shopEmoji = shopType === 'canteen' ? '🍽️' : shopType === 'bookstore' ? '📚' : '🏪';
  const shopColor = shopType === 'canteen' ? '#10D98A' : shopType === 'bookstore' ? '#3B82F6' : '#6366F1';
  const shopBg    = shopType === 'canteen' ? 'rgba(16,217,138,0.10)' : shopType === 'bookstore' ? 'rgba(59,130,246,0.10)' : 'rgba(99,102,241,0.10)';
  const shopBorder= shopType === 'canteen' ? 'rgba(16,217,138,0.25)' : shopType === 'bookstore' ? 'rgba(59,130,246,0.25)' : 'rgba(99,102,241,0.25)';

  useEffect(() => {
    if (drawerOpen) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }
    return () => document.body.classList.remove('drawer-open');
  }, [drawerOpen]);

  useEffect(() => { setTimeout(() => setDrawerOpen(false), 0); }, [location.pathname]);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  async function handleLogout() {
    closeDrawer();
    await logout();
  }

  const staffNavLinks = [
    ...(shopType === 'canteen'    ? [{ to: ROUTES.STAFF_CANTEEN,    label: 'Dashboard', icon: '📊' }] : []),
    ...(shopType === 'bookstore'  ? [{ to: ROUTES.STAFF_BOOKSTORE,  label: 'Dashboard', icon: '📊' }] : []),
    { to: ROUTES.STAFF_RESERVATIONS, label: 'Reservations', icon: '📋' },
  ];

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'S';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(9,10,15,0.82)',
        }}
      >
        <div
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
          <Link to="/" aria-label="CampusOne home" style={{ flexShrink: 0 }}>
            <Logo size="sm" />
          </Link>

          {/* Shop badge */}
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: shopColor,
              background: shopBg,
              border: `1px solid ${shopBorder}`,
              padding: '0.3rem 0.875rem',
              borderRadius: '9999px',
              letterSpacing: '0.03em',
              whiteSpace: 'nowrap',
            }}
          >
            {shopEmoji} {shopLabel}
          </span>

          {/* Desktop nav */}
          <nav className="hide-mobile" style={{ alignItems: 'center', gap: '0.25rem', flex: 1, justifyContent: 'center' }}>
            {staffNavLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                style={{
                  padding: '0.4rem 0.875rem',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: location.pathname === to ? shopColor : 'var(--text-muted)',
                  background: location.pathname === to ? shopBg : 'transparent',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <NotificationDropdown />

            {/* Avatar */}
            <div
              className="btn-icon hide-mobile"
              style={{
                background: shopBg,
                border: `1px solid ${shopBorder}`,
                color: shopColor,
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'default',
              }}
            >
              {userInitial}
            </div>

            {/* Sign out — desktop */}
            <button
              className="btn-ghost hide-mobile"
              onClick={handleLogout}
              style={{ fontSize: '0.875rem', color: '#FCA5A5' }}
            >
              Sign Out
            </button>

            {/* Hamburger — mobile */}
            <button
              className="btn-icon hide-desktop"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main style={{ flex: 1 }}>
        <div className="page-container">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile Drawer ── */}
      {drawerOpen && (
        <>
          <div className="overlay" onClick={closeDrawer} aria-hidden="true" />
          <nav className="drawer" aria-label="Staff navigation">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
              <Logo size="sm" />
              <button className="btn-icon" onClick={closeDrawer} aria-label="Close" style={{ width: 36, height: 36 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Staff badge */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: shopColor, background: shopBg, border: `1px solid ${shopBorder}`, padding: '0.3rem 0.875rem', borderRadius: '9999px' }}>
                {shopEmoji} {shopLabel} Staff
              </span>
            </div>

            <div style={{ flex: 1, padding: '1rem' }}>
              {staffNavLinks.map(({ to, label, icon }, i) => (
                <Link
                  key={to}
                  to={to}
                  onClick={closeDrawer}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                    padding: '0.875rem 1rem',
                    borderRadius: 'var(--r-md)',
                    fontSize: '0.975rem',
                    fontWeight: 500,
                    color: location.pathname === to ? shopColor : 'var(--text-secondary)',
                    background: location.pathname === to ? shopBg : 'transparent',
                    marginBottom: '0.25rem',
                    transition: 'all 0.2s',
                    animation: `staggerIn 0.3s ease ${i * 0.06}s both`,
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ fontSize: '1.1rem', width: 22, textAlign: 'center' }}>{icon}</span>
                  {label}
                </Link>
              ))}
            </div>

            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--glass-border)' }}>
              <button
                onClick={handleLogout}
                style={{ width: '100%', padding: '0.875rem', borderRadius: 'var(--r-md)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#FCA5A5', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.14)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
              >
                Sign Out
              </button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
