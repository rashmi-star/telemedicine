import { supabase } from './supabase';

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
export const initializeStorage = async () => {
  try {
    // Check available buckets
    const bucketResult = await setupDocumentStorage();
    if (!bucketResult.success) {
      console.warn('Could not verify bucket existence:', bucketResult.error);
      // Continue anyway - we'll handle this during upload
    }
    
    return { 
      success: true,
      message: "Storage check completed. May require manual bucket creation."
    };
  } catch (error) {
    console.error('Error initializing storage:', error);
    return { success: false, error };
  }
}; 