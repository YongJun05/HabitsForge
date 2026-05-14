/**
 * Supabase client singleton.
 * Reads URL and anon key from environment variables — these are
 * set in the .env file and are safe to expose client-side (anon key only).
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Use safe fallbacks so the app can render a setup screen without crashing.
export const supabase = createClient(
  supabaseUrl ?? 'http://localhost',
  supabaseAnonKey ?? 'anon'
);
