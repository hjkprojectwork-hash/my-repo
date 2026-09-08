DO $$ 
DECLARE
  v_canteen_id UUID;
  v_canteen_name TEXT := 'Campus Central Canteen';
  v_user_id UUID;
  v_staff_mobile TEXT := '919059297815';
BEGIN
  -- Insert or Get Canteen
  SELECT id INTO v_canteen_id FROM public.canteens WHERE name = v_canteen_name LIMIT 1;
  IF v_canteen_id IS NULL THEN
    INSERT INTO public.canteens (name, description, location, type, staff_mobile, is_active)
    VALUES (v_canteen_name, 'Main campus canteen for snacks and beverages', 'Block A', 'canteen', v_staff_mobile, true)
    RETURNING id INTO v_canteen_id;
  ELSE
    -- Always keep staff_mobile in sync on the canteens table (this is what the UI reads)
    UPDATE public.canteens SET staff_mobile = v_staff_mobile WHERE id = v_canteen_id;
  END IF;

  -- Create dummy auth user for staff
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'demostaff@campusone.com' LIMIT 1;
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'demostaff@campusone.com', 'dummy_hash', NOW(), '{"provider":"email","providers":["email"]}', '{"role":"canteen_staff","name":"Demo Staff","mobile_number":"' || v_staff_mobile || '","staff_type":"canteen_staff"}', NOW(), NOW());
  END IF;

  -- The trigger might have inserted into staff_profiles. Let's update it or insert if missing.
  IF NOT EXISTS (SELECT 1 FROM public.staff_profiles WHERE user_id = v_user_id) THEN
    INSERT INTO public.staff_profiles (user_id, name, mobile, staff_type, shop_id)
    VALUES (v_user_id, 'Demo Staff', v_staff_mobile, 'canteen_staff', v_canteen_id);
  ELSE
    UPDATE public.staff_profiles SET mobile = v_staff_mobile, shop_id = v_canteen_id WHERE user_id = v_user_id;
  END IF;

  -- Delete existing demo items to prevent duplicates (idempotent)
  DELETE FROM public.items WHERE canteen_id = v_canteen_id AND category IN ('Chips', 'Biscuits', 'Chocolates', 'Ice Creams', 'Meals');

  -- Insert Demo Categories / Items
  -- CHIPS
  INSERT INTO public.items (canteen_id, name, description, category, price, image_url, available_quantity, is_available) VALUES
  (v_canteen_id, 'Lays Classic Salted', 'Classic salted potato chips', 'Chips', 20.00, 'https://images.unsplash.com/photo-1566478989037-e824ce0a465e?w=500&q=80', 50, true),
  (v_canteen_id, 'Lays Magic Masala', 'Spicy masala potato chips', 'Chips', 20.00, 'https://images.unsplash.com/photo-1629889728286-63e264104c96?w=500&q=80', 50, true),
  (v_canteen_id, 'Lays Cream & Onion', 'Sour cream and onion chips', 'Chips', 20.00, 'https://images.unsplash.com/photo-1599599811450-2b508f7d8f28?w=500&q=80', 50, true);

  -- BISCUITS
  INSERT INTO public.items (canteen_id, name, description, category, price, image_url, available_quantity, is_available) VALUES
  (v_canteen_id, 'Oreo', 'Chocolate cookie with vanilla cream', 'Biscuits', 30.00, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&q=80', 50, true),
  (v_canteen_id, 'Parle-G', 'Original glucose biscuits', 'Biscuits', 10.00, 'https://images.unsplash.com/photo-1557089706-68d02dbda3c8?w=500&q=80', 100, true),
  (v_canteen_id, 'Bourbon', 'Chocolate sandwich biscuits', 'Biscuits', 25.00, 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=500&q=80', 40, true),
  (v_canteen_id, 'Good Day', 'Butter cookies with nuts', 'Biscuits', 20.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80', 60, true),
  (v_canteen_id, 'Hide & Seek', 'Chocolate chip cookies', 'Biscuits', 35.00, 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&q=80', 40, true);

  -- CHOCOLATES
  INSERT INTO public.items (canteen_id, name, description, category, price, image_url, available_quantity, is_available) VALUES
  (v_canteen_id, 'Dairy Milk', 'Classic milk chocolate', 'Chocolates', 40.00, 'https://images.unsplash.com/photo-1614088685112-0a760b71a3c8?w=500&q=80', 30, true),
  (v_canteen_id, 'Dairy Milk Silk', 'Smooth premium chocolate', 'Chocolates', 80.00, 'https://images.unsplash.com/photo-1511381939415-e440c94625f3?w=500&q=80', 20, true),
  (v_canteen_id, 'KitKat', 'Crispy wafer fingers in chocolate', 'Chocolates', 25.00, 'https://images.unsplash.com/photo-1582236371520-7fbfdc3283be?w=500&q=80', 50, true),
  (v_canteen_id, '5 Star', 'Caramel and nougat chocolate', 'Chocolates', 20.00, 'https://images.unsplash.com/photo-1629886470068-12d787d5dc68?w=500&q=80', 40, true),
  (v_canteen_id, 'Perk', 'Crispy chocolate wafer', 'Chocolates', 10.00, 'https://images.unsplash.com/photo-1614088685112-0a760b71a3c8?w=500&q=80', 60, true);

  -- ICE CREAMS
  INSERT INTO public.items (canteen_id, name, description, category, price, image_url, available_quantity, is_available) VALUES
  (v_canteen_id, 'Vanilla Cup', 'Classic vanilla ice cream', 'Ice Creams', 30.00, 'https://images.unsplash.com/photo-1570197781417-0a5237500ee3?w=500&q=80', 20, true),
  (v_canteen_id, 'Chocolate Cup', 'Rich chocolate ice cream', 'Ice Creams', 35.00, 'https://images.unsplash.com/photo-1557142046-c704a3adf817?w=500&q=80', 20, true),
  (v_canteen_id, 'Butterscotch Cup', 'Crunchy butterscotch ice cream', 'Ice Creams', 35.00, 'https://images.unsplash.com/photo-1563805042-7684c8a9e9cb?w=500&q=80', 20, true),
  (v_canteen_id, 'Strawberry Cup', 'Fruity strawberry ice cream', 'Ice Creams', 30.00, 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500&q=80', 20, true),
  (v_canteen_id, 'Choco Bar', 'Chocolate coated vanilla ice cream', 'Ice Creams', 40.00, 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=500&q=80', 25, true);

  -- MEALS
  INSERT INTO public.items (canteen_id, name, description, category, price, image_url, available_quantity, is_available) VALUES
  (v_canteen_id, 'Chicken Curry Meal', 'Spicy chicken curry served with rice and paratha', 'Meals', 120.00, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&q=80', 30, true),
  (v_canteen_id, 'Veg Thali', 'Assorted vegetables, dal, rice, roti, and sweet', 'Meals', 90.00, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&q=80', 40, true),
  (v_canteen_id, 'Paneer Butter Masala', 'Rich and creamy paneer curry with naan', 'Meals', 140.00, 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=500&q=80', 25, true),
  (v_canteen_id, 'Egg Biryani', 'Aromatic basmati rice cooked with boiled eggs and spices', 'Meals', 100.00, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80', 35, true);

END $$;
