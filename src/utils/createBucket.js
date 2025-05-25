// Script to create the documents bucket
import { supabase } from './supabaseTest.js';

async function createDocumentsBucket() {
  console.log('=== BUCKET CREATION TEST ===');
  
  try {
    // Check existing buckets
    console.log('Checking existing buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    console.log('Available buckets:', buckets);
    
    // Check if documents bucket already exists
    const documentsExists = buckets?.some(bucket => 
      bucket.name === 'documents' || 
      bucket.id === 'documents'
    );
    
    if (documentsExists) {
      console.log('The "documents" bucket already exists, no need to create it.');
      return;
    }
    
    // Create the documents bucket
    console.log('Creating documents bucket...');
    const { data, error } = await supabase.storage.createBucket('documents', {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB
    });
    
    if (error) {
      console.error('Error creating bucket:', error);
      
      if (error.message.includes('violates row-level security policy')) {
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
      console.log('Bucket created successfully:', data);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
  
  console.log('=== TEST COMPLETE ===');
}

// Run the function
createDocumentsBucket(); 