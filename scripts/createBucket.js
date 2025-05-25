/**
 * Supabase Storage Bucket Creation Script
 * 
 * IMPORTANT SECURITY NOTE:
 * This script uses the Supabase service_role key which has admin privileges.
 * NEVER run this script on the frontend or expose this key in client-side code.
 * This should only be executed in a secure backend environment.
 */

// Load environment variables
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.BUCKET_NAME || 'my-bucket-name';

// Validate environment variables
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file.');
  process.exit(1);
}

// Initialize Supabase client with service_role key (admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Create a new storage bucket
 */
async function createBucket() {
  console.log(`Attempting to create bucket '${bucketName}'...`);
  
  try {
    // First check if the bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError.message);
      process.exit(1);
    }
    
    // Check if our bucket already exists
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (bucketExists) {
      console.log(`Bucket '${bucketName}' already exists.`);
      return;
    }
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: false,  // Set to true if you want the bucket to be publicly accessible
      fileSizeLimit: 52428800, // 50MB in bytes
      allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf', 'text/plain']
    });
    
    if (error) {
      console.error('Error creating bucket:', error.message);
      process.exit(1);
    }
    
    console.log(`✅ Success! Bucket '${bucketName}' created successfully.`);
    
    // Optionally set up RLS policies here
    console.log('Setting up Row Level Security (RLS) policies...');
    
    // Example: Allow authenticated users to upload files
    const { error: policyError } = await supabase.storage.from(bucketName).createPolicy(
      'authenticated can upload',
      {
        role: 'authenticated',
        definition: {
          in: { obj: ['insert'] }
        }
      }
    );
    
    if (policyError) {
      console.warn('Warning: Could not set RLS policy:', policyError.message);
      console.warn('You may need to configure bucket policies manually in the Supabase dashboard.');
    } else {
      console.log('✅ RLS policies set up successfully.');
    }
    
  } catch (err) {
    console.error('Unexpected error creating bucket:', err.message);
    process.exit(1);
  }
}

// Execute the function
createBucket().then(() => {
  console.log('Script execution completed.');
}); 