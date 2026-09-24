/**
 * CampusOne — Authoritative Database Types
 *
 * This file reflects the ACTUAL Supabase schema as confirmed from:
 *   - Migration files (phases 3-7)
 *   - Live Supabase verification (2026-09-24)
 *
 * Use these types for Supabase query generics.
 * Application-layer types (camelCase) live in types/index.ts.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Supabase generic Database type — used by createClient<Database>.
 * Each table is listed under Tables with Row, Insert, and Update shapes.
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ProfileRow, 'id'>>;
      };
      canteens: {
        Row: CanteenRow;
        Insert: Omit<CanteenRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CanteenRow, 'id'>>;
      };
      items: {
        Row: ItemRow;
        Insert: Omit<ItemRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ItemRow, 'id'>>;
      };
      reservations: {
        Row: ReservationRow;
        Insert: Omit<ReservationRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ReservationRow, 'id'>>;
      };
      reservation_items: {
        Row: ReservationItemRow;
        Insert: Omit<ReservationItemRow, 'id' | 'created_at'>;
        Update: Partial<Omit<ReservationItemRow, 'id'>>;
      };
      staff_profiles: {
        Row: StaffProfileRow;
        Insert: Omit<StaffProfileRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<StaffProfileRow, 'id'>>;
      };
      notifications: {
        Row: NotificationRow;
        Insert: Omit<NotificationRow, 'id' | 'created_at'>;
        Update: Partial<Omit<NotificationRow, 'id'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// ─── Status literals (lowercase — matches DB CHECK constraint) ──────────────
export type ReservationStatusDB =
  | 'pending'
  | 'confirmed'
  | 'ready'
  | 'collected'
  | 'cancelled'
  | 'expired';

// ─── Shop type (matches canteens.type CHECK constraint) ─────────────────────
export type ShopType = 'canteen' | 'bookstore';

// ─── Staff type (matches staff_profiles.staff_type CHECK constraint) ─────────
export type StaffTypeDB = 'canteen_staff' | 'bookstore_staff';

// ─── Notification type (matches notifications.type CHECK constraint) ─────────
export type NotificationTypeDB =
  | 'reservation_created'
  | 'reservation_confirmed'
  | 'reservation_ready'
  | 'reservation_collected'
  | 'reservation_cancelled'
  | 'reservation_expired';

// ─── Year options (matches profiles.year CHECK constraint) ───────────────────
export type YearDB = '1st' | '2nd' | '3rd' | '4th';

// ─────────────────────────────────────────────────────────────────────────────
// TABLE ROW TYPES
// Each interface matches the actual columns in the database.
// Snake_case throughout — matching PostgreSQL column names exactly.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * profiles table
 * Phase 3 migration: 20260822_phase3_student_profile.sql
 * Primary key: id (FK → auth.users)
 */
export interface ProfileRow {
  id: string;                  // UUID, PK, FK → auth.users(id)
  name: string;                // TEXT NOT NULL
  roll_number: string;         // TEXT NOT NULL UNIQUE
  mobile: string;              // TEXT NOT NULL  ← column is 'mobile', NOT 'mobile_number'
  class_section: string;       // TEXT NOT NULL
  year: YearDB;                // TEXT CHECK IN ('1st','2nd','3rd','4th')
  created_at: string;          // TIMESTAMPTZ
  updated_at: string;          // TIMESTAMPTZ
}

/**
 * canteens table
 * Phase 4 migration: 20260822_phase4_items_reservations.sql
 * Covers both canteen and bookstore shops.
 */
export interface CanteenRow {
  id: string;                  // UUID PK
  name: string;                // TEXT NOT NULL
  description: string | null;  // TEXT
  location: string | null;     // TEXT
  staff_name: string | null;   // TEXT
  staff_mobile: string | null; // TEXT
  type: ShopType;              // TEXT CHECK IN ('canteen','bookstore')
  is_active: boolean;          // BOOLEAN DEFAULT true
  created_at: string;          // TIMESTAMPTZ
  updated_at: string;          // TIMESTAMPTZ
}

/**
 * items table
 * Phase 4 migration: 20260822_phase4_items_reservations.sql
 */
