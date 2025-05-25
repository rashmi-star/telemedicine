import React, { useState, useRef, useEffect } from 'react';
import { Upload, File, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { getCurrentUser } from '../utils/authUtils';
import { uploadDocument } from '../utils/simpleUpload';
import { useNotification } from './Notification';

interface DocumentUploaderProps {
  onUploadComplete?: (documentData: any) => void;
  documentType?: string;
  maxSizeMB?: number;
  allowedFileTypes?: string[];
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onUploadComplete,
  documentType = 'medical_document',
  maxSizeMB = 10,
  allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/heic',
    'image/heif'
  ]
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('You must be logged in to upload documents.');
        showNotification('error', 'You must be logged in to upload documents.');
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes
    if (selectedFile.size > maxSizeBytes) {
      setError(`File size exceeds the maximum limit of ${maxSizeMB}MB.`);
      showNotification('error', `File size exceeds the maximum limit of ${maxSizeMB}MB.`);
      return;
    }

    // Validate file type
    if (!allowedFileTypes.includes(selectedFile.type)) {
      setError(`File type not supported. Please upload ${allowedFileTypes.join(', ')}.`);
      showNotification('error', `File type not supported. Please upload a supported file type.`);
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create file preview
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFilePreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setIsUploading(true);
    setUploadProgress(10); // Start progress
    setError(null); // Clear any previous errors

    try {
      // Simulate progress (in a real app, you might get actual progress from Supabase)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const nextProgress = prev + Math.random() * 15;
          return nextProgress >= 90 ? 90 : nextProgress;
        });
      }, 300);

      // Using simplified upload function
      console.log('Uploading directly to storage bucket...');

      // Upload the file to Supabase
      const result = await uploadDocument(file, user.id, documentType);

      clearInterval(progressInterval);
      
      if (!result.success) {
        console.error('Upload failed:', result.error);
        
        // Show specific error message based on the error type
        if (result.error && typeof result.error === 'object' && 'message' in result.error) {
          const errorMessage = (result.error as any).message || 'Failed to upload document';
          setError(`Upload error: ${errorMessage}`);
          showNotification('error', `Upload error: ${errorMessage}`);
        } else {
          setError('Failed to upload document. Please try again.');
          showNotification('error', 'Failed to upload document. Please try again.');
        }
        
        // Reset progress
        setUploadProgress(0);
        return;
      }

      // Complete progress
      setUploadProgress(100);
      
      // Show success notification
      showNotification('success', 'Document uploaded successfully!');
      
      // Call the callback if provided
      if (onUploadComplete) {
        onUploadComplete(result.data);
      }

      // Reset the form after a short delay to show the 100% progress
      setTimeout(() => {
        handleRemoveFile();
        setUploadProgress(0);
      }, 1000);
    } catch (err) {
      console.error('Upload error:', err);
      
      // Show detailed error if available
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to upload document: ${errorMessage}`);
      showNotification('error', `Failed to upload document: ${errorMessage}`);
      
      // Reset progress
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return null;
    
    if (file.type.startsWith('image/')) {
      return filePreview ? (
        <img 
          src={filePreview} 
          alt="Preview" 
          className="object-cover w-16 h-16 rounded" 
        />
      ) : (
        <File className="w-12 h-12 text-blue-500" />
      );
    }
    
    return <File className="w-12 h-12 text-blue-500" />;
  };

  if (isLoadingUser) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center">
          <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Authentication Required</h3>
        </div>
        <p className="mt-2 text-gray-600">
          You must be logged in to upload documents. Please sign in or create an account.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Medical Document</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {!file ? (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept={allowedFileTypes.join(',')}
          />
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PDF, Word, JPEG, PNG, HEIC/HEIF (Max {maxSizeMB}MB)
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            {getFileIcon()}
            <div className="ml-4 flex-1">
              <div className="flex justify-between">
                <h4 className="text-sm font-medium text-gray-900 truncate max-w-xs">
                  {file.name}
                </h4>
                <button 
                  onClick={handleRemoveFile}
                  className="text-gray-400 hover:text-gray-500"
                  disabled={isUploading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1].toUpperCase()}
              </p>
              
              {uploadProgress > 0 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {uploadProgress === 100 ? (
                      <span className="text-green-500 flex items-center">
                        <Check className="w-3 h-3 mr-1" /> Upload complete
                      </span>
                    ) : (
                      `Uploading... ${Math.round(uploadProgress)}%`
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {uploadProgress === 0 && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Document'
              )}
            </button>
          )}
        </div>
      )}
      
      <div className="mt-3">
        <p className="text-xs text-gray-500">
          All uploaded documents are securely stored and accessible only to you. 
          We support various medical document formats.
        </p>
      </div>
    </div>
  );
}; 