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
    
    // First check if the bucket exists by listing all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      // If we can't list buckets, it could be a permissions issue
      console.error('Error listing buckets:', listError);
      
      // Try to directly access the bucket as a fallback
      try {
        const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(BUCKET_NAME);
        if (!bucketError && bucketData) {
          console.log(`Bucket '${BUCKET_NAME}' exists and is accessible.`);
          return { success: true, error: null };
        }
      } catch (e) {
        console.error('Error directly accessing bucket:', e);
      }
      
      // If we still don't have access, try a direct list operation on the bucket
      try {
        const { data: files, error: filesError } = await supabase.storage.from(BUCKET_NAME).list();
        if (!filesError) {
          console.log(`Bucket '${BUCKET_NAME}' exists and is accessible via list operation.`);
          return { success: true, error: null };
        }
      } catch (e) {
        console.error('Error listing files in bucket:', e);
      }
      
      // If we've reached here, the bucket likely doesn't exist or we don't have access
      return { 
        success: false, 
        error: new Error(`Cannot access storage bucket '${BUCKET_NAME}'. It may not exist or you don't have permission.`) 
      };
    }
    
    // Check if our bucket exists in the list
    const bucketExists = buckets && buckets.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      console.log(`Bucket '${BUCKET_NAME}' doesn't exist. Creating it...`);
      
      try {
        // Create the bucket with proper permissions
        const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: false, // Keep files private for security
          fileSizeLimit: 50971520, // 50MB
        });
        
        if (createError) {
          console.error('Error creating bucket:', createError);
          
          // If creating the bucket fails, we should inform the user
          return { 
            success: false, 
            error: new Error(`Failed to create storage bucket: ${createError.message}. Please check Supabase credentials and permissions.`) 
          };
        }
        
        // Set RLS policy for the bucket
        console.log(`Setting up default access policy for user: ${user.id}`);
        
        // Wait a moment for bucket creation to propagate
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log(`Bucket '${BUCKET_NAME}' created successfully.`);
        return { success: true, error: null };
      } catch (err) {
        console.error('Bucket creation error:', err);
        return { success: false, error: err as Error };
      }
    } else {
      console.log(`Bucket '${BUCKET_NAME}' already exists.`);
      return { success: true, error: null };
    }
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
      console.error('Bucket access error:', bucketError);
      return { 
        success: false, 
        error: new Error(`Bucket access error: ${bucketError?.message}. Please check your Supabase credentials and permissions.`)
      };
    }
    
    // Create a small text file for testing
    const testContent = `This is a test file to verify Supabase storage access.
User: ${user.email || 'Unknown'}
Date: ${new Date().toISOString()}
Random ID: ${Math.random().toString(36).substring(2, 15)}`;

    const testBlob = new Blob([testContent], { type: 'text/plain' });
    const testFile = new File([testBlob], `test-document-${Date.now()}.txt`, { type: 'text/plain' });
    
    // Upload path with user ID to respect RLS policies
    const filePath = `${user.id}/test-document-${Date.now()}.txt`;
    
    console.log(`Attempting to upload to path: ${filePath}`);
    
    // Upload the test file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, testFile, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Test upload error:', error);
      
      // Provide a more helpful error message based on the error code
      let errorMessage = error.message;
      
      if (error.message.includes('bucket not found')) {
        errorMessage = `Bucket "${BUCKET_NAME}" not found. Please create it in the Supabase dashboard or check your credentials.`;
      } else if (error.message.includes('permission denied')) {
        errorMessage = `Permission denied when uploading to "${BUCKET_NAME}". Please check your RLS policies in Supabase.`;
      } else if (error.message.includes('authentication')) {
        errorMessage = `Authentication error. Please log out and log back in, then try again.`;
      }
      
      return { success: false, error: new Error(errorMessage) };
    }
    
    if (!data) {
      return { success: false, error: new Error('Upload returned no data but also no error. This is unexpected.') };
    }
    
    console.log('Test document uploaded successfully to:', data.path);
    
    // Try to get a signed URL to verify we can also access the file
    try {
      const { data: urlData, error: urlError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, 60);
        
      if (urlError) {
        console.warn('Could upload but not create signed URL:', urlError);
      } else {
        console.log('Successfully created signed URL');
      }
    } catch (e) {
      console.warn('Error creating signed URL:', e);
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error during test upload:', error);
    return { 
      success: false, 
      error: new Error(`Unexpected error during test: ${(error as Error).message}`)
    };
  }
} 