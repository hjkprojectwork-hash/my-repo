/**
 * useAuth — convenience hook for consuming AuthContext.
 *
 * Throws a helpful error if used outside of <AuthProvider>.
 * This is intentional: a missing provider is a programming error, not a runtime error.
 */

import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import type { AuthContextValue } from '@/types';

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  if (ctx === null) {
    throw new Error(
      'useAuth() must be used inside <AuthProvider>. ' +
      'Make sure <AuthProvider> wraps your component tree in src/App.tsx.'
    );
  }

  return ctx;
}
