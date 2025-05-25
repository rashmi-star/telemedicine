// Test Supabase connection and permissions
import { supabase } from './supabaseTest.js';

async function testConnection() {
  console.log('=== SUPABASE CONNECTION TEST ===');
  
  try {
    // Test auth connection
    console.log('\n1. Testing auth connection...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth connection failed:', authError);
    } else {
      console.log('✅ Auth connection successful');
      console.log('Session:', authData?.session ? 'Active' : 'No active session');
    }
    
    // Test storage access
    console.log('\n2. Testing storage access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Storage access failed:', bucketsError);
    } else {
      console.log('✅ Storage access successful');
      console.log('Available buckets:', buckets);
      
      if (buckets.length === 0) {
        console.log('⚠️ No buckets found. You need to create a bucket named "documents".');
      } else {
        const hasBucket = buckets.some(b => b.name === 'documents');
        if (!hasBucket) {
          console.log('⚠️ No bucket named "documents" found. You need to create it.');
        } else {
          console.log('✅ "documents" bucket exists');
        }
      }
    }
    
    // Test database access
    console.log('\n3. Testing database access...');
    const { data: dbData, error: dbError } = await supabase
      .from('user_documents')
      .select('id')
      .limit(1);
    
    if (dbError) {
      console.error('❌ Database access failed:', dbError);
      
      if (dbError.message.includes('relation "user_documents" does not exist')) {
        console.log('⚠️ The "user_documents" table does not exist. You need to create it.');
      } else if (dbError.message.includes('permission denied')) {
        console.log('⚠️ Permission denied. Check RLS policies for the "user_documents" table.');
      }
    } else {
      console.log('✅ Database access successful');
      console.log('Records found:', dbData.length);
    }
    
    // Test RLS policies
    console.log('\n4. Testing authenticated upload...');
    if (!authData?.session) {
      console.log('⚠️ No active session. Sign in first to test authenticated upload.');
    } else {
      const testFile = new Blob(['test'], { type: 'text/plain' });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload('test.txt', testFile, { upsert: true });
      
      if (uploadError) {
        console.error('❌ Authenticated upload failed:', uploadError);
      } else {
        console.log('✅ Authenticated upload successful');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error during testing:', error);
  }
  
  console.log('\n=== TEST COMPLETE ===');
}

// Run the test
testConnection(); 