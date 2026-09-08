-- 1. Create staff_profiles if not exists
CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  staff_type TEXT NOT NULL CHECK (staff_type IN ('canteen_staff', 'bookstore_staff')),
  shop_id UUID REFERENCES public.canteens(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Note: shop_id should be manually set by an admin in a real system.
-- For demo purposes in Phase 5, if it's null, they can't manage any shop.

-- Enable RLS
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

-- Staff can view their own profile
CREATE POLICY "Staff can view own profile"
  ON public.staff_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Update existing reservations policies for staff
-- Staff can SELECT reservations for their assigned shop
CREATE POLICY "Staff can view reservations for their shop"
  ON public.reservations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles
      WHERE staff_profiles.user_id = auth.uid()
      AND staff_profiles.shop_id = reservations.canteen_id
    )
  );

-- Staff can SELECT reservation_items for their assigned shop
CREATE POLICY "Staff can view reservation items for their shop"
  ON public.reservation_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reservations
      JOIN public.staff_profiles ON staff_profiles.shop_id = reservations.canteen_id
      WHERE reservations.id = reservation_items.reservation_id
      AND staff_profiles.user_id = auth.uid()
    )
  );

-- We do NOT add a direct UPDATE policy for reservations for staff to modify status.
-- Status changes will be handled strictly through a secure RPC to enforce state machine.

-- 3. Secure RPC for updating reservation status
CREATE OR REPLACE FUNCTION public.update_reservation_status(
  p_reservation_id UUID,
  p_new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to bypass RLS for the update itself
AS $$
DECLARE
  v_staff_shop_id UUID;
  v_reservation RECORD;
BEGIN
  -- 1. Verify authentication and get staff's assigned shop
  SELECT shop_id INTO v_staff_shop_id
  FROM public.staff_profiles
  WHERE user_id = auth.uid();

  IF v_staff_shop_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized or no assigned shop.';
  END IF;

  -- 2. Fetch reservation
  SELECT * INTO v_reservation
  FROM public.reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found.';
  END IF;

  -- 3. Verify reservation belongs to staff's shop
  IF v_reservation.canteen_id != v_staff_shop_id THEN
    RAISE EXCEPTION 'Not authorized to update this shop''s reservations.';
  END IF;

  -- 4. Validate state machine transitions
  -- Allowed states: pending, confirmed, ready, collected, cancelled, expired
  IF p_new_status = 'confirmed' THEN
    IF v_reservation.status != 'pending' THEN
      RAISE EXCEPTION 'Invalid transition to confirmed.';
    END IF;
  ELSIF p_new_status = 'ready' THEN
    IF v_reservation.status != 'confirmed' THEN
      RAISE EXCEPTION 'Invalid transition to ready.';
    END IF;
  ELSIF p_new_status = 'collected' THEN
    IF v_reservation.status != 'ready' THEN
      RAISE EXCEPTION 'Invalid transition to collected.';
    END IF;
  ELSIF p_new_status = 'cancelled' THEN
    -- Business rules: can cancel from pending or confirmed
    IF v_reservation.status NOT IN ('pending', 'confirmed') THEN
      RAISE EXCEPTION 'Invalid transition to cancelled.';
    END IF;
  ELSIF p_new_status = 'expired' THEN
    IF v_reservation.status NOT IN ('pending', 'confirmed', 'ready') THEN
      RAISE EXCEPTION 'Invalid transition to expired.';
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid status requested.';
  END IF;

  -- 5. Update the reservation
  UPDATE public.reservations
  SET status = p_new_status,
      updated_at = NOW()
  WHERE id = p_reservation_id;

  RETURN json_build_object('success', true, 'new_status', p_new_status);
END;
$$;

-- 4. Create trigger to automatically insert into staff_profiles on staff registration
CREATE OR REPLACE FUNCTION public.handle_new_staff_user()
RETURNS trigger AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'role' IN ('canteen_staff', 'bookstore_staff') THEN
    INSERT INTO public.staff_profiles (user_id, name, mobile, staff_type)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', ''),
      COALESCE(NEW.raw_user_meta_data->>'mobile_number', ''),
      NEW.raw_user_meta_data->>'staff_type'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_staff') THEN
    CREATE TRIGGER on_auth_user_created_staff
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_staff_user();
  END IF;
END
$$;
