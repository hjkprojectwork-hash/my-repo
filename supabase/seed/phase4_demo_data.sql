-- Seed canteens
INSERT INTO public.canteens (id, name, description, location, staff_name, staff_mobile, type, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Campus Central Canteen', 'Main cafeteria serving hot meals and snacks.', 'Building A', 'Ravi Kumar', '9876543210', 'canteen', true),
  ('22222222-2222-2222-2222-222222222222', 'Campus Bookstore', 'Stationery, textbooks and lab manuals.', 'Building C', 'Sunita Sharma', '8765432109', 'bookstore', true)
ON CONFLICT (id) DO NOTHING;

-- Seed items for canteen
INSERT INTO public.items (canteen_id, name, description, category, price, available_quantity, is_available)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Masala Dosa', 'Crispy dosa with potato filling', 'Breakfast', 45.00, 50, true),
  ('11111111-1111-1111-1111-111111111111', 'Idli', 'Soft steamed rice cakes (2 pcs)', 'Breakfast', 30.00, 100, true),
  ('11111111-1111-1111-1111-111111111111', 'Veg Puff', 'Flaky pastry with mixed veg filling', 'Snacks', 20.00, 30, true),
  ('11111111-1111-1111-1111-111111111111', 'Samosa', 'Deep fried potato snack', 'Snacks', 15.00, 80, true),
  ('11111111-1111-1111-1111-111111111111', 'Tea', 'Hot masala chai', 'Beverages', 12.00, 200, true),
  ('11111111-1111-1111-1111-111111111111', 'Coffee', 'Filter coffee', 'Beverages', 20.00, 150, true),
  ('11111111-1111-1111-1111-111111111111', 'Veg Sandwich', 'Grilled vegetable sandwich', 'Lunch', 35.00, 40, true)
ON CONFLICT DO NOTHING;

-- Seed items for bookstore
INSERT INTO public.items (canteen_id, name, description, category, price, available_quantity, is_available)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'Notebook', '200 pages ruled notebook', 'Stationery', 50.00, 500, true),
  ('22222222-2222-2222-2222-222222222222', 'Pen', 'Blue ballpoint pen', 'Stationery', 10.00, 1000, true),
  ('22222222-2222-2222-2222-222222222222', 'Record Book', 'Hardbound practical record', 'Books', 120.00, 100, true),
  ('22222222-2222-2222-2222-222222222222', 'Lab Manual', 'Physics Lab Manual', 'Books', 80.00, 80, true)
ON CONFLICT DO NOTHING;
