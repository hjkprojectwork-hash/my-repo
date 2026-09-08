/**
 * Shared application types for CampusOne.
 * Database-specific types live in types/database.ts.
 */

// ─────────────────────────────────────────────
// ROLE TYPES — strict, no arbitrary strings
// ─────────────────────────────────────────────

/**
 * All valid application roles.
 * This is the ONLY accepted set of role values throughout the app.
 * Unknown roles must never be silently promoted to a valid role.
 */
export type UserRole = 'student' | 'canteen_staff' | 'bookstore_staff';

/** The set of valid staff roles */
export type StaffRole = Extract<UserRole, 'canteen_staff' | 'bookstore_staff'>;

/** Type guard — returns true if r is a valid UserRole */
export function isValidRole(r: unknown): r is UserRole {
  return r === 'student' || r === 'canteen_staff' || r === 'bookstore_staff';
}

/** Type guard — returns true if r is a valid StaffRole */
export function isStaffRole(r: unknown): r is StaffRole {
  return r === 'canteen_staff' || r === 'bookstore_staff';
}

// ─────────────────────────────────────────────
// AUTH TYPES
// ─────────────────────────────────────────────

/**
 * The authenticated user as known to the application layer.
 * Derived from the Supabase session + user_metadata.
 */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Shape of the AuthContext value exposed to all consumers.
 */
export interface AuthContextValue {
  /** The currently authenticated user, or null if not authenticated */
  user: AuthUser | null;
  /** True while the initial session is being resolved */
  loading: boolean;
  /** Convenience flag */
  isAuthenticated: boolean;
  /** Sign the current user out */
  logout: () => Promise<void>;
}

// ─────────────────────────────────────────────
// PROFILE TYPES
// ─────────────────────────────────────────────

/** Student profile (mirrors the profiles Supabase table — Phase 3) */
export interface StudentProfile {
  id: string;
  userId: string;
  name: string;
  rollNumber: string;
  mobileNumber: string;
  classSection: string;
  year: string;
  createdAt: string;
  updatedAt: string;
}

/** Staff profile (mirrors the staff_profiles Supabase table) */
export interface StaffProfile {
  id: string;
  userId: string;
  name: string;
  mobileNumber: string;
  staffType: 'canteen_staff' | 'bookstore_staff';
  shopId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// CANTEEN TYPES (Phase 4)
// ─────────────────────────────────────────────

export interface Canteen {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  staff_name: string | null;
  staff_mobile: string | null;
  type: 'canteen' | 'bookstore';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────
// ITEM TYPES (Phase 4)
// ─────────────────────────────────────────────

export interface Item {
  id: string;
  canteen_id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  image_url: string | null;
  available_quantity: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  canteen?: Partial<Canteen>; // Sometimes joined
}

export interface CartItem {
  item: Item;
  quantity: number;
  subtotal: number;
}

export type NotificationType = 
  | 'reservation_created'
  | 'reservation_confirmed'
  | 'reservation_ready'
  | 'reservation_collected'
  | 'reservation_cancelled'
  | 'reservation_expired';

export interface AppNotification {
  id: string;
  userId: string;
  reservationId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ─────────────────────────────────────────────
// RESERVATION TYPES (Phase 4)
// ─────────────────────────────────────────────

export type ReservationStatus = 
  | 'pending'
  | 'confirmed'
  | 'ready'
  | 'collected'
  | 'cancelled'
  | 'expired';

export interface Reservation {
  id: string;
  reservation_code: string;
  student_id: string;
  canteen_id: string;
  status: ReservationStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
  canteen?: Partial<Canteen>; // Sometimes joined
  items?: ReservationItem[]; // Sometimes joined
}

export interface ReservationItem {
  id: string;
  reservation_id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  item?: Partial<Item>; // Sometimes joined
}
