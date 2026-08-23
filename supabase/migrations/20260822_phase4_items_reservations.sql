-- 1. Create canteens table
CREATE TABLE public.canteens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  staff_name TEXT,
  staff_mobile TEXT,
  type TEXT CHECK (type IN ('canteen', 'bookstore')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create items table
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id UUID NOT NULL REFERENCES public.canteens(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  available_quantity INTEGER NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create reservations table
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_code TEXT NOT NULL UNIQUE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  canteen_id UUID NOT NULL REFERENCES public.canteens(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'ready', 'collected', 'cancelled', 'expired')),
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create reservation_items table
CREATE TABLE public.reservation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id),
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_items_canteen_id ON public.items(canteen_id);
CREATE INDEX idx_items_category ON public.items(category);
CREATE INDEX idx_reservations_student_id ON public.reservations(student_id);
CREATE INDEX idx_reservations_canteen_id ON public.reservations(canteen_id);
CREATE INDEX idx_reservations_status ON public.reservations(status);
CREATE INDEX idx_reservation_items_reservation_id ON public.reservation_items(reservation_id);

-- Enable RLS
ALTER TABLE public.canteens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students can read active canteens
CREATE POLICY "Anyone can read active canteens"
  ON public.canteens FOR SELECT
  USING (is_active = true);

-- Students can read available items
CREATE POLICY "Anyone can read active items"
  ON public.items FOR SELECT
  USING (is_available = true);

-- Students can view their own reservations
CREATE POLICY "Students can view their own reservations"
  ON public.reservations FOR SELECT
  USING (auth.uid() = student_id);

-- Students can view their own reservation items
CREATE POLICY "Students can view their own reservation items"
  ON public.reservation_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reservations
      WHERE reservations.id = reservation_items.reservation_id
      AND reservations.student_id = auth.uid()
    )
  );

-- Students can update their own reservations (only to cancel if pending)
CREATE POLICY "Students can cancel their own pending reservations"
  ON public.reservations FOR UPDATE
  USING (auth.uid() = student_id AND status = 'pending')
  WITH CHECK (auth.uid() = student_id AND status = 'cancelled');

-- Note: INSERT is handled securely via the RPC function below, bypassing RLS using SECURITY DEFINER.

-- Triggers for updated_at
CREATE TRIGGER update_canteens_updated_at
  BEFORE UPDATE ON public.canteens FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON public.reservations FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Type for the RPC input
CREATE TYPE cart_item_input AS (
  item_id UUID,
  quantity INTEGER
);

-- Secure RPC for creating a reservation
CREATE OR REPLACE FUNCTION public.create_reservation(
  p_canteen_id UUID,
  p_items cart_item_input[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the function creator (bypasses RLS for secure insert)
AS $$
DECLARE
  v_student_id UUID;
  v_reservation_id UUID;
  v_reservation_code TEXT;
  v_total_amount NUMERIC(10,2) := 0;
  v_item cart_item_input;
  v_db_item RECORD;
  v_subtotal NUMERIC(10,2);
  v_seq INTEGER;
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

  -- 3. Verify canteen is active
  IF NOT EXISTS (SELECT 1 FROM public.canteens WHERE id = p_canteen_id AND is_active = true) THEN
    RAISE EXCEPTION 'Canteen is not available';
  END IF;

  -- 4. Generate Reservation Code (CAMP-YYYY-XXXXXX)
  -- A simple random alphanumeric for uniqueness or a sequence. Using random hex for simplicity in Supabase.
  v_reservation_code := 'CAMP-' || to_char(CURRENT_DATE, 'YYYY') || '-' || upper(substring(md5(random()::text) from 1 for 6));

  -- 5. Create reservation stub
  INSERT INTO public.reservations (
    reservation_code, student_id, canteen_id, status, total_amount
  ) VALUES (
    v_reservation_code, v_student_id, p_canteen_id, 'pending', 0
  ) RETURNING id INTO v_reservation_id;

  -- 6. Process items securely
  FOREACH v_item IN ARRAY p_items
  LOOP
    -- Verify quantity
    IF v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for item %', v_item.item_id;
    END IF;

    -- Fetch current item state with row lock
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

    -- Decrement inventory (optional based on rules, but typical)
    UPDATE public.items
    SET available_quantity = available_quantity - v_item.quantity
    WHERE id = v_db_item.id;

  END LOOP;

  -- 7. Update reservation total
  UPDATE public.reservations
  SET total_amount = v_total_amount
  WHERE id = v_reservation_id;

  RETURN v_reservation_id;
END;
$$;
