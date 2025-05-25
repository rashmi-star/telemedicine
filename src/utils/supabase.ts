import { createClient } from '@supabase/supabase-js';

// Supabase project URL
const supabaseUrl = 'https://ajtweyoblhxoslbzykyx.supabase.co';

// Supabase anon key (safe for client-side code) - updated with correct key
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdHdleW9ibGh4b3NsYnp5a3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4NjM0OTQsImV4cCI6MjA1NDQzOTQ5NH0.kO5vpKfkKVf7vJjDl5hqwyvHdSN_cKZ5UmHKdCj3q50';

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = true;

// Log confirmation of Supabase initialization
console.log('Supabase client initialized with project URL:', supabaseUrl);