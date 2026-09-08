/**
 * StudentGuard — wraps student routes to enforce:
 * 1. Must be authenticated as a student
 * 2. Must have completed their profile (Phase 3: Supabase check)
 *    For Phase 2 stub: always redirects to /profile/setup
 *
 * /profile/setup itself is excluded from the profile-completion check
 * so students can actually get there.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { hasCompletedStudentProfile } from '@/services/auth/auth.service';

interface StudentGuardProps {
  children: ReactNode;
  /** Set to true for /profile/setup so the guard doesn't create an infinite redirect */
  skipProfileCheck?: boolean;
}

export default function StudentGuard({ children, skipProfileCheck = false }: StudentGuardProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [profileChecked, setProfileChecked] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);

  // ── Loading auth state ──
  useEffect(() => {
    if (!loading && user && user.role === 'student' && !skipProfileCheck) {
      hasCompletedStudentProfile(user.id).then((complete) => {
        setProfileComplete(complete);
        setProfileChecked(true);
      });
    } else if (!loading) {
      setTimeout(() => setProfileChecked(true), 0);
    }
  }, [loading, user, skipProfileCheck]);

  // ── Show spinner while loading ──
  if (loading || !profileChecked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', flexDirection: 'column', gap: '1rem' }}>
        <svg style={{ width: 36, height: 36, animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none" aria-label="Loading…">
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <circle cx="12" cy="12" r="10" stroke="rgba(99,102,241,0.25)" strokeWidth="3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Loading…</span>
      </div>
    );
  }

  // ── Not authenticated ──
  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // ── Wrong role (staff trying to access student pages) ──
  if (user.role !== 'student') {
    const staffHome = user.role === 'canteen_staff' ? ROUTES.STAFF_CANTEEN : ROUTES.STAFF_BOOKSTORE;
    return <Navigate to={staffHome} replace />;
  }

  // ── Profile not yet complete → redirect to setup ──
  if (!skipProfileCheck && !profileComplete) {
    return <Navigate to={ROUTES.PROFILE_SETUP} replace />;
  }

  return <>{children}</>;
}
