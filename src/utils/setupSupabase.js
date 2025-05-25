// Direct Supabase setup utility using REST API
import fetch from 'node-fetch';
import { supabase } from './supabaseTest.js';

async function setupSupabase() {
  // Get the Supabase service role key from the auth headers
  const headers = supabase.rest.headers;
  const url = supabase.rest.url;
  
  console.log('=== SUPABASE DIRECT SETUP ===');
  console.log('Using Supabase URL:', url);
  
  try {
    // 1. First check if buckets exist
    console.log('\n1. Checking existing buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
    } else {
      console.log('Available buckets:', buckets);
      
      const documentsBucket = buckets?.find(b => b.name === 'documents');
      if (!documentsBucket) {
        console.log('No "documents" bucket found. Please create it manually in the Supabase dashboard.');
        console.log('Storage > New Bucket > Name: "documents" > Check "Public bucket" > Create bucket');
      } else {
        console.log('The "documents" bucket exists:', documentsBucket);
      }
    }
    
    // 2. Try to create the user_documents table directly with SQL
    console.log('\n2. Creating user_documents table...');
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.user_documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        document_path TEXT NOT NULL,
        document_type TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        file_type TEXT NOT NULL,
        upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        public_url TEXT,
        description TEXT,
        tags TEXT[]
      );
      
      CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
      
      ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Allow full access to user_documents" ON user_documents;
      
      CREATE POLICY "Allow full access to user_documents"
      ON user_documents FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
    `;
    
    const { data: sqlResult, error: sqlError } = await supabase.rpc('pgfunction', { sql: createTableSQL });
    
    if (sqlError) {
      console.error('Error creating table with RPC:', sqlError);
      console.log('Please run the SQL in the Supabase dashboard SQL Editor instead.');
    } else {
      console.log('Table creation successful:', sqlResult);
    }
    
    // 3. Check if the user_documents table exists
    console.log('\n3. Checking if user_documents table exists...');
    const { data: tableData, error: tableError } = await supabase
      .from('user_documents')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('Error accessing user_documents table:', tableError);
      
      if (tableError.message.includes('relation "user_documents" does not exist')) {
        console.log('The user_documents table does not exist. Please create it manually using SQL.');
      }
    } else {
      console.log('The user_documents table exists and is accessible.');
    }
    
    console.log('\n=== SETUP COMPLETE ===');
    console.log('If you see any errors above, please follow the manual setup instructions');
    console.log('in the setup-supabase.sql file or create the resources in the Supabase dashboard.');
  } catch (error) {
    console.error('Unexpected error during setup:', error);
  }
}

// Run the setup
setupSupabase(); 