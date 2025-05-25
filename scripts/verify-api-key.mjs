// Script to verify Supabase API key with direct fetch
import fetch from 'node-fetch';

// Supabase credentials
const SUPABASE_URL = 'https://ajtweyoblhxoslbzykyx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdHdleW9ibGh4b3NsYnp5a3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4NjM0OTQsImV4cCI6MjA1NDQzOTQ5NH0.kO5vpKfkKVf7vJjDl5hqwyvHdSN_cKZ5UmHKdCj3q50';

console.log('Testing Supabase API key...');
console.log('URL:', SUPABASE_URL);
console.log('Key:', SUPABASE_KEY.slice(0, 10) + '...' + SUPABASE_KEY.slice(-10));

async function verifyApiKey() {
  try {
    // Test 1: Check storage buckets
    console.log('\nTesting storage API...');
    const bucketResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    const bucketData = await bucketResponse.json();
    console.log('Storage API status:', bucketResponse.status);
    console.log('Storage API response:', bucketData);
    
    if (bucketResponse.ok) {
      console.log('✅ Storage API access successful');
    } else {
      console.log('❌ Storage API access failed');
    }
    
    // Test 2: Check auth API
    console.log('\nTesting auth API...');
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    console.log('Auth API status:', authResponse.status);
    
    if (authResponse.status !== 401) { // 401 is expected for unauthenticated users
      console.log('✅ Auth API connection successful');
    } else {
      console.log('❌ Auth API connection failed');
    }
    
  } catch (error) {
    console.error('Error testing API key:', error);
  }
}

verifyApiKey(); 