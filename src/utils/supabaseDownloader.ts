import { supabase } from './supabase';
import { getCurrentUser } from './authUtils';

// Bucket name where documents are stored
const BUCKET_NAME = 'documents';

/**
 * Ensure the bucket exists, create it if it doesn't
 */
export async function ensureBucketExists(): Promise<{ success: boolean; error: Error | null }> {
  try {
    console.log(`Checking if bucket '${BUCKET_NAME}' exists...`);
    
    // Check if user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      console.error('User not authenticated');
      return { success: false, error: new Error('Authentication required to access storage') };
    }
    
    console.log('User authenticated:', user.email);
    
    // Try to access the bucket directly first
    try {
      const { data: files, error } = await supabase.storage.from(BUCKET_NAME).list();
      
      if (!error) {
        console.log(`Bucket '${BUCKET_NAME}' exists and is accessible.`);
        return { success: true, error: null };
      }
    } catch (e) {
      console.log('Error accessing bucket, will try to create it:', e);
    }
    
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return { success: false, error: listError };
    }
    
    // Check if our bucket exists
    const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      console.log(`Bucket '${BUCKET_NAME}' doesn't exist. Creating it...`);
      
      // Create the bucket with public access for easier testing
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true // Setting to true for easier access
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        return { success: false, error: createError };
      }
      
      // Set default RLS policy to allow the current user access
      try {
        // This step depends on having the right permissions
        console.log(`Setting up storage policy for user: ${user.id}`);
        const { error: policyError } = await supabase.rpc('create_storage_policy', {
          bucket_name: BUCKET_NAME,
          user_id: user.id
        });
        
        if (policyError) {
          console.error('Error setting bucket policy:', policyError);
          // Continue anyway, the admin might need to set policies
        }
      } catch (policyErr) {
        console.error('Failed to set storage policy:', policyErr);
        // Continue anyway
      }
      
      console.log(`Bucket '${BUCKET_NAME}' created successfully.`);
    } else {
      console.log(`Bucket '${BUCKET_NAME}' already exists.`);
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error ensuring bucket exists:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Get a signed URL for downloading a file from Supabase storage
 * @param path Path to the file in the bucket
 * @returns URL that can be used to download the file
 */
export async function getFileDownloadUrl(path: string): Promise<{ url: string | null; error: Error | null }> {
  try {
    console.log(`Getting download URL for file: ${path}`);
    
    // Check if user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      console.error('User not authenticated');
      return { url: null, error: new Error('Authentication required to access storage') };
    }
    
    // First check if the file exists
    const { data: existsData, error: existsError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list(path.split('/').slice(0, -1).join('/') || undefined);
    
    if (existsError) {
      console.error('Error checking if file exists:', existsError);
      return { url: null, error: existsError };
    }

    // Check if the file exists in the returned list
    const fileName = path.split('/').pop();
    const fileExists = existsData.some(item => item.name === fileName);
    
    if (!fileExists) {
      console.error(`File ${fileName} not found in path`);
      return { url: null, error: new Error(`File ${fileName} not found in Supabase storage`) };
    }

    // Get the signed URL
    const { data, error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, 60); // 60 seconds expiry
    
    if (error) {
      console.error('Error getting signed URL:', error);
      return { url: null, error };
    }
    
    return { url: data.signedUrl, error: null };
  } catch (error) {
    console.error('Unexpected error getting download URL:', error);
    return { url: null, error: error as Error };
  }
}

/**
 * List all files in a directory in Supabase storage
 * @param directory Directory path inside the bucket
 * @returns List of files in the directory
 */
export async function listFiles(directory: string = '') {
  try {
    console.log(`Listing files in directory: ${directory || 'root'}`);
    
    // Check if user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      console.error('User not authenticated');
      return { files: null, error: new Error('Authentication required to access storage') };
    }
    
    const { data, error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list(directory);
    
    if (error) {
      console.error('Error listing files:', error);
      return { files: null, error };
    }
    
    return { files: data, error: null };
  } catch (error) {
    console.error('Unexpected error listing files:', error);
    return { files: null, error: error as Error };
  }
}

/**
 * Download a file directly from Supabase storage
 * @param path Path to the file in the bucket
 * @returns Blob of the file
 */
export async function downloadFile(path: string): Promise<{ data: Blob | null; error: Error | null }> {
  try {
    console.log(`Downloading file: ${path}`);
    
    // Check if user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      console.error('User not authenticated');
      return { data: null, error: new Error('Authentication required to access storage') };
    }
    
    const { data, error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .download(path);
    
    if (error) {
      console.error('Error downloading file:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error downloading file:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get public URL for a file in Supabase storage
 * This only works if the bucket has public access enabled
 * @param path Path to the file in the bucket
 * @returns Public URL for the file
 */
export function getPublicUrl(path: string): string {
  const { data } = supabase
    .storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

/**
 * Check if a file exists in Supabase storage
 * @param path Path to the file in the bucket
 * @returns Boolean indicating if the file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    // Check if user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      console.error('User not authenticated');
      return false;
    }
    
    // Extract directory and filename from the path
    const pathParts = path.split('/');
    const fileName = pathParts.pop();
    const directory = pathParts.join('/');
    
    // List the directory to see if file exists
    const { data, error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list(directory);
    
    if (error) {
      console.error('Error checking if file exists:', error);
      return false;
    }
    
    // Check if the file exists in the returned list
    return data.some(item => item.name === fileName);
  } catch (error) {
    console.error('Unexpected error checking if file exists:', error);
    return false;
  }
}

/**
 * Upload a test document to verify storage access
 * @returns Result of the test upload
 */
export async function uploadTestDocument(): Promise<{ success: boolean; error: Error | null }> {
  try {
    console.log('Uploading a test document to verify storage access...');
    
    // Check if user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      console.error('User not authenticated');
      return { success: false, error: new Error('Authentication required to upload test file') };
    }
    
    // First ensure the bucket exists
    const { success: bucketSuccess, error: bucketError } = await ensureBucketExists();
    if (!bucketSuccess) {
      return { success: false, error: bucketError };
    }
    
    // Create a small text file for testing
    const testContent = 'This is a test file to verify Supabase storage access.';
    const testBlob = new Blob([testContent], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test-document.txt', { type: 'text/plain' });
    
    // Upload path with user ID to respect RLS policies
    const filePath = `${user.id}/test-document.txt`;
    
    // Upload the test file
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, testFile, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Test upload error:', error);
      return { success: false, error };
    }
    
    console.log('Test document uploaded successfully');
    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error during test upload:', error);
    return { success: false, error: error as Error };
  }
} 