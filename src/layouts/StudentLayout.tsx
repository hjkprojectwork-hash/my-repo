import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import Logo from '@/components/common/Logo';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { CartProvider, useCart } from '@/contexts/CartContext';
import NotificationDropdown from '@/components/common/NotificationDropdown';

/* ─── Nav link definitions ─── */
const navItems = [
  { to: ROUTES.DASHBOARD,    label: 'Home' },
  { to: ROUTES.ITEMS,        label: 'Explore' },
  { to: ROUTES.RESERVATIONS, label: 'My Orders' },
];

const drawerItems = [
  { to: ROUTES.DASHBOARD,    label: 'Home',          icon: '🏠' },
  { to: `${ROUTES.ITEMS}?shop=canteen`,   label: 'Canteen',       icon: '🍔' },
  { to: `${ROUTES.ITEMS}?shop=bookstore`, label: 'Bookstore',     icon: '📚' },
  { to: ROUTES.CART,         label: 'Cart',          icon: '🛒' },
  { to: ROUTES.RESERVATIONS, label: 'My Orders',     icon: '📦' },
  { to: ROUTES.PROFILE,      label: 'My Profile',    icon: '👤' },
];

function StudentLayoutInner() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Close avatar dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll lock
  useEffect(() => {
    if (drawerOpen) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }
    return () => document.body.classList.remove('drawer-open');
  }, [drawerOpen]);

  // Close drawers on route change
  useEffect(() => {
    setDrawerOpen(false);
    setAvatarOpen(false);
  }, [location.pathname]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  async function handleLogout() {
    closeDrawer();
    await logout();
  }

  function isActive(path: string) {
    const [basePath, search] = path.split('?');
    if (basePath === ROUTES.DASHBOARD) return location.pathname === basePath;
    if (search) return location.pathname.startsWith(basePath) && location.search.includes(search);
    return location.pathname.startsWith(basePath);
  }

  const userInitial = user?.email?.charAt(0).toUpperCase() || '?';

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
          background: 'rgba(9,10,15,0.80)',
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
          <Link to={ROUTES.DASHBOARD} aria-label="Go to Home" style={{ flexShrink: 0 }}>
            <Logo size="sm" />
          </Link>

          {/* Desktop center nav */}
          <nav className="hide-mobile" style={{ alignItems: 'center', gap: '0.25rem', flex: 1, justifyContent: 'center' }}>
            {navItems.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                style={{
                  padding: '0.4rem 0.875rem',
                  borderRadius: 'var(--r-full)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: isActive(to) ? 'var(--accent)' : 'var(--text-muted)',
                  background: isActive(to) ? 'var(--accent-subtle)' : 'transparent',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {/* Cart */}
            <Link to={ROUTES.CART} aria-label={`Cart (${cartCount} items)`} style={{ position: 'relative' }}>
              <button className="btn-icon" tabIndex={-1}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
              </button>
              {cartCount > 0 && (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    background: 'var(--accent)',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--bg-base)',
                  }}
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Notifications */}
            <NotificationDropdown />

            {/* Avatar / profile dropdown — desktop only */}
            <div className="hide-mobile" style={{ position: 'relative' }} ref={avatarRef}>
              <button
                className="btn-icon"
                onClick={() => setAvatarOpen((v) => !v)}
                aria-label="Profile menu"
                style={{
                  background: 'rgba(16,217,138,0.12)',
                  border: '1px solid rgba(16,217,138,0.25)',
                  color: 'var(--accent)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                }}
              >
                {userInitial}
              </button>

              {avatarOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 0.5rem)',
                    width: 200,
                    background: '#0D1017',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--r-xl)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 50,
                    overflow: 'hidden',
                    animation: 'fadeInFast 0.15s ease',
                  }}
                >
                  <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Signed in as</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                  </div>
                  <Link
                    to={ROUTES.PROFILE}
                    onClick={() => setAvatarOpen(false)}
                    style={{ display: 'block', padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500, transition: 'background 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#FCA5A5', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.2s', fontFamily: 'inherit', fontWeight: 500 }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="btn-icon hide-desktop"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              aria-expanded={drawerOpen}
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
          <nav className="drawer" aria-label="App navigation">
            {/* Drawer header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
              <Logo size="sm" />
              <button className="btn-icon" onClick={closeDrawer} aria-label="Close menu" style={{ width: 36, height: 36 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* User info */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(16,217,138,0.12)', border: '1px solid rgba(16,217,138,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0 }}>
                {userInitial}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Signed in as</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
              </div>
            </div>

            {/* Nav links */}
            <div style={{ flex: 1, padding: '1rem' }}>
              {drawerItems.map(({ to, label, icon }, i) => (
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
                    color: isActive(to) ? 'var(--accent)' : 'var(--text-secondary)',
                    background: isActive(to) ? 'var(--accent-subtle)' : 'transparent',
                    marginBottom: '0.25rem',
                    transition: 'all 0.2s',
                    animation: `staggerIn 0.3s ease ${i * 0.06}s both`,
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ fontSize: '1.1rem', width: 22, textAlign: 'center' }}>{icon}</span>
                  {label}
                  {to === ROUTES.CART && cartCount > 0 && (
                    <span style={{ marginLeft: 'auto', background: 'var(--accent)', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '2px 7px', borderRadius: '9999px' }}>
                      {cartCount}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Sign out */}
            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--glass-border)' }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  borderRadius: 'var(--r-md)',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.18)',
                  color: '#FCA5A5',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background 0.2s',
                }}
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

/**
 * StudentLayout — wraps CartProvider around the inner layout.
 * Auth protection handled by StudentGuard in route config.
 */
export default function StudentLayout() {
  return (
    <CartProvider>
      <StudentLayoutInner />
    </CartProvider>
  );
}
