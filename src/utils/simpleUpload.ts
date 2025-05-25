import { supabase } from './supabase';
import { ensureBucketExists } from './supabaseDownloader';
import { getCurrentUser } from './authUtils';

/**
 * A simplified function to upload a document to Supabase storage
 * This version uses minimal assumptions about the bucket structure
 */
export const uploadDocument = async (
  file: File,
  userId: string,
  documentType: string = 'medical_document'
): Promise<{ success: boolean; data?: any; error?: any; publicUrl?: string }> => {
  try {
    console.log('Starting simple document upload for user:', userId);
    
    // First check if the user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      console.error('User not authenticated');
      return { success: false, error: new Error('Authentication required to upload files') };
    }
    
    // Ensure the bucket exists before attempting to upload
    const { success, error: bucketError } = await ensureBucketExists();
    if (!success) {
      console.error('Failed to ensure bucket exists:', bucketError);
      return { success: false, error: bucketError };
    }
    
    // Create a simplified path
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `${userId}/${fileName}`;
    
    console.log('Uploading to path:', filePath);
    
    // Try to upload directly to the 'documents' bucket
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Upload error:', error);
      return { success: false, error };
    }
    
    console.log('Upload successful, getting public URL');
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);
    
    const publicUrl = urlData?.publicUrl || '';
    
    // Store metadata in the database
    const { error: metadataError } = await supabase
      .from('user_documents')
      .insert([
        {
          user_id: userId,
          document_path: filePath,
          document_type: documentType,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          upload_date: new Date().toISOString(),
          public_url: publicUrl
        }
      ]);
    
    if (metadataError) {
      console.error('Metadata storage error:', metadataError);
      // Still return success since the file was uploaded
    }
    
    return {
      success: true,
      data,
      publicUrl
    };
  } catch (error) {
    console.error('Unexpected error during upload:', error);
    return { success: false, error };
  }
};

/**
 * Get all documents for a specific user
 */
export const getUserDocuments = async (userId: string) => {
  try {
    console.log('Fetching documents for user:', userId);
    
    const { data, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', userId)
      .order('upload_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching documents:', error);
      return { success: false, error, data: [] };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error in getUserDocuments:', error);
    return { success: false, error, data: [] };
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (documentPath: string, documentId: string) => {
  try {
    // Delete the file from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([documentPath]);
    
    if (storageError) {
      console.error('Storage deletion error:', storageError);
    }
    
    // Delete the database record
    const { error: dbError } = await supabase
      .from('user_documents')
      .delete()
      .eq('id', documentId);
    
    if (dbError) {
      console.error('Database deletion error:', dbError);
      return { success: false, error: dbError };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in deleteDocument:', error);
    return { success: false, error };
  }
}; 