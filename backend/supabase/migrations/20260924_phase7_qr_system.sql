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
-- Security model — ALL 7 checks enforced server-side.
-- The client cannot supply: student_id, canteen_id, shop_id, order_type.
--
--   Check 1: auth.uid() IS NOT NULL         → unauthenticated rejected
--   Check 2: staff_profiles row exists       → non-staff rejected
--   Check 3: staff_type = 'canteen_staff'   → bookstore_staff rejected (DB-level)
--   Check 4: qr_token matches a reservation → invalid QR rejected
--   Check 5: reservation.canteen_id = staff.shop_id → cross-canteen rejected
--   Check 6: reservation.order_type = 'canteen'     → bookstore QR rejected
--   Check 7: status IN ('pending','confirmed','ready') only → processed rejected
--
-- SECURITY DEFINER with SET search_path=public to prevent schema injection.
-- Return: only what the staff UI needs. No credentials, no qr_token exposed.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_reservation_by_qr_token(p_qr_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff        RECORD;  -- holds shop_id + staff_type
  v_reservation  RECORD;
  v_student      RECORD;
  v_items        JSONB;
BEGIN

  -- CHECK 1: Must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authorized.';
  END IF;

  -- CHECK 2 + 3: Must have a staff_profiles row AND be canteen_staff
  -- Both values fetched in one query — neither is trusted from the client.
  SELECT shop_id, staff_type
    INTO v_staff
    FROM public.staff_profiles
    WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not authorized or no staff profile found.';
  END IF;

  IF v_staff.shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop assigned to your account. Contact an administrator.';
  END IF;

  -- Check 3 (CRITICAL): bookstore_staff cannot use the canteen QR scanner.
  -- This is database-level enforcement — the frontend role check is UI-only.
  IF v_staff.staff_type != 'canteen_staff' THEN
    RAISE EXCEPTION 'This QR scanner is for canteen staff only.';
  END IF;

  -- CHECK 4: QR token must match a real reservation
  SELECT r.id, r.reservation_code, r.status, r.total_amount,
         r.canteen_id, r.student_id, r.order_type, r.created_at
    INTO v_reservation
    FROM public.reservations r
    WHERE r.qr_token = p_qr_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid QR code.';
  END IF;

  -- CHECK 5: Reservation must belong to this staff member's assigned shop
  -- Prevents Canteen A staff from reading Canteen B orders via a known token.
  IF v_reservation.canteen_id != v_staff.shop_id THEN
    RAISE EXCEPTION 'This order belongs to a different shop.';
  END IF;

  -- CHECK 6: Must be a canteen order — bookstore orders cannot be processed here
  -- order_type is derived at creation time from canteens.type — never from the client.
  IF v_reservation.order_type != 'canteen' THEN
    RAISE EXCEPTION 'This QR scanner is for canteen orders only.';
  END IF;

  -- CHECK 7: Status must be actionable
  -- collected / cancelled / expired reservations cannot be processed again.
  IF v_reservation.status IN ('collected', 'cancelled', 'expired') THEN
    RAISE EXCEPTION 'This order has already been % and cannot be processed again.', v_reservation.status;
  END IF;

  -- Fetch student info — safe fields only (no auth data, no passwords)
  SELECT name, roll_number, mobile
    INTO v_student
    FROM public.profiles
    WHERE id = v_reservation.student_id;

  -- Fetch reservation line items
  SELECT jsonb_agg(
    jsonb_build_object(
      'id',         ri.id,
      'item_name',  ri.item_name,
      'quantity',   ri.quantity,
      'unit_price', ri.unit_price,
      'subtotal',   ri.subtotal
    )
    ORDER BY ri.item_name
  )
  INTO v_items
  FROM public.reservation_items ri
  WHERE ri.reservation_id = v_reservation.id;

  -- Return safe composite result
  -- Does NOT include: qr_token, student credentials, Supabase keys, internal IDs beyond reservation id.
  RETURN jsonb_build_object(
    'id',               v_reservation.id,
    'reservation_code', v_reservation.reservation_code,
    'status',           v_reservation.status,
    'total_amount',     v_reservation.total_amount,
    'order_type',       v_reservation.order_type,
    'created_at',       v_reservation.created_at,
    'student', jsonb_build_object(
      'name',        COALESCE(v_student.name, 'Unknown'),
      'roll_number', COALESCE(v_student.roll_number, '—'),
      'mobile',      COALESCE(v_student.mobile, '—')
    ),
    'items', COALESCE(v_items, '[]'::jsonb)
  );
END;
$$;


-- ────────────────────────────────────────────────────────────
-- STEP 5: Verification queries (run manually after migration)
-- ────────────────────────────────────────────────────────────
-- Verify 1: All rows have qr_token + order_type populated correctly
-- SELECT id, reservation_code, order_type, length(qr_token) AS token_len
-- FROM public.reservations LIMIT 10;
-- Expected: token_len=36, order_type='canteen' or 'bookstore'
--
-- Verify 2: No NULL values remain (both columns must be NOT NULL)
-- SELECT COUNT(*) FROM public.reservations
-- WHERE qr_token IS NULL OR order_type IS NULL;
-- Expected: 0
--
-- Verify 3: Both RPCs are deployed
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_schema='public'
--   AND routine_name IN ('create_reservation','get_reservation_by_qr_token');
-- Expected: 2 rows
-- ────────────────────────────────────────────────────────────



