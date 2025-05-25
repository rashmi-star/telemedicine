-- SQL to create permissive bucket policies for the 'documents' bucket
-- Run this in your Supabase SQL Editor after creating the 'documents' bucket

-- Step 1: Ensure the documents bucket exists
-- Note: You should create this bucket manually in the Supabase dashboard first
-- Storage > New Bucket > Name: "documents" > Check "Public bucket" > Create bucket

-- Step 2: Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow full access to documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated selects" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to documents bucket" ON storage.objects;

-- Step 3: Create a very permissive policy for the bucket
-- This allows all operations (SELECT, INSERT, UPDATE, DELETE) for the documents bucket
CREATE POLICY "Allow complete access to documents bucket"
ON storage.objects FOR ALL
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- Step 4: Ensure user_documents table exists and has permissive policies
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);

-- Enable Row Level Security
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow full access to user_documents" ON user_documents;
DROP POLICY IF EXISTS "select_own_documents" ON user_documents;
DROP POLICY IF EXISTS "insert_own_documents" ON user_documents;
DROP POLICY IF EXISTS "update_own_documents" ON user_documents;
DROP POLICY IF EXISTS "delete_own_documents" ON user_documents;

-- Create a permissive policy for the user_documents table
CREATE POLICY "Allow full access to user_documents"
ON user_documents FOR ALL
USING (true)
WITH CHECK (true); 