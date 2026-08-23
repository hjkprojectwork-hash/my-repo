-- 1. Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'reservation_created', 
    'reservation_confirmed', 
    'reservation_ready', 
    'reservation_collected', 
    'reservation_cancelled', 
    'reservation_expired'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotency protection: Prevent exact duplicate notifications for the same reservation event per user
ALTER TABLE public.notifications 
  ADD CONSTRAINT unique_user_reservation_event 
  UNIQUE (user_id, reservation_id, type);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_reservation_id ON public.notifications(reservation_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- 2. Secure RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Explicitly NO direct update/delete/insert policy to prevent frontend tampering.
-- We will use a secure RPC for marking as read.

-- 3. Secure RPC to mark as read
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(
  p_notification_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification RECORD;
BEGIN
  -- Verify ownership
  SELECT * INTO v_notification
  FROM public.notifications
  WHERE id = p_notification_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Notification not found';
  END IF;

  IF v_notification.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.notifications
  SET is_read = true
  WHERE id = p_notification_id;

  RETURN json_build_object('success', true);
END;
$$;

-- Secure RPC to mark ALL as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true
  WHERE user_id = auth.uid() AND is_read = false;

  RETURN json_build_object('success', true);
END;
$$;

-- 4. Triggers to create notifications safely

-- TRIGGER A: When a new reservation is created (Notify Staff)
CREATE OR REPLACE FUNCTION public.handle_new_reservation_notification()
RETURNS trigger AS $$
DECLARE
  v_student_name TEXT;
  v_staff RECORD;
BEGIN
  -- Get student name safely
  SELECT name INTO v_student_name FROM public.profiles WHERE id = NEW.student_id;
  
  IF v_student_name IS NULL THEN
    v_student_name := 'A student';
  END IF;

  -- Insert notification for EVERY active staff assigned to this shop.
  -- The exception handling catches duplicate unique constraint errors and ignores them securely.
  FOR v_staff IN 
    SELECT sp.user_id 
    FROM public.staff_profiles sp
    WHERE sp.shop_id = NEW.canteen_id
  LOOP
    BEGIN
      INSERT INTO public.notifications (user_id, reservation_id, type, title, message)
      VALUES (
        v_staff.user_id, 
        NEW.id, 
        'reservation_created',
        'New Reservation: ' || NEW.reservation_code,
        v_student_name || ' placed a new reservation.'
      );
    EXCEPTION WHEN unique_violation THEN
      -- Ignore if already created
    END;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_reservation_created_notify_staff
  AFTER INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_reservation_notification();


-- TRIGGER B: When a reservation status changes (Notify Student)
CREATE OR REPLACE FUNCTION public.handle_reservation_status_change_notification()
RETURNS trigger AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_type TEXT;
BEGIN
  -- Only trigger if status ACTUALLY changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Determine type and text based on new status
    IF NEW.status = 'confirmed' THEN
      v_type := 'reservation_confirmed';
      v_title := 'Reservation Confirmed';
      v_message := 'Your reservation ' || NEW.reservation_code || ' has been confirmed by the stall.';
    ELSIF NEW.status = 'ready' THEN
      v_type := 'reservation_ready';
      v_title := 'Order Ready for Pickup';
      v_message := 'Your order ' || NEW.reservation_code || ' is ready! You can pick it up now.';
    ELSIF NEW.status = 'collected' THEN
      v_type := 'reservation_collected';
      v_title := 'Reservation Collected';
      v_message := 'You have collected your reservation ' || NEW.reservation_code || '. Enjoy!';
    ELSIF NEW.status = 'cancelled' THEN
      v_type := 'reservation_cancelled';
      v_title := 'Reservation Cancelled';
      v_message := 'Your reservation ' || NEW.reservation_code || ' has been cancelled.';
    ELSIF NEW.status = 'expired' THEN
      v_type := 'reservation_expired';
      v_title := 'Reservation Expired';
      v_message := 'Your reservation ' || NEW.reservation_code || ' has expired.';
    ELSE
      -- Fallback or unknown status, do nothing
      RETURN NEW;
    END IF;

    -- Insert notification for the student safely
    BEGIN
      INSERT INTO public.notifications (user_id, reservation_id, type, title, message)
      VALUES (
        NEW.student_id, 
        NEW.id, 
        v_type,
        v_title,
        v_message
      );
    EXCEPTION WHEN unique_violation THEN
      -- Ignore duplicate event notifications
    END;
    
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_reservation_status_changed_notify_student
  AFTER UPDATE OF status ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.handle_reservation_status_change_notification();
