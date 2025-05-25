import { supabase } from './supabase';

interface StorageResult {
  success: boolean;
  error?: any;
  data?: any;
  message?: string;
}

/**
 * Ensures that the storage bucket for documents exists
 * This function can be called during app initialization
 */
export const setupDocumentStorage = async () => {
  try {
    // First check if the documents bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return { success: false, error: listError };
    }
    
    console.log('Available buckets:', buckets);
    
    // Check if a bucket exists that we can use (looking for multiple possible names)
    const documentsBucket = buckets?.find(bucket => 
      bucket.id === 'documents' || 
      bucket.name === 'documents' || 
      bucket.name === 'Documents Storage' || 
      bucket.name === 'DocumentsStorage'
    );
    
    if (!documentsBucket) {
      console.warn('Documents bucket not found. Please create one in the Supabase dashboard named "documents"');
      return { 
        success: false, 
        error: new Error('Documents bucket not found. Please create it in the Supabase dashboard.') 
      };
    }
    
    console.log('Documents bucket found:', documentsBucket);
    return { success: true, data: documentsBucket };
  } catch (error) {
    console.error('Error setting up document storage:', error);
    return { success: false, error };
  }
};

/**
 * Utility function to create the user document folder structure
 * @param userId The user ID
 */
export const createUserFolders = async (userId: string) => {
  try {
    console.log('User folders are not needed with Supabase storage');
    return { success: true };
  } catch (error) {
    console.error('Error creating user folders:', error);
    return { success: false, error };
  }
};

/**
 * Setup all required storage structures for the application
 */
export const initializeStorage = async (): Promise<StorageResult> => {
  try {
    console.log('Setting up storage with Supabase');
    
    // Verify Supabase connection by checking the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error during storage initialization:', sessionError);
      return { success: false, error: sessionError };
    }
    
    // Check if the documents bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return { success: false, error: listError, message: 'Cannot list buckets - check permissions' };
    }
    
    // Check if documents bucket exists
    const documentsBucket = buckets?.find(bucket => 
      bucket.id === 'documents' || 
      bucket.name === 'documents'
    );
    
    if (!documentsBucket) {
      console.warn('Documents bucket not found. You need to create it using the Supabase service role key.');
      console.warn('Run the script in project/scripts/createBucket.js with appropriate environment variables.');
      
      return { 
        success: false, 
        message: 'Documents bucket not found',
        error: new Error('The "documents" bucket does not exist. You need to create it using service role key.') 
      };
    }
    
    console.log('Documents bucket found:', documentsBucket);
    console.log('Storage setup complete');
    return { success: true, data: documentsBucket };
  } catch (error) {
    console.error('Unexpected error during storage initialization:', error);
    return { success: false, error };
  }
};

// Helper to check if storage is accessible
export const checkStorageAccess = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.storage.getBucket('documents');
    return !!data;
  } catch (error) {
    console.error('Storage access check failed:', error);
    return false;
  }
}; 