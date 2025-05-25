// Test script to verify Supabase connection
const { createClient } = require('@supabase/supabase-js');

// Supabase project URL
const supabaseUrl = 'https://ajtweyoblhxoslbzykyx.supabase.co';

// Supabase anon key - use the correct format
// This is a placeholder - the actual key structure should be:
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMDQwNjMxMiwiZXhwIjoxOTQ1OTgyMzEyfQ.YourSignatureHere
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdHdleW9ibGh4b3NsYnp5a3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4NjM0OTQsImV4cCI6MjA1NDQzOTQ5NH0.EwYQ8a1-1x4K8DRIm4Ru3vGfWQT60NnwI76T7D56wz8';

// Create the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if the key looks valid (basic format check)
function validateApiKey(key) {
  // Should have 3 segments separated by periods
  const parts = key.split('.');
  if (parts.length !== 3) {
    console.warn('API key does not have the expected JWT format (3 parts separated by periods)');
    return false;
  }
  
  try {
    // Try to parse the middle segment (payload)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('API key payload:', payload);
    
    // Check for essential fields
    if (!payload.role) {
      console.warn('API key payload is missing the "role" field');
    }
    
    return true;
  } catch (err) {
    console.warn('Failed to parse API key payload:', err.message);
    return false;
  }
}

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  // Validate the API key format first
  const isValidFormat = validateApiKey(supabaseAnonKey);
  console.log('API key format valid:', isValidFormat);
  
  try {
    // Try to get public information from Supabase
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error connecting to Supabase:', error.message);
      return;
    }
    
    console.log('Successfully connected to Supabase!');
    console.log('Session data:', data ? 'Available' : 'None (expected for anon)');
    
    // Test bucket access
    console.log('\nTesting bucket access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error accessing storage buckets:', bucketsError.message);
      return;
    }
    
    console.log('Successfully accessed storage buckets!');
    console.log('Available buckets:', buckets?.map(b => b.name).join(', ') || 'No buckets found');
    
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

// Run the test
testConnection(); 