export interface ItemRow {
  id: string;                    // UUID PK
  canteen_id: string;            // UUID FK → canteens(id)
  name: string;                  // TEXT NOT NULL
  description: string | null;    // TEXT
  category: string;              // TEXT NOT NULL
  price: number;                 // NUMERIC(10,2) CHECK >= 0
  image_url: string | null;      // TEXT
  available_quantity: number;    // INTEGER CHECK >= 0 DEFAULT 0
  is_available: boolean;         // BOOLEAN DEFAULT true
  created_at: string;            // TIMESTAMPTZ
  updated_at: string;            // TIMESTAMPTZ
}

/**
 * reservations table
 * Phase 4 migration + Phase 7 QR migration (2026-09-24)
 *
 * Phase 7 additions:
 *   qr_token  — UUID string, generated server-side by create_reservation RPC
 *   order_type — derived from canteens.type at reservation creation time
 */
export interface ReservationRow {
  id: string;                    // UUID PK
  reservation_code: string;      // TEXT NOT NULL UNIQUE (e.g. CAMP-2026-A1B2C3)
  student_id: string;            // UUID FK → profiles(id)
  canteen_id: string;            // UUID FK → canteens(id)
  status: ReservationStatusDB;   // TEXT DEFAULT 'pending' CHECK IN (...)
  total_amount: number;          // NUMERIC(10,2) CHECK >= 0 DEFAULT 0
  qr_token: string;              // TEXT NOT NULL UNIQUE — Phase 7
  order_type: ShopType;          // TEXT NOT NULL CHECK IN ('canteen','bookstore') — Phase 7
  created_at: string;            // TIMESTAMPTZ
  updated_at: string;            // TIMESTAMPTZ
}

/**
 * reservation_items table
 * Phase 4 migration: denormalized snapshot of items at time of reservation.
 */
export interface ReservationItemRow {
  id: string;                    // UUID PK
  reservation_id: string;        // UUID FK → reservations(id)
  item_id: string;               // UUID FK → items(id)
  item_name: string;             // TEXT NOT NULL (snapshot — frozen at creation)
  quantity: number;              // INTEGER CHECK > 0
  unit_price: number;            // NUMERIC(10,2) CHECK >= 0 (snapshot)
  subtotal: number;              // NUMERIC(10,2) CHECK >= 0
  created_at: string;            // TIMESTAMPTZ
}

/**
 * staff_profiles table
 * Phase 5 migration: 20260822_phase5_staff_reservations.sql
 * Created automatically by on_auth_user_created_staff trigger on signup.
 *
 * IMPORTANT: column is 'mobile' NOT 'mobile_number'
 */
export interface StaffProfileRow {
  id: string;                    // UUID PK
  user_id: string;               // UUID FK → auth.users UNIQUE
  name: string;                  // TEXT NOT NULL
  mobile: string;                // TEXT NOT NULL  ← 'mobile', NOT 'mobile_number'
  staff_type: StaffTypeDB;       // TEXT CHECK IN ('canteen_staff','bookstore_staff')
  shop_id: string | null;        // UUID FK → canteens(id), nullable if not yet assigned
  created_at: string;            // TIMESTAMPTZ
  updated_at: string;            // TIMESTAMPTZ
}

/**
 * notifications table
 * Phase 6 migration: 20260822_phase6_notifications.sql
 * Populated exclusively by PostgreSQL triggers — never by frontend INSERT.
 * UNIQUE constraint: (user_id, reservation_id, type) prevents duplicates.
 */
export interface NotificationRow {
  id: string;                    // UUID PK
  user_id: string;               // UUID FK → auth.users
  reservation_id: string | null; // UUID FK → reservations(id), nullable
  type: NotificationTypeDB;      // TEXT CHECK IN (...)
  title: string;                 // TEXT NOT NULL
  message: string;               // TEXT NOT NULL
  is_read: boolean;              // BOOLEAN DEFAULT false
  created_at: string;            // TIMESTAMPTZ
}

// ─────────────────────────────────────────────────────────────────────────────
// RPC INPUT / OUTPUT TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Input item for the create_reservation RPC.
 * Matches the cart_item_input composite type in PostgreSQL.
 */
export interface CartItemInput {
  item_id: string;   // UUID
  quantity: number;  // INTEGER > 0
}

/**
 * Output of the get_reservation_by_qr_token RPC (JSONB).
 * Safe data only — no qr_token, no auth credentials returned.
 */
export interface QRTokenLookupResult {
  id: string;
  reservation_code: string;
  status: ReservationStatusDB;
  total_amount: number;
  order_type: ShopType;
  created_at: string;
  student: {
    name: string;
    roll_number: string;
    mobile: string;
  };
  items: Array<{
    id: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
}
