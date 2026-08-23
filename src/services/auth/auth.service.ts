/**
 * Authentication service — thin abstraction over Supabase Auth.
 *
 * ARCHITECTURE RULES:
 * - Only the anon key is used (via the supabase client from src/lib/supabase.ts)
 * - Passwords are NEVER stored or hashed manually — Supabase Auth handles everything
 * - Roles are embedded in user_metadata at signup with a FIXED value
 * - The frontend never accepts an arbitrary role string from the user
 * - Authorization enforcement belongs to PostgreSQL RLS (Phase 4+), not this layer
 */

import { supabase } from '@/lib/supabase';
import { isValidRole, type UserRole } from '@/types';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface StudentSignUpData {
  email: string;
  password: string;
}

export interface StaffSignUpData {
  name: string;
  mobileNumber: string;
  email: string;
  password: string;
  /** Only 'canteen_staff' or 'bookstore_staff' — validated here before sending */
  staffType: 'canteen_staff' | 'bookstore_staff';
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthServiceResult<T = undefined> {
  data: T;
  error: string | null;
}

// ─────────────────────────────────────────────
// STUDENT REGISTRATION
// ─────────────────────────────────────────────

/**
 * Register a new student.
 * The role 'student' is set server-side in user_metadata.
 * The user never supplies the role — it is fixed here.
 */
export async function registerStudent(
  input: StudentSignUpData
): Promise<AuthServiceResult> {
  const { error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: {
        // Role is hardcoded — the user cannot override this via the form
        role: 'student' satisfies UserRole,
      },
    },
  });

  if (error) {
    return { data: undefined, error: mapAuthError(error.message) };
  }

  return { data: undefined, error: null };
}

// ─────────────────────────────────────────────
// STAFF REGISTRATION
// ─────────────────────────────────────────────

/**
 * Register a new staff member.
 *
 * IMPORTANT: staffType is validated against an allowlist here.
 * If an unexpected value is provided it is rejected before calling Supabase.
 *
 * In a production environment, staff registration should additionally require
 * admin approval or an invitation token (Phase 4+).
 */
export async function registerStaff(
  input: StaffSignUpData
): Promise<AuthServiceResult> {
  // Allowlist — never accept arbitrary role strings
  if (
    input.staffType !== 'canteen_staff' &&
    input.staffType !== 'bookstore_staff'
  ) {
    return { data: undefined, error: 'Invalid staff type selected.' };
  }

  const { error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: {
        role: input.staffType satisfies UserRole,
        name: input.name.trim(),
        mobile_number: input.mobileNumber.trim(),
        staff_type: input.staffType,
      },
    },
  });

  if (error) {
    return { data: undefined, error: mapAuthError(error.message) };
  }

  return { data: undefined, error: null };
}

// ─────────────────────────────────────────────
// SIGN IN
// ─────────────────────────────────────────────

/**
 * Sign in with email + password.
 * Returns the resolved role derived from user_metadata.
 */
export async function signIn(
  input: SignInData
): Promise<AuthServiceResult<{ role: UserRole } | undefined>> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim().toLowerCase(),
    password: input.password,
  });

  if (error) {
    return { data: undefined, error: mapAuthError(error.message) };
  }

  const rawRole = data.user?.user_metadata?.role;
  if (!isValidRole(rawRole)) {
    // Sign out immediately — unknown role is treated as unauthorized
    await supabase.auth.signOut();
    return {
      data: undefined,
      error: 'Your account has an unrecognized role. Please contact support.',
    };
  }

  return { data: { role: rawRole }, error: null };
}

// ─────────────────────────────────────────────
// SIGN OUT
// ─────────────────────────────────────────────

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ─────────────────────────────────────────────
// PROFILE COMPLETION CHECK (Phase 2 stub)
// ─────────────────────────────────────────────

/**
 * Checks whether the student has completed their mandatory profile.
 *
 * ⚠️ PHASE 2 STUB — always returns false (profile not yet complete).
 * Phase 3 will replace this with a real Supabase query against
 * the `profiles` table using RLS.
 *
 * Do NOT use localStorage to store the permanent profile state.
 */
export async function hasCompletedStudentProfile(
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error checking profile completion:', error);
    return false;
  }

  return data !== null;
}

// ─────────────────────────────────────────────
// ERROR MAPPING
// ─────────────────────────────────────────────

/**
 * Map raw Supabase error messages to user-friendly strings.
 * Never expose raw internal error details to users.
 */
function mapAuthError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  if (m.includes('user already registered') || m.includes('already been registered') || m.includes('email already')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (m.includes('password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (m.includes('unable to validate email address')) {
    return 'Please enter a valid email address.';
  }
  if (m.includes('email not confirmed')) {
    return 'Please verify your email address before signing in. Check your inbox.';
  }
  if (m.includes('signup is disabled')) {
    return 'New registrations are currently disabled. Please contact support.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  if (m.includes('rate limit') || m.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  // Fallback — do not expose the raw message
  return 'An unexpected error occurred. Please try again.';
}
