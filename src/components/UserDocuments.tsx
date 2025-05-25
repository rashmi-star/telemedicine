import React, { useState, useEffect } from 'react';
import { File, Trash2, Download, Eye, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { getCurrentUser } from '../utils/authUtils';
import { getUserDocuments, deleteDocument } from '../utils/simpleUpload';
import { useNotification } from './Notification';
import { mockMedicalDocuments } from '../utils/mockData';

interface UserDocument {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  upload_date: string;
  document_type: string;
  document_path: string;
  public_url: string;
  description?: string;
  tags?: string[];
}

export const UserDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchUserAndDocuments();
  }, []);

  const fetchUserAndDocuments = async () => {
    setIsLoading(true);
    try {
      const userData = await getCurrentUser();
      setUser({
        ...userData,
        displayName: 'Rashmi Elavazhagan' // Set mock display name
      });

      if (userData) {
        // Use mock documents instead of loading from API
        setTimeout(() => {
          setDocuments(mockMedicalDocuments);
          setIsLoading(false);
        }, 800); // Simulate network delay
      } else {
        setError('You must be logged in to view your documents.');
        showNotification('error', 'You must be logged in to view your documents.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching user or documents:', error);
      setError('Failed to load your documents. Please try again.');
      showNotification('error', 'Failed to load your documents. Please try again.');
      setIsLoading(false);
    }
  };

  // This function is now just for the UI effect as we're using mock data
  const loadDocuments = async (userId: string) => {
    try {
      // For real implementation
      // const result = await getUserDocuments(userId);
      // if (result.success && result.data) {
      //   setDocuments(result.data);
      // }
      
      // Mock implementation
      setDocuments(mockMedicalDocuments);
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('Failed to load your documents. Please try again.');
      showNotification('error', 'Failed to load your documents. Please try again.');
    }
  };

  const handleDeleteDocument = async (document: UserDocument) => {
    if (!window.confirm(`Are you sure you want to delete "${document.file_name}"?`)) {
      return;
    }

    setIsDeleting(document.id);
    
    // Simulate network delay
    setTimeout(() => {
      // Filter out the deleted document from state
      setDocuments(documents.filter(doc => doc.id !== document.id));
      showNotification('success', 'Document deleted successfully');
      setIsDeleting(null);
    }, 800);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <File className="h-8 w-8 text-blue-500" />;
    }
    if (fileType.includes('pdf')) {
      return <File className="h-8 w-8 text-red-500" />;
    }
    if (fileType.includes('word')) {
      return <File className="h-8 w-8 text-indigo-500" />;
    }
    return <File className="h-8 w-8 text-gray-500" />;
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Loading your documents...</span>
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
          You must be logged in to view your documents. Please sign in or create an account.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center">
          <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Error Loading Documents</h3>
        </div>
        <p className="mt-2 text-gray-600">{error}</p>
        <button
          onClick={fetchUserAndDocuments}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Your Medical Documents</h3>
        <span className="text-sm text-gray-500">Patient: {user.displayName || user.email}</span>
      </div>
      
      {documents.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <File className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h4 className="text-sm font-medium text-gray-900">No documents found</h4>
          <p className="text-xs text-gray-500 mt-1">
            Upload your first medical document to get started.
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getFileIcon(doc.file_type)}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {doc.file_name}
                          </div>
                          {doc.description && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {doc.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {doc.document_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {formatFileSize(doc.file_size)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {formatDate(doc.upload_date)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-2">
                        <a
                          href={doc.public_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <Eye className="w-5 h-5" />
                        </a>
                        <a
                          href={doc.public_url}
                          download={doc.file_name}
                          className="text-green-600 hover:text-green-900"
                          title="Download"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                        <button
                          onClick={() => handleDeleteDocument(doc)}
                          disabled={isDeleting === doc.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Delete"
                        >
                          {isDeleting === doc.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}; 