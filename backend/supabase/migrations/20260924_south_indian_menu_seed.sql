-- =============================================================================
-- CAMPUSONE — South Indian Canteen Menu Seed Migration
-- File: 20260924_south_indian_menu_seed.sql
-- Purpose: Insert realistic South Indian canteen menu items for the canteen
--          shop. This script is IDEMPOTENT — safe to run multiple times.
--
-- SAFETY:
--   - Uses INSERT ... ON CONFLICT DO NOTHING to never overwrite existing items.
--   - Does NOT drop or delete any existing data.
--   - Does NOT alter any table schema.
--   - Does NOT touch bookstore items, reservations, or any other table.
--   - Requires an existing canteen row in the canteens/shops table.
--
-- USAGE:
--   1. Open Supabase Dashboard → SQL Editor
--   2. First run the AUDIT block to find your canteen ID
--   3. Replace <YOUR_CANTEEN_ID> with the actual UUID
--   4. Run the INSERT block
-- =============================================================================

-- ── STEP 1: AUDIT — Find the canteen shop ID ──────────────────────────────────
-- Run this first to get the correct canteen_id:
/*
SELECT id, name, type
FROM canteens
ORDER BY created_at;
*/

-- ── STEP 2: Verify the items table structure ───────────────────────────────────
-- Run this to see available columns:
/*
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'items'
ORDER BY ordinal_position;
*/

-- ── STEP 3: INSERT South Indian Menu Items ─────────────────────────────────────
-- Replace <YOUR_CANTEEN_ID> with the UUID from STEP 1 before running.
-- Example: '550e8400-e29b-41d4-a716-446655440000'

DO $$
DECLARE
  v_canteen_id UUID;
