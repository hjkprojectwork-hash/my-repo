/**
 * AuthContext — global authentication state for CampusOne.
 *
 * Responsibilities:
 * - Initialize from the existing Supabase session on mount
 * - Subscribe to Supabase auth state changes (login / logout / token refresh)
 * - Expose user, loading, isAuthenticated, and logout() to all consumers
 * - Clean up the auth subscription on unmount
 *
 * Security notes:
 * - Roles are read from Supabase user_metadata (set at signup, controlled server-side)
 * - Unknown roles are rejected — they are never silently promoted
 * - This context is for APPLICATION FLOW only; authorization is enforced by RLS (Phase 4+)
 */

import {
  createContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/services/auth/auth.service';
import { isValidRole, type AuthContextValue, type AuthUser } from '@/types';

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────

/**
 * Derive our AuthUser from a Supabase User object.
 * Returns null if the user has an unrecognized role — unknown roles are
 * treated as unauthorized and never silently promoted.
 */
function deriveAuthUser(supabaseUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null): AuthUser | null {
  if (!supabaseUser) return null;

  const rawRole = supabaseUser.user_metadata?.role;
  if (!isValidRole(rawRole)) {
    // Unknown role — not recognized, treated as unauthenticated for routing
    console.warn('[AuthContext] Unrecognized role in user_metadata:', rawRole);
    return null;
  }

  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    role: rawRole,
  };
}

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Initialize from existing session ──
  useEffect(() => {
    // Attempt to restore an existing Supabase session (e.g. after page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(deriveAuthUser(session?.user ?? null));
      setLoading(false);
    });

    // Subscribe to auth state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(deriveAuthUser(session?.user ?? null));
        setLoading(false);
      }
    );

    // Cleanup on unmount — prevent memory leaks and stale listeners
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ── Logout ──
  const logout = useCallback(async () => {
    await signOut();
    // onAuthStateChange will fire SIGNED_OUT and set user to null automatically
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: user !== null,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
