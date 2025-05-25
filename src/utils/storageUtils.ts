import { supabase } from './supabase';

/**
 * Upload a document to Supabase storage under the user's folder
 * @param file The file to upload
 * @param userId The user ID to associate with the upload
 * @param documentType The type of document (e.g., 'medical_report', 'prescription', etc.)
 * @returns An object with the upload result
 */
export const uploadDocument = async (
  file: File,
  userId: string,
  documentType: string = 'medical_document'
) => {
  try {
    console.log('Starting document upload for user:', userId, 'file:', file.name);
    console.log('Supabase URL:', (supabase as any).supabaseUrl);
    
    // Debug: Check if storage bucket exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    console.log('Available buckets:', buckets);
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      throw new Error(`Bucket access error: ${bucketsError.message}`);
    }
    
    // Check if our target bucket exists - look for all possible bucket names
    const bucketExists = buckets?.some(bucket => 
      bucket.id === 'documents' || 
      bucket.name === 'documents' || 
      bucket.name === 'Documents Storage' || 
      bucket.name === 'DocumentsStorage'
    );
    
    if (!bucketExists) {
      console.error('Required bucket not found. Available buckets:', buckets);
      console.error('You need to create a bucket named "documents" in your Supabase dashboard');
      console.error('1. Go to Storage in your Supabase dashboard');
      console.error('2. Click "New Bucket"');
      console.error('3. Enter "documents" as the bucket name');
      console.error('4. Make sure "Public bucket" is checked');
      console.error('5. Click "Create bucket"');
      throw new Error('Required storage bucket not found. Please check your Supabase configuration.');
    }
    
    // Create a unique file path
    // With Supabase Storage, we can directly upload to a path without creating folders first
    const timestamp = new Date().getTime();
    // Simplify path to avoid nested folder issues
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `${userId}_${documentType}_${fileName}`;
    
    console.log('Uploading to path:', filePath);

    // Try all possible bucket names
    let data = null;
    let error = null;
    
    // Try each bucket name one by one until one works
    const bucketNames = ['documents', 'Documents Storage', 'DocumentsStorage'];
    
    for (const bucketName of bucketNames) {
      console.log(`Attempting upload to bucket: ${bucketName}`);
      
      try {
        const uploadResult = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (!uploadResult.error) {
          data = uploadResult.data;
          error = null;
          console.log(`Upload successful to bucket: ${bucketName}`);
          break;
        } else {
          console.log(`Upload failed to bucket: ${bucketName}`, uploadResult.error);
        }
      } catch (uploadErr) {
        console.log(`Exception during upload to bucket: ${bucketName}`, uploadErr);
      }
    }

    if (error) {
      console.error('All storage upload attempts failed:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Upload failed to all possible buckets');
    }

    console.log('Upload successful, getting public URL');
    
    // Get the public URL for the file - try all buckets
    let publicUrlData = null;
    
    for (const bucketName of bucketNames) {
      try {
        const urlResult = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);
          
        if (urlResult && urlResult.data) {
          publicUrlData = urlResult;
          console.log(`Got public URL from bucket: ${bucketName}`);
          break;
        }
      } catch (urlErr) {
        console.log(`Failed to get URL from bucket: ${bucketName}`, urlErr);
      }
    }

    console.log('Public URL:', publicUrlData);
    
    // Store metadata in the database
    console.log('Storing metadata in database');
    const { error: metadataError, data: metadataData } = await supabase
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
          public_url: publicUrlData?.data?.publicUrl || ''
        }
      ]);

    if (metadataError) {
      console.error('Metadata storage error details:', metadataError);
    }

    return {
      success: true,
      data: {
        ...data,
        publicUrl: publicUrlData?.data?.publicUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }
    };
  } catch (error) {
    console.error('Error uploading document (detailed):', error);
    return {
      success: false,
      error
    };
  }
};

/**
 * Get all documents for a specific user
 * @param userId The user ID to get documents for
 * @returns An array of user documents
 */
export const getUserDocuments = async (userId: string) => {
  try {
    console.log('Fetching documents for user:', userId);
    
    // Check if the user_documents table exists first
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_documents')
      .select('count(*)', { count: 'exact', head: true });
    
    if (tableError) {
      console.error('Error checking user_documents table:', tableError);
      if (tableError.message.includes('relation "user_documents" does not exist')) {
        console.error('The user_documents table does not exist. Please run the database migrations.');
        return {
          success: false,
          error: new Error('Database table does not exist'),
          data: []
        };
      }
    }
    
    console.log('Table check successful, fetching user documents');
    
    const { data, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', userId)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching user documents:', error);
      
      if (error.message.includes('permission denied')) {
        return {
          success: false,
          error: new Error('Permission denied. RLS policies may be blocking access.'),
          data: []
        };
      }
      
      throw error;
    }

    console.log(`Found ${data?.length || 0} documents for user`);
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error fetching user documents:', error);
    return {
      success: false,
      error,
      data: []
    };
  }
};

/**
 * Delete a document from Supabase storage and the database
 * @param documentPath The path of the document to delete
 * @param documentId The ID of the document in the database
 */
export const deleteDocument = async (documentPath: string, documentId: string) => {
  try {
    console.log('Attempting to delete document path:', documentPath);
    
    // Try deleting from each possible bucket
    let storageError = null;
    const bucketNames = ['documents', 'Documents Storage', 'DocumentsStorage'];
    
    for (const bucketName of bucketNames) {
      console.log(`Attempting to delete from bucket: ${bucketName}`);
      
      try {
        const { error } = await supabase.storage
          .from(bucketName)
          .remove([documentPath]);
          
        if (!error) {
          console.log(`Successfully deleted from bucket: ${bucketName}`);
          storageError = null;
          break;
        } else {
          console.log(`Failed to delete from bucket: ${bucketName}`, error);
          storageError = error;
        }
      } catch (err) {
        console.log(`Exception during delete from bucket: ${bucketName}`, err);
      }
    }
    
    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Don't throw error, try to delete the database record anyway
      console.warn('Failed to delete storage file, but will attempt to remove database record');
    } else {
      console.log('File deleted from storage, now removing database record');
    }
    
    // Delete the metadata from the database
    const { error: dbError } = await supabase
      .from('user_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      console.error('Database deletion error:', dbError);
      throw dbError;
    }

    console.log('Document successfully deleted');
    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting document:', error);
    return {
      success: false,
      error
    };
  }
}; 