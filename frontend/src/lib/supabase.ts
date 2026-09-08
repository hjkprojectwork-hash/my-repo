import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Missing Supabase environment variables. Using dummy client for UI development.\n' +
    'Copy .env.example to .env and fill in your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for full functionality.'
  );
}

/**
 * Supabase client — uses only the public anon key.
 * The service-role key is NEVER used in the browser.
 */
export const supabase = createClient<Database>(
  supabaseUrl || 'https://dummy-project.supabase.co',
  supabaseAnonKey || 'dummy-anon-key',
  {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
