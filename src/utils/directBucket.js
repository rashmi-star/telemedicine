// Script to directly create and test a bucket with the Supabase SDK
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Function to load environment variables from .env file
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = {};
      
      envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          
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

async function createBucket() {
  console.log('=== CREATE BUCKET DIRECTLY ===');
  
  // Load environment variables
  const env = loadEnv();
  
  // Create a Supabase client
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    return;
  }
  
  console.log('Using Supabase URL:', supabaseUrl);
  console.log('Using Supabase Key:', supabaseKey.substring(0, 10) + '...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // List existing buckets
    console.log('\nListing existing buckets...');
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    console.log('Existing buckets:', existingBuckets);
    
    // Check if the documents bucket already exists
    const documentsExists = existingBuckets?.some(bucket => 
      bucket.name === 'documents' || 
      bucket.id === 'documents'
    );
    
    if (documentsExists) {
      console.log('The "documents" bucket already exists, no need to create it.');
      
      // Try to get the existing bucket details
      for (const bucket of existingBuckets) {
        if (bucket.name === 'documents' || bucket.id === 'documents') {
          console.log('Found bucket details:', bucket);
        }
      }
    } else {
      // Create the documents bucket
      console.log('\nCreating "documents" bucket...');
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('documents', {
        public: true,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        
        if (createError.message.includes('violates row-level security policy')) {
          console.log('\n⚠️ ROW LEVEL SECURITY ERROR:');
          console.log('You do not have permission to create buckets.');
          console.log('Please create the bucket manually in the Supabase dashboard:');
          console.log('1. Go to Storage in your Supabase dashboard');
          console.log('2. Click "New Bucket"');
          console.log('3. Enter "documents" as the bucket name');
          console.log('4. Make sure "Public bucket" is checked');
          console.log('5. Click "Create bucket"');
        }
      } else {
        console.log('Bucket created successfully:', newBucket);
      }
    }
    
    // Test uploading a file to the bucket
    console.log('\nTesting file upload to the documents bucket...');
    const testData = 'This is a test file';
    const testBlob = new Blob([testData], { type: 'text/plain' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload('test.txt', testBlob, { upsert: true });
    
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
    } else {
      console.log('Test file uploaded successfully:', uploadData);
    }
    
    // Check for bucket policies
    console.log('\nChecking storage policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('storage')
      .select('policies')
      .limit(1);
      
    if (policiesError) {
      console.error('Error checking policies:', policiesError);
    } else {
      console.log('Storage policies:', policies);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
  
  console.log('\n=== BUCKET CREATION COMPLETE ===');
}

// Run the function
createBucket(); 