BEGIN
  -- Auto-detect the first canteen of type 'canteen' or fallback to first canteen
  SELECT id INTO v_canteen_id
  FROM canteens
  WHERE type = 'canteen'
  ORDER BY created_at
  LIMIT 1;

  IF v_canteen_id IS NULL THEN
    SELECT id INTO v_canteen_id FROM canteens ORDER BY created_at LIMIT 1;
  END IF;

  IF v_canteen_id IS NULL THEN
    RAISE EXCEPTION 'No canteen found. Please create a canteen entry first.';
  END IF;

  RAISE NOTICE 'Using canteen_id: %', v_canteen_id;

  -- ── TIFFINS ──────────────────────────────────────────────────────────────────
  INSERT INTO items (canteen_id, name, description, price, category, available_quantity, is_available, created_at)
  VALUES
    (v_canteen_id, 'Plain Dosa',         'Thin crispy dosa served with coconut chutney & sambar', 30, 'Tiffins', 50, true, now()),
    (v_canteen_id, 'Masala Dosa',        'Crispy dosa stuffed with spiced potato masala, with coconut chutney & sambar', 45, 'Tiffins', 50, true, now()),
    (v_canteen_id, 'Butter Dosa',        'Golden crispy dosa with generous butter, coconut chutney & sambar', 40, 'Tiffins', 40, true, now()),
    (v_canteen_id, 'Onion Dosa',         'Crispy dosa topped with caramelised onion, served with chutney', 40, 'Tiffins', 40, true, now()),
    (v_canteen_id, 'Paneer Dosa',        'Soft dosa loaded with spiced paneer filling & chutneys', 55, 'Tiffins', 30, true, now()),
    (v_canteen_id, 'Idli (2 pcs)',        'Fluffy steamed idli served with coconut chutney & sambar', 25, 'Tiffins', 60, true, now()),
    (v_canteen_id, 'Ghee Idli (2 pcs)',  'Soft idli drizzled with pure ghee, served with chutney', 35, 'Tiffins', 40, true, now()),
    (v_canteen_id, 'Medu Vada',          'Crispy golden urad dal vada served with chutney & sambar', 30, 'Tiffins', 50, true, now()),
    (v_canteen_id, 'Sambar Vada',        'Medu vada dunked in hot sambar with chutneys', 35, 'Tiffins', 40, true, now()),
    (v_canteen_id, 'Pongal',             'Comforting rice & lentil pongal with ghee, pepper & cashews', 40, 'Tiffins', 40, true, now()),
    (v_canteen_id, 'Upma',               'Semolina upma tempered with mustard, curry leaves & vegetables', 30, 'Tiffins', 40, true, now()),
    (v_canteen_id, 'Poori (2 pcs)',      'Puffed fried bread served with potato masala & chutney', 35, 'Tiffins', 35, true, now())
  ON CONFLICT DO NOTHING;

  -- ── CURRIES ──────────────────────────────────────────────────────────────────
  INSERT INTO items (canteen_id, name, description, price, category, available_quantity, is_available, created_at)
  VALUES
    (v_canteen_id, 'Paneer Butter Masala',      'Rich creamy tomato-butter gravy with soft paneer cubes', 70, 'Curries', 30, true, now()),
    (v_canteen_id, 'Kadai Paneer',               'Paneer tossed with capsicum & onion in spiced kadai gravy', 70, 'Curries', 30, true, now()),
    (v_canteen_id, 'Dal Tadka',                  'Yellow dal tempered with cumin, garlic & ghee', 45, 'Curries', 40, true, now()),
    (v_canteen_id, 'Aloo Fry',                   'Crispy potato fry with mustard, turmeric & curry leaves', 35, 'Curries', 40, true, now()),
    (v_canteen_id, 'Chana Masala',               'Spiced chickpea curry in tangy tomato-onion gravy', 55, 'Curries', 35, true, now()),
    (v_canteen_id, 'Mixed Vegetable Curry',      'Seasonal vegetables in mildly spiced coconut-tomato gravy', 50, 'Curries', 35, true, now()),
    (v_canteen_id, 'Egg Curry',                  'Boiled eggs in rich spiced onion-tomato gravy', 55, 'Curries', 25, true, now()),
    (v_canteen_id, 'Chicken Curry',              'Tender chicken pieces in South Indian spiced curry', 80, 'Curries', 20, true, now())
  ON CONFLICT DO NOTHING;

  -- ── MEALS ────────────────────────────────────────────────────────────────────
  INSERT INTO items (canteen_id, name, description, price, category, available_quantity, is_available, created_at)
  VALUES
    (v_canteen_id, 'South Indian Meals',  'Rice, dal, sambar, rasam, two curries, papad & pickle', 80, 'Meals', 50, true, now()),
    (v_canteen_id, 'Mini Meals',          'Rice, dal, one curry, sambar & papad', 55, 'Meals', 40, true, now()),
    (v_canteen_id, 'Veg Meals',           'Full vegetarian spread with rice, multiple curries & curd', 75, 'Meals', 40, true, now()),
    (v_canteen_id, 'Curd Rice',           'Creamy curd rice tempered with mustard & curry leaves', 40, 'Meals', 40, true, now()),
    (v_canteen_id, 'Lemon Rice',          'Tangy lemon-flavored rice with peanuts & tempering', 40, 'Meals', 40, true, now()),
    (v_canteen_id, 'Jeera Rice',          'Fragrant basmati rice tempered with cumin seeds', 35, 'Meals', 40, true, now())
  ON CONFLICT DO NOTHING;

  -- ── BEVERAGES ────────────────────────────────────────────────────────────────
  INSERT INTO items (canteen_id, name, description, price, category, available_quantity, is_available, created_at)
  VALUES
    (v_canteen_id, 'Filter Coffee',   'Strong South Indian decoction coffee with milk & sugar', 20, 'Beverages', 100, true, now()),
    (v_canteen_id, 'Tea',             'Classic Indian masala tea with ginger & cardamom', 15, 'Beverages', 100, true, now()),
    (v_canteen_id, 'Masala Tea',      'Strongly brewed spiced chai with ginger, cardamom & clove', 20, 'Beverages', 80, true, now()),
    (v_canteen_id, 'Cold Coffee',     'Chilled blended coffee with milk & sugar, served cold', 40, 'Beverages', 40, true, now()),
    (v_canteen_id, 'Buttermilk',      'Chilled spiced buttermilk with cumin, coriander & mint', 20, 'Beverages', 60, true, now()),
    (v_canteen_id, 'Fresh Lime',      'Fresh lime juice with sugar & salt, served chilled', 25, 'Beverages', 60, true, now()),
    (v_canteen_id, 'Mango Juice',     'Chilled fresh mango fruit juice', 35, 'Beverages', 40, true, now())
  ON CONFLICT DO NOTHING;

  -- ── SNACKS ───────────────────────────────────────────────────────────────────
  INSERT INTO items (canteen_id, name, description, price, category, available_quantity, is_available, created_at)
  VALUES
    (v_canteen_id, 'Samosa (2 pcs)',      'Crispy pastry stuffed with spiced potato & peas, with mint chutney', 25, 'Snacks', 60, true, now()),
    (v_canteen_id, 'Punugulu',            'Crispy urad dal fritters served with coconut chutney & sambar', 30, 'Snacks', 50, true, now()),
    (v_canteen_id, 'Bajji (4 pcs)',       'Batter-fried fritters with onion & chutney', 30, 'Snacks', 40, true, now()),
    (v_canteen_id, 'Mirchi Bajji',        'Whole green chilli stuffed with spiced filling, batter fried', 25, 'Snacks', 40, true, now()),
    (v_canteen_id, 'Cutlet (2 pcs)',      'Crispy vegetable cutlets served with green chutney', 35, 'Snacks', 30, true, now()),
    (v_canteen_id, 'Bread Omelette',      'Fluffy egg omelette with buttered toast', 40, 'Snacks', 25, true, now())
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'South Indian menu seed complete for canteen: %', v_canteen_id;
END $$;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Run after seed to confirm items were inserted:
/*
SELECT category, COUNT(*) as count, MIN(price) as min_price, MAX(price) as max_price
FROM items
GROUP BY category
ORDER BY category;
*/
