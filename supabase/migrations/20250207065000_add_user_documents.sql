-- Create user_documents table to store document metadata
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

-- Create RLS policies to ensure users can only access their own documents
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

-- Policy for selecting documents (users can only see their own)
CREATE POLICY select_own_documents ON user_documents
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for inserting documents (users can only insert their own)
CREATE POLICY insert_own_documents ON user_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for updating documents (users can only update their own)
CREATE POLICY update_own_documents ON user_documents
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for deleting documents (users can only delete their own)
CREATE POLICY delete_own_documents ON user_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for documents if it doesn't exist already
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'Documents Storage', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    auth.uid() = (storage.foldername(name))[2]::uuid
  );

CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND 
    auth.uid() = (storage.foldername(name))[2]::uuid
  );

CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND 
    auth.uid() = (storage.foldername(name))[2]::uuid
  );

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND 
    auth.uid() = (storage.foldername(name))[2]::uuid
  ); 