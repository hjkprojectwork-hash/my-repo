-- =============================================================
-- CampusOne — Fix: Assign shop_id to canteen staff accounts
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================

-- ── STEP 1: See what canteens exist ──────────────────────────
SELECT id, name, type, is_active
FROM public.canteens
ORDER BY created_at;

-- ── STEP 2: See current staff profiles (and which have no shop) ──
SELECT
  sp.id,
  au.email,
  sp.name,
  sp.staff_type,
  sp.shop_id,
  CASE WHEN sp.shop_id IS NULL THEN '⚠ NO SHOP' ELSE '✓ assigned' END AS status
FROM public.staff_profiles sp
JOIN auth.users au ON au.id = sp.user_id
ORDER BY sp.staff_type;

-- ── STEP 3: Auto-assign all canteen_staff with no shop_id ────
-- This assigns them to the first active canteen of type 'canteen'.
UPDATE public.staff_profiles
SET
  shop_id    = (SELECT id FROM public.canteens WHERE type = 'canteen' AND is_active = true ORDER BY created_at LIMIT 1),
  updated_at = NOW()
WHERE
  staff_type = 'canteen_staff'
  AND shop_id IS NULL;

-- ── STEP 4: Verify the fix ───────────────────────────────────
SELECT
  sp.name,
  au.email,
  sp.staff_type,
  c.name  AS assigned_canteen,
  c.type  AS canteen_type
FROM public.staff_profiles sp
JOIN auth.users au ON au.id = sp.user_id
LEFT JOIN public.canteens c ON c.id = sp.shop_id
ORDER BY sp.staff_type;
