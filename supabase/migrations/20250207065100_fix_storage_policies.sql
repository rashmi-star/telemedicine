-- Create documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated selects" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Create a simple policy for the documents bucket
CREATE POLICY "Allow full access to documents bucket" 
ON storage.objects
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- Fix user_documents table policies
DROP POLICY IF EXISTS select_own_documents ON user_documents;
DROP POLICY IF EXISTS insert_own_documents ON user_documents;
DROP POLICY IF EXISTS update_own_documents ON user_documents;
DROP POLICY IF EXISTS delete_own_documents ON user_documents;
DROP POLICY IF EXISTS "Allow authenticated to select user_documents" ON user_documents;
DROP POLICY IF EXISTS "Allow authenticated to insert user_documents" ON user_documents;
DROP POLICY IF EXISTS "Allow authenticated to update user_documents" ON user_documents;
DROP POLICY IF EXISTS "Allow authenticated to delete user_documents" ON user_documents;

-- Make sure the table exists
CREATE TABLE IF NOT EXISTS user_documents (
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

-- Create index for faster user document queries
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);

-- Enable RLS for the table
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows full access
CREATE POLICY "Allow full access to user_documents"
ON user_documents
USING (true)
WITH CHECK (true); 