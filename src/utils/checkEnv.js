// Script to check Supabase environment variables
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Function to load environment variables from .env file
function loadEnv() {
  try {
    // Check multiple locations for .env file
    const possiblePaths = [
      path.resolve(process.cwd(), '.env'),
      path.resolve(process.cwd(), '../.env'),
      path.resolve(process.cwd(), '../../.env'),
    ];
    
    for (const envPath of possiblePaths) {
      if (fs.existsSync(envPath)) {
        console.log('Found .env file at:', envPath);
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
    }
    
    console.log('No .env file found in standard locations');
  } catch (error) {
    console.error('Error loading .env file:', error);
  }
  
  return {};
}

// Also check for environment variables in .env.local file which Vite uses
function loadViteEnv() {
  try {
    const possiblePaths = [
      path.resolve(process.cwd(), '.env.local'),
      path.resolve(process.cwd(), '.env.development.local'),
      path.resolve(process.cwd(), '.env.production.local'),
    ];
    
    for (const envPath of possiblePaths) {
      if (fs.existsSync(envPath)) {
        console.log('Found Vite env file at:', envPath);
        const envContent = fs.readFileSync(envPath, 'utf8');
        return envContent;
      }
    }
  } catch (error) {
    console.error('Error loading Vite env files:', error);
  }
  
  return null;
}

// Check for Supabase environment variables
async function checkSupabaseEnv() {
  console.log('=== SUPABASE ENVIRONMENT CHECK ===');
  
  // Load environment variables
  const env = loadEnv();
  const viteEnv = loadViteEnv();
  
  console.log('Checking for Supabase environment variables...');
  
  // Check for VITE_SUPABASE_URL
  if (env.VITE_SUPABASE_URL) {
    console.log('✅ VITE_SUPABASE_URL found in .env file:', env.VITE_SUPABASE_URL);
  } else {
    console.log('❌ VITE_SUPABASE_URL not found in .env file');
  }
  
  // Check for VITE_SUPABASE_ANON_KEY
  if (env.VITE_SUPABASE_ANON_KEY) {
    console.log('✅ VITE_SUPABASE_ANON_KEY found in .env file:', env.VITE_SUPABASE_ANON_KEY.substring(0, 10) + '...');
  } else {
    console.log('❌ VITE_SUPABASE_ANON_KEY not found in .env file');
  }
  
  // If Vite env files exist, show that they might be used
  if (viteEnv) {
    console.log('\nFound Vite environment file(s) that might be used instead of .env:');
    console.log(viteEnv);
  }
  
  // Try to create a Supabase client with the found credentials
  if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY) {
    console.log('\nTrying to connect to Supabase with found credentials...');
    
    try {
      const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
      
      // Test authentication
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('❌ Auth connection failed:', authError);
      } else {
        console.log('✅ Auth connection successful');
      }
      
      // Test storage
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('❌ Storage connection failed:', bucketsError);
      } else {
        console.log('✅ Storage connection successful');
        console.log('Available buckets:', buckets);
      }
    } catch (error) {
      console.error('❌ Error connecting to Supabase:', error);
    }
  } else {
    console.log('\n❌ Cannot connect to Supabase: Missing credentials');
  }
  
  console.log('\n=== ENVIRONMENT CHECK COMPLETE ===');
  console.log('\nIf you see any issues above, make sure your .env file contains:');
  console.log('VITE_SUPABASE_URL=https://your-project-id.supabase.co');
  console.log('VITE_SUPABASE_ANON_KEY=your-anon-key');
}

// Run the check
checkSupabaseEnv(); 