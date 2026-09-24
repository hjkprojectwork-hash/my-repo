-- =============================================================
-- CampusOne — Phase 7: QR-Based Reservation Verification System
-- =============================================================
-- Run this entire file in Supabase SQL Editor (dashboard)
-- Safe to run: all changes are additive.
-- =============================================================

-- ────────────────────────────────────────────────────────────
-- STEP 1: Add qr_token column to reservations
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS qr_token TEXT;

-- Backfill all existing rows that don't have a token yet
UPDATE public.reservations
  SET qr_token = gen_random_uuid()::text
  WHERE qr_token IS NULL;

-- Now enforce NOT NULL and UNIQUE
ALTER TABLE public.reservations
  ALTER COLUMN qr_token SET NOT NULL;

-- Unique constraint (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reservations_qr_token_key'
      AND conrelid = 'public.reservations'::regclass
  ) THEN
    ALTER TABLE public.reservations ADD CONSTRAINT reservations_qr_token_key UNIQUE (qr_token);
  END IF;
END
$$;

-- Index for O(1) QR lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_qr_token
  ON public.reservations(qr_token);


-- ────────────────────────────────────────────────────────────
-- STEP 2: Add order_type column to reservations
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS order_type TEXT;

-- Backfill from canteens.type (safe: preserves historical data correctly)
UPDATE public.reservations r
  SET order_type = c.type
  FROM public.canteens c
  WHERE r.canteen_id = c.id
    AND r.order_type IS NULL;

-- Enforce NOT NULL + CHECK constraint
ALTER TABLE public.reservations
  ALTER COLUMN order_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reservations_order_type_check'
      AND conrelid = 'public.reservations'::regclass
  ) THEN
    ALTER TABLE public.reservations
      ADD CONSTRAINT reservations_order_type_check
      CHECK (order_type IN ('canteen', 'bookstore'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_reservations_order_type
  ON public.reservations(order_type);


-- ────────────────────────────────────────────────────────────
-- STEP 3: Update create_reservation RPC to generate qr_token + order_type
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_reservation(
  p_canteen_id UUID,
  p_items cart_item_input[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id UUID;
  v_reservation_id UUID;
  v_reservation_code TEXT;
  v_total_amount NUMERIC(10,2) := 0;
  v_item cart_item_input;
  v_db_item RECORD;
  v_subtotal NUMERIC(10,2);
  v_qr_token TEXT;
  v_order_type TEXT;
BEGIN
  -- 1. Get authenticated user
  v_student_id := auth.uid();
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Verify user is a student (profile exists)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_student_id) THEN
    RAISE EXCEPTION 'Student profile not found';
  END IF;

  -- 3. Verify canteen is active and get its type
  SELECT type INTO v_order_type
    FROM public.canteens
    WHERE id = p_canteen_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Canteen is not available';
  END IF;

  -- 4. Generate unique human-readable Reservation Code
  v_reservation_code := 'CAMP-' || to_char(CURRENT_DATE, 'YYYY') || '-' || upper(substring(md5(random()::text) from 1 for 6));

  -- 5. Generate secure QR token (UUID v4)
  v_qr_token := gen_random_uuid()::text;

  -- 6. Create reservation stub with both new fields
  INSERT INTO public.reservations (
    reservation_code, student_id, canteen_id, status, total_amount, qr_token, order_type
  ) VALUES (
    v_reservation_code, v_student_id, p_canteen_id, 'pending', 0, v_qr_token, v_order_type
  ) RETURNING id INTO v_reservation_id;

  -- 7. Process items securely
  FOREACH v_item IN ARRAY p_items
  LOOP
    -- Validate quantity
    IF v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for item %', v_item.item_id;
    END IF;

    -- Fetch current item state with row lock (prevents concurrent oversell)
    SELECT id, name, price, available_quantity, is_available, canteen_id
    INTO v_db_item
    FROM public.items
    WHERE id = v_item.item_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Item % not found', v_item.item_id;
    END IF;

    IF v_db_item.canteen_id != p_canteen_id THEN
      RAISE EXCEPTION 'Item % does not belong to the requested canteen', v_item.item_id;
    END IF;

    IF NOT v_db_item.is_available THEN
      RAISE EXCEPTION 'Item % is currently unavailable', v_db_item.name;
    END IF;

    IF v_db_item.available_quantity < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient quantity for item %', v_db_item.name;
    END IF;

    -- Calculate subtotal
    v_subtotal := v_db_item.price * v_item.quantity;
    v_total_amount := v_total_amount + v_subtotal;

    -- Insert reservation item
    INSERT INTO public.reservation_items (
      reservation_id, item_id, item_name, quantity, unit_price, subtotal
    ) VALUES (
      v_reservation_id, v_item.item_id, v_db_item.name, v_item.quantity, v_db_item.price, v_subtotal
    );

    -- Decrement inventory
    UPDATE public.items
    SET available_quantity = available_quantity - v_item.quantity
    WHERE id = v_db_item.id;

  END LOOP;

  -- 8. Update reservation total
  UPDATE public.reservations
  SET total_amount = v_total_amount
  WHERE id = v_reservation_id;

  RETURN v_reservation_id;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- STEP 4: Create get_reservation_by_qr_token RPC (NEW)
-- ────────────────────────────────────────────────────────────
-- Security model:
--   authenticated canteen_staff
--   → staff_profiles.shop_id = reservation.canteen_id
--   → reservation.order_type = 'canteen'
--   → reservation.status is actionable
-- Returns a JSONB object with safe reservation data + items
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_reservation_by_qr_token(p_qr_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_staff_shop_id UUID;
  v_reservation   RECORD;
  v_student       RECORD;
  v_items         JSONB;
BEGIN
  -- 1. Verify authentication and get staff's assigned shop
  SELECT shop_id INTO v_staff_shop_id
    FROM public.staff_profiles
    WHERE user_id = auth.uid();

  IF NOT FOUND OR v_staff_shop_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized or no assigned shop.';
  END IF;

  -- 2. Look up reservation by QR token
  SELECT r.id, r.reservation_code, r.status, r.total_amount,
         r.canteen_id, r.student_id, r.order_type, r.created_at, r.updated_at
  INTO v_reservation
    FROM public.reservations r
    WHERE r.qr_token = p_qr_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid QR code.';
  END IF;

  -- 3. Verify this reservation belongs to the staff member's shop
  IF v_reservation.canteen_id != v_staff_shop_id THEN
    RAISE EXCEPTION 'This order belongs to a different shop.';
  END IF;

  -- 4. Verify it is a canteen order (not bookstore)
  IF v_reservation.order_type != 'canteen' THEN
    RAISE EXCEPTION 'This QR scanner is for canteen orders only.';
  END IF;

  -- 5. Verify it is in an actionable state
  IF v_reservation.status IN ('collected', 'cancelled', 'expired') THEN
    RAISE EXCEPTION 'This order has already been % and cannot be processed again.', v_reservation.status;
  END IF;

  -- 6. Fetch student info (safe fields only)
  SELECT name, roll_number, mobile INTO v_student
    FROM public.profiles
    WHERE id = v_reservation.student_id;

  -- 7. Fetch reservation items
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ri.id,
      'item_name', ri.item_name,
      'quantity', ri.quantity,
      'unit_price', ri.unit_price,
      'subtotal', ri.subtotal
    )
  ) INTO v_items
    FROM public.reservation_items ri
    WHERE ri.reservation_id = v_reservation.id;

  -- 8. Return safe composite result
  RETURN jsonb_build_object(
    'id',               v_reservation.id,
    'reservation_code', v_reservation.reservation_code,
    'status',           v_reservation.status,
    'total_amount',     v_reservation.total_amount,
    'order_type',       v_reservation.order_type,
    'created_at',       v_reservation.created_at,
    'student', jsonb_build_object(
      'name',        v_student.name,
      'roll_number', v_student.roll_number,
      'mobile',      v_student.mobile
    ),
    'items', COALESCE(v_items, '[]'::jsonb)
  );
END;
$$;


-- ────────────────────────────────────────────────────────────
-- STEP 5: Verify migration
-- Run this SELECT to confirm all columns and data are correct:
-- ────────────────────────────────────────────────────────────
-- SELECT id, reservation_code, status, order_type,
--        length(qr_token) as token_len
-- FROM public.reservations
-- LIMIT 10;
--
-- Expected: qr_token length = 36 (UUID format), order_type = 'canteen' or 'bookstore'
-- ────────────────────────────────────────────────────────────
