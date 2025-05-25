// Script to initialize storage in Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key in environment variables');
  process.exit(1);
}

console.log('Creating Supabase client with URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  try {
    console.log('Checking available buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    console.log('Available buckets:', buckets);
    
    // Check if our target bucket exists
    const documentsExists = buckets?.some(bucket => bucket.id === 'documents');
    
    if (!documentsExists) {
      console.log('Creating documents bucket...');
      const { data, error } = await supabase.storage.createBucket('documents', {
        public: true,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB
      });
      
      if (error) {
        console.error('Error creating documents bucket:', error);
      } else {
        console.log('Documents bucket created successfully:', data);
      }
    } else {
      console.log('Documents bucket already exists');
    }
    
    // Create a test file to verify bucket access
    console.log('Testing bucket access with a small file upload...');
    const testContent = new Blob(['test'], { type: 'text/plain' });
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload('test.txt', testContent, { upsert: true });
    
    if (uploadError) {
      console.error('Error uploading test file:', uploadError);
    } else {
      console.log('Test file uploaded successfully');
    }
    
    // Set up RLS policies
    const policySql = `
      -- Drop existing policies that might be conflicting
      DROP POLICY IF EXISTS "Allow full access to documents bucket" ON storage.objects;
      
      -- Create a simple policy for the documents bucket
      CREATE POLICY "Allow full access to documents bucket" 
      ON storage.objects
      USING (bucket_id = 'documents')
      WITH CHECK (bucket_id = 'documents');
    `;
    
    console.log('Attempting to set up RLS policies...');
    console.log('Note: This will only work if you have rpc privileges.');
    console.log('If this fails, please run the SQL manually in the Supabase dashboard SQL editor.');
    console.log(policySql);
    
    try {
      // This might fail if the user doesn't have rpc privileges
      const { error: rpcError } = await supabase.rpc('execute_sql', { sql_query: policySql });
      
      if (rpcError) {
        console.error('Error setting up RLS policies via RPC:', rpcError);
        console.log('Please run the SQL manually in the Supabase dashboard SQL editor');
      } else {
        console.log('RLS policies set up successfully');
      }
    } catch (err) {
      console.error('Error calling RPC function:', err);
    }
    
    console.log('Storage setup completed');
  } catch (error) {
    console.error('Unexpected error during storage setup:', error);
  }
}

setupStorage().catch(console.error); 