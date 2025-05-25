-- Comprehensive setup script for MedGuide Supabase project

-- 1. Create the user_documents table if it doesn't exist
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

-- 2. Create index for faster user document queries
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);

-- 3. Enable RLS for the table
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow full access to user_documents" ON user_documents;
DROP POLICY IF EXISTS "select_own_documents" ON user_documents;
DROP POLICY IF EXISTS "insert_own_documents" ON user_documents;
DROP POLICY IF EXISTS "update_own_documents" ON user_documents;
DROP POLICY IF EXISTS "delete_own_documents" ON user_documents;

-- 5. Create permissive policies for the user_documents table
-- This is a simple policy that allows all authenticated users to access all documents
-- For a production app, you might want more restrictive policies
CREATE POLICY "Allow full access to user_documents"
ON user_documents FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Create storage bucket via SQL (may fail due to RLS)
-- If this fails, create the bucket manually in the Supabase dashboard
-- INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
-- VALUES ('documents', 'documents', true, false, 52428800, null)
-- ON CONFLICT (id) DO NOTHING;

-- 7. Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Allow full access to documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated selects" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- 8. Create permissive policies for the storage bucket
-- This allows all authenticated users to access all documents in the bucket
CREATE POLICY "Allow authenticated access to documents bucket"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- Run this script in the Supabase SQL Editor to set up everything
-- Note: You still need to create the 'documents' bucket manually in the Supabase dashboard
-- Go to Storage > New Bucket > Name: "documents" > Check "Public bucket" > Create bucket 