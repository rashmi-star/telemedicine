import { createClient } from '@supabase/supabase-js';

// Initialize with empty values to prevent immediate crash
let supabaseUrl = '';
let supabaseKey = '';

try {
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
} catch (error) {
  console.warn('Supabase environment variables not found');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);