/**
 * ProtectedRoute — guards a route behind authentication.
 *
 * Behaviour:
 * - While auth is loading → show a spinner (avoids flash of redirect)
 * - Unauthenticated → redirect to the appropriate login page
 * - Authenticated with wrong role → redirect to the appropriate page
 * - Authenticated with correct role → render children
 *
 * Props:
 *   allowedRoles  — if provided, only these roles may access the route
 *   redirectTo    — override the default redirect destination
 *   loginPath     — which login page to redirect unauthenticated users to
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { type UserRole } from '@/types';
import { ROUTES } from '@/constants';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  /** If provided, only users with one of these roles may pass */
  allowedRoles?: UserRole[];
  /** Where to send unauthenticated users (defaults to /login) */
  loginPath?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  loginPath = ROUTES.LOGIN,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // ── Loading state — wait for session to be resolved ──
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg)',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <svg
          style={{ width: 36, height: 36, animation: 'spin 1s linear infinite' }}
          viewBox="0 0 24 24"
          fill="none"
          aria-label="Loading…"
        >
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <circle cx="12" cy="12" r="10" stroke="rgba(99,102,241,0.25)" strokeWidth="3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Loading…
        </span>
      </div>
    );
  }

  // ── Not authenticated → redirect to login ──
  if (!user) {
    return (
      <Navigate
        to={loginPath}
        state={{ from: location }}
        replace
      />
    );
  }

  // ── Authenticated but wrong role → redirect appropriately ──
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Route the user to their own correct home page
    const roleHome = getRoleHome(user.role);
    return <Navigate to={roleHome} replace />;
  }

  // ── All checks passed — render the protected content ──
  return <>{children}</>;
}

/**
 * Returns the correct home route for a given role.
 * Used to redirect unauthorized role access to the user's own space.
 */
function getRoleHome(role: UserRole): string {
  switch (role) {
    case 'student':        return ROUTES.DASHBOARD;
    case 'canteen_staff':  return ROUTES.STAFF_CANTEEN;
    case 'bookstore_staff': return ROUTES.STAFF_BOOKSTORE;
  }
}
