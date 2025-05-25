/**
 * This script runs the createBucket.js script with the service role key
 * to create the 'documents' bucket for the application.
 */

// Load environment variables from .env file
require('dotenv').config();

// Load the createBucket script
const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.BUCKET_NAME || 'documents';

// Validate environment variables
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file.');
  process.exit(1);
}

console.log('Creating bucket with service role key (admin privileges)');
console.log('URL:', supabaseUrl);
console.log('Bucket name:', bucketName);

// Initialize Supabase client with service_role key (admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Create a new storage bucket and set up policies
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
    
    console.log('Current buckets:', buckets?.map(b => b.name).join(', ') || 'No buckets found');
    
    // Check if our bucket already exists
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (bucketExists) {
      console.log(`Bucket '${bucketName}' already exists.`);
      
      // Add SQL policies if it exists
      await setupBucketPolicies();
      return;
    }
    
    // Create the bucket
    console.log(`Creating new bucket: ${bucketName}`);
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: false,  // Private bucket for security
      fileSizeLimit: 52428800, // 50MB in bytes
      allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf', 'text/plain']
    });
    
    if (error) {
      console.error('Error creating bucket:', error.message);
      process.exit(1);
    }
    
    console.log(`✅ Success! Bucket '${bucketName}' created successfully.`);
    
    // Set up policies
    await setupBucketPolicies();
    
  } catch (err) {
    console.error('Unexpected error creating bucket:', err.message);
    process.exit(1);
  }
}

/**
 * Set up proper RLS policies for the bucket
 */
async function setupBucketPolicies() {
  console.log('Setting up Row Level Security (RLS) policies...');
  
  try {
    // Create permissive RLS policies for the bucket
    // This allows authenticated users to perform all operations
    const createPolicySql = `
      -- Drop any existing policies
      DROP POLICY IF EXISTS "Allow public access to documents bucket" ON storage.objects;
      DROP POLICY IF EXISTS "Allow authenticated access to documents bucket" ON storage.objects;
      
      -- Create a policy that allows authenticated users to do everything
      CREATE POLICY "Allow authenticated access to documents bucket"
      ON storage.objects FOR ALL
      TO authenticated
      USING (bucket_id = '${bucketName}')
      WITH CHECK (bucket_id = '${bucketName}');
      
      -- Create a policy that allows anon users to read
      CREATE POLICY "Allow public read access to documents bucket"
      ON storage.objects FOR SELECT
      TO anon
      USING (bucket_id = '${bucketName}');
    `;
    
    // Run the SQL query using supabase-js (requires v2.5.0 or later)
    const { error } = await supabase.rpc('pgadmin_exec_sql', { 
      sql: createPolicySql 
    });
    
    if (error) {
      // If the rpc method isn't available, provide alternate instructions
      console.warn('Warning: Could not set RLS policies automatically:', error.message);
      console.warn('Please run the SQL in bucket-policy.sql manually in the Supabase SQL editor.');
    } else {
      console.log('✅ RLS policies set up successfully.');
    }
  } catch (err) {
    console.warn('Could not set up policies automatically:', err.message);
    console.warn('You may need to configure bucket policies manually in the Supabase dashboard.');
  }
}

// Execute the function
createBucket().then(() => {
  console.log('Script execution completed.');
}); 