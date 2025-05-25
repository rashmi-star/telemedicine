// Simple Supabase test client
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Function to load environment variables from .env file
function loadEnv() {
  try {
    // Try to find .env file in project root
    const envPath = path.resolve(process.cwd(), '.env');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = {};
      
      // Parse each line
      envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          
          // Remove quotes if present
          if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
            value = value.replace(/^"|"$/g, '');
          }
          
          envVars[key] = value;
        }
      });
      
      return envVars;
    }
  } catch (error) {
    console.error('Error loading .env file:', error);
  }
  
  return {};
}

// Load environment variables
const env = loadEnv();

// Hardcoded fallback values (replace with your actual values)
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://llnrbqtnjaleqpnpldfo.supabase.co';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsbnJicXRuamFsZXFwbnBsZGZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU1NzQwODcsImV4cCI6MjAzMTE1MDA4N30.4TjWxuYzngxCTr1wwqbD81XZaXChExbhsw4iDDUjpP0';

console.log('Using Supabase URL:', supabaseUrl);
console.log('Using Supabase Key:', supabaseKey.substring(0, 10) + '...');

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Export a test function
export async function testBuckets() {
  try {
    console.log('Testing bucket access...');
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error accessing buckets:', error);
      return { success: false, error };
    }
    
    console.log('Available buckets:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error };
  }
} 