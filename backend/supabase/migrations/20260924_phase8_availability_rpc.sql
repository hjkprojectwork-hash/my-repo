-- =============================================================
-- CampusOne — Phase 8: Staff Item Availability Management
-- =============================================================
-- Run this entire file in Supabase SQL Editor (dashboard)
-- Safe to run: all changes are additive.
-- =============================================================

-- ────────────────────────────────────────────────────────────
-- STEP 1: Allow staff to read ALL items for their assigned shop
-- (including unavailable ones — so they can toggle them)
-- ────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'items'
      AND policyname = 'Staff can read all items for their shop'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Staff can read all items for their shop"
        ON public.items FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.staff_profiles sp
            WHERE sp.user_id = auth.uid()
              AND sp.shop_id = items.canteen_id
          )
        );
    $policy$;
  END IF;
END
$$;


-- ────────────────────────────────────────────────────────────
-- STEP 2: Secure RPC for staff to toggle item availability
-- Security:
--   1. Must be authenticated
--   2. Must have a staff_profiles row
--   3. Item must belong to staff assigned shop
--   4. Only toggles is_available
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.toggle_item_availability(
  p_item_id UUID,
  p_is_available BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_shop_id UUID;
  v_item          RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authorized.';
  END IF;

  SELECT shop_id INTO v_staff_shop_id
  FROM public.staff_profiles
  WHERE user_id = auth.uid();

  IF NOT FOUND OR v_staff_shop_id IS NULL THEN
    RAISE EXCEPTION 'No assigned shop found for this staff account.';
  END IF;

  SELECT id, name, canteen_id, is_available
  INTO v_item
  FROM public.items
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found.';
  END IF;

  IF v_item.canteen_id != v_staff_shop_id THEN
    RAISE EXCEPTION 'This item does not belong to your assigned shop.';
  END IF;

  UPDATE public.items
  SET
    is_available = p_is_available,
    updated_at   = NOW()
  WHERE id = p_item_id;

  RETURN jsonb_build_object(
    'success',      true,
    'item_id',      p_item_id,
    'item_name',    v_item.name,
    'is_available', p_is_available
  );
END;
$$;


-- ────────────────────────────────────────────────────────────
-- STEP 3: Secure RPC for staff to read ALL items for their shop
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_shop_items()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_shop_id UUID;
  v_items         JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authorized.';
  END IF;

  SELECT shop_id INTO v_staff_shop_id
  FROM public.staff_profiles
  WHERE user_id = auth.uid();

  IF NOT FOUND OR v_staff_shop_id IS NULL THEN
    RAISE EXCEPTION 'No assigned shop found for this staff account.';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id',                 i.id,
      'name',               i.name,
      'description',        i.description,
      'category',           i.category,
      'price',              i.price,
      'image_url',          i.image_url,
      'available_quantity', i.available_quantity,
      'is_available',       i.is_available,
      'canteen_id',         i.canteen_id,
      'created_at',         i.created_at,
      'updated_at',         i.updated_at
    )
    ORDER BY i.category, i.name
  )
  INTO v_items
  FROM public.items i
  WHERE i.canteen_id = v_staff_shop_id;

  RETURN COALESCE(v_items, '[]'::jsonb);
END;
$$;


-- ────────────────────────────────────────────────────────────
-- STEP 4: RPC for staff to look up a reservation by Order ID
-- (manual fallback when camera is unavailable)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_reservation_by_code(p_reservation_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff        RECORD;
  v_reservation  RECORD;
  v_student      RECORD;
  v_items        JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authorized.';
  END IF;

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

  IF v_staff.staff_type != 'canteen_staff' THEN
    RAISE EXCEPTION 'This lookup is for canteen staff only.';
  END IF;

  SELECT r.id, r.reservation_code, r.status, r.total_amount,
         r.canteen_id, r.student_id, r.order_type, r.created_at
  INTO v_reservation
  FROM public.reservations r
  WHERE UPPER(r.reservation_code) = UPPER(TRIM(p_reservation_code));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order ID not found. Please check and try again.';
  END IF;

  IF v_reservation.canteen_id != v_staff.shop_id THEN
    RAISE EXCEPTION 'This order belongs to a different shop.';
  END IF;

  IF v_reservation.order_type != 'canteen' THEN
    RAISE EXCEPTION 'This lookup is for canteen orders only.';
  END IF;

  SELECT name, roll_number, mobile
  INTO v_student
  FROM public.profiles
  WHERE id = v_reservation.student_id;

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

  RETURN jsonb_build_object(
    'id',               v_reservation.id,
    'reservation_code', v_reservation.reservation_code,
    'status',           v_reservation.status,
    'total_amount',     v_reservation.total_amount,
    'order_type',       v_reservation.order_type,
    'created_at',       v_reservation.created_at,
    'student', jsonb_build_object(
      'name',        COALESCE(v_student.name, 'Unknown'),
      'roll_number', COALESCE(v_student.roll_number, 'N/A'),
      'mobile',      COALESCE(v_student.mobile, 'N/A')
    ),
    'items', COALESCE(v_items, '[]'::jsonb)
  );
END;
$$;


-- ────────────────────────────────────────────────────────────
-- STEP 5: Update items RLS so students see ALL items
-- (including unavailable, so frontend can show SOLD OUT)
-- ────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'items'
      AND policyname = 'Anyone can read active items'
  ) THEN
    DROP POLICY "Anyone can read active items" ON public.items;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'items'
      AND policyname = 'Anyone can read items for active canteens'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Anyone can read items for active canteens"
        ON public.items FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.canteens c
            WHERE c.id = items.canteen_id
              AND c.is_active = true
          )
        );
    $policy$;
  END IF;
END
$$;
