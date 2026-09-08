import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateCanteens() {
  console.log('Updating canteens with staff_mobile...');
  
  const { data, error } = await supabase
    .from('canteens')
    .update({ staff_mobile: '919059297815' })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // update all
    
  if (error) {
    console.error('Error updating canteens:', error);
  } else {
    console.log('Successfully updated canteens:', data);
  }
}

updateCanteens();
