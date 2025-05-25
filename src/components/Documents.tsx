import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Upload, ChevronRight, Droplet, Scan, FileText, Shield, Clipboard, XSquare, ArrowLeft, FolderPlus, Download, Eye, Loader2 } from 'lucide-react';
import { getCurrentUser } from '../utils/authUtils';
import { DocumentUploader } from './DocumentUploader';
import { documentCategories, getDocumentsByCategory, mockMedicalDocuments } from '../utils/mockData';
import { downloadFile, getFileDownloadUrl, listFiles, ensureBucketExists, uploadTestDocument } from '../utils/supabaseDownloader';

export const Documents: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [documentKey, setDocumentKey] = useState(Date.now()); 
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [documentsInCategory, setDocumentsInCategory] = useState<any[]>([]);
  const [supabaseFiles, setSupabaseFiles] = useState<any[]>([]);
  const [loadingSupabase, setLoadingSupabase] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [testingSupabase, setTestingSupabase] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser({
          ...userData,
          displayName: 'Rashmi Elavazhagan' // Set mock display name
        });
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
    fetchSupabaseFiles();
  }, []);

  useEffect(() => {
    if (currentCategory) {
      setDocumentsInCategory(getDocumentsByCategory(currentCategory));
    }
  }, [currentCategory]);

  const fetchSupabaseFiles = async () => {
    setLoadingSupabase(true);
    try {
      console.log('Fetching files from Supabase storage...');
      
      // First ensure the bucket exists
      const { success, error: bucketError } = await ensureBucketExists();
      
      if (!success) {
        console.error('Failed to ensure bucket exists:', bucketError);
        
        // Check if this is an authentication error
        if (bucketError?.message?.includes('Authentication required')) {
          const shouldLogin = window.confirm('You need to log in to access your documents. Would you like to log in now?');
          if (shouldLogin) {
            navigate('/login'); // Redirect to login page
          }
          return;
        }
        
        alert(`Failed to access Supabase storage: ${bucketError?.message}`);
        return;
      }
      
      // List files in the root directory
      const { files, error } = await listFiles();
      
      if (error) {
        console.error('Error listing files from Supabase:', error);
        
        // Check if this is an authentication error
        if (error.message?.includes('Authentication required')) {
          const shouldLogin = window.confirm('You need to log in to access your documents. Would you like to log in now?');
          if (shouldLogin) {
            navigate('/login'); // Redirect to login page
          }
          return;
        }
        
        alert(`Failed to load files from Supabase: ${error.message}`);
        return;
      }

      if (!files || files.length === 0) {
        console.log('No files found in Supabase storage');
        setSupabaseFiles([]);
        return;
      }

      console.log('Files retrieved from Supabase:', files);
      
      // Add supabase storage files to the documents
      const formattedFiles = files.map(file => ({
        id: `supabase-${file.id || Math.random().toString(36).substring(2, 9)}`,
        file_name: file.name,
        file_size: file.metadata?.size || 0,
        file_type: file.metadata?.mimetype || 'application/pdf',
        upload_date: file.created_at || new Date().toISOString(),
        document_type: 'supabase_document',
        document_path: file.name,
        public_url: '#',
        description: `File from Supabase storage: ${file.name}`,
        isSupabaseFile: true,
        category: file.name.includes('health') ? 'Blood Tests' : 'Other Documents'
      }));

      console.log('Formatted Supabase files:', formattedFiles);
      setSupabaseFiles(formattedFiles);
      
      // Update mock data to include these files
      if (currentCategory === 'Blood Tests') {
        const bloodTestsCategory = getDocumentsByCategory('Blood Tests');
        const healthFiles = formattedFiles.filter(f => f.category === 'Blood Tests');
        if (healthFiles.length > 0) {
          setDocumentsInCategory([...bloodTestsCategory, ...healthFiles]);
        }
      }
    } catch (error) {
      console.error('Unexpected error fetching Supabase files:', error);
      alert(`Failed to load files from Supabase: ${(error as Error).message}`);
    } finally {
      setLoadingSupabase(false);
    }
  };

  const handleUploadComplete = () => {
    // Force re-render and refresh files
    setDocumentKey(Date.now());
    fetchSupabaseFiles();
  };

  const handleCategoryClick = (categoryName: string) => {
    setCurrentCategory(categoryName);

    // If clicking Blood Tests category, merge mock data with actual Supabase files
    if (categoryName === 'Blood Tests') {
      const mockDocs = getDocumentsByCategory(categoryName);
      const supabaseHealthFiles = supabaseFiles.filter(f => f.category === 'Blood Tests');
      setDocumentsInCategory([...mockDocs, ...supabaseHealthFiles]);
    }
  };

  const goBackToCategories = () => {
    setCurrentCategory(null);
  };

  const handleDownloadFile = async (doc: any) => {
    if (!doc.isSupabaseFile) {
      // For mock files, just show an alert
      alert(`This is a mock file: ${doc.file_name}`);
      return;
    }

    setDownloadingFile(doc.id);
    try {
      console.log(`Attempting to download file: ${doc.document_path}`);
      
      // For Supabase files, attempt to download
      const { url, error } = await getFileDownloadUrl(doc.document_path);
      
      if (error) {
        console.error('Error getting download URL:', error);
        
        // Check if this is an authentication error
        if (error.message?.includes('Authentication required')) {
          const shouldLogin = window.confirm('You need to log in to download files. Would you like to log in now?');
          if (shouldLogin) {
            navigate('/login'); // Redirect to login page
          }
          return;
        }
        
        alert(`Error getting download URL: ${error.message}`);
        return;
      }

      if (!url) {
        console.error('No URL returned for file download');
        alert('Could not generate download URL. Please try again.');
        return;
      }

      console.log(`Download URL generated: ${url.substring(0, 50)}...`);
      
      // Create a link and click it to download the file
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      console.log('Download initiated');
    } catch (error) {
      console.error('Error downloading file:', error);
      alert(`Error downloading file: ${(error as Error).message}`);
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleViewFile = async (doc: any) => {
    if (!doc.isSupabaseFile) {
      // For mock files, just show an alert
      alert(`This is a mock file: ${doc.file_name}`);
      return;
    }

    setDownloadingFile(doc.id);
    try {
      console.log(`Attempting to view file: ${doc.document_path}`);
      
      // For Supabase files, get a URL and open it in a new tab
      const { url, error } = await getFileDownloadUrl(doc.document_path);
      
      if (error) {
        console.error('Error getting view URL:', error);
        alert(`Error getting view URL: ${error.message}`);
        return;
      }

      if (!url) {
        console.error('No URL returned for file viewing');
        alert('Could not generate view URL. Please try again.');
        return;
      }

      console.log(`View URL generated: ${url.substring(0, 50)}...`);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing file:', error);
      alert(`Error viewing file: ${(error as Error).message}`);
    } finally {
      setDownloadingFile(null);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'droplet':
        return <Droplet className="h-6 w-6 text-red-500" />;
      case 'scan':
        return <Scan className="h-6 w-6 text-purple-500" />;
      case 'x-square':
        return <XSquare className="h-6 w-6 text-blue-500" />;
      case 'file-text':
        return <FileText className="h-6 w-6 text-green-500" />;
      case 'shield':
        return <Shield className="h-6 w-6 text-yellow-500" />;
      case 'clipboard':
        return <Clipboard className="h-6 w-6 text-indigo-500" />;
      default:
        return <FolderOpen className="h-6 w-6 text-blue-500" />;
    }
  };

  const handleTestSupabaseAccess = async () => {
    setTestingSupabase(true);
    try {
      const { success, error } = await uploadTestDocument();
      
      if (success) {
        alert('Success! Test document uploaded to Supabase storage.');
        // Refresh files to see the new test document
        fetchSupabaseFiles();
      } else {
        console.error('Test upload failed:', error);
        alert(`Failed to upload test document: ${error?.message}`);
      }
    } catch (err) {
      console.error('Error during test:', err);
      alert(`Test error: ${(err as Error).message}`);
    } finally {
      setTestingSupabase(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">Not logged in</h2>
        <p className="text-gray-600 mb-4">
          Please log in to access your medical documents.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-md p-6 text-white">
        <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FolderOpen className="h-8 w-8 mr-3 text-white opacity-90" />
          <div>
            <h2 className="text-2xl font-bold">Medical Documents</h2>
            <p className="opacity-80">Securely store and manage your medical records</p>
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-lg font-medium">Rashmi Elavazhagan</h3>
            <p className="text-sm opacity-90">Account #: 017316754</p>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar - Upload & Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <DocumentUploader 
            onUploadComplete={handleUploadComplete}
            documentType="medical_document"
            maxSizeMB={15}
          />
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleTestSupabaseAccess}
              disabled={testingSupabase}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {testingSupabase ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Testing Storage...
                </>
              ) : (
                'Test Supabase Access'
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Click to verify your access to the document storage
            </p>
          </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Document Categories</h3>
            <nav>
              <ul className="space-y-2">
                {documentCategories.map(category => (
                  <li key={category.id}>
                    <button 
                      onClick={() => handleCategoryClick(category.name)}
                      className={`w-full flex items-center justify-between p-2 rounded-md transition-colors ${
                        currentCategory === category.name 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        {getCategoryIcon(category.icon)}
                        <span className="ml-2">{category.name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs bg-gray-100 rounded-full px-2 py-1 mr-2">
                          {category.name === 'Blood Tests' 
                            ? category.count + supabaseFiles.filter(f => f.category === 'Blood Tests').length 
                            : category.count}
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </button>
                  </li>
                ))}
                <li>
                  <button className="w-full flex items-center p-2 rounded-md text-gray-500 hover:bg-gray-100">
                    <FolderPlus className="h-5 w-5 mr-2" />
                    <span>Add New Category</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
          
          <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h4 className="text-sm font-medium text-blue-800">Document Privacy</h4>
            <p className="text-xs text-blue-700 mt-1">
              All your documents are stored securely and are only accessible to you.
              We use encryption to protect your sensitive medical information.
            </p>
          </div>
        </div>
        
        {/* Right column - Document Content */}
        <div className="lg:col-span-3">
          {currentCategory ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={goBackToCategories}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to all categories
                </button>
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  {getCategoryIcon(documentCategories.find(c => c.name === currentCategory)?.icon || 'folder')}
                  <span className="ml-2">{currentCategory}</span>
                </h3>
              </div>

              {/* Category content */}
              {documentsInCategory.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Document
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
                        {documentsInCategory.map(doc => (
                          <tr key={doc.id} className={`hover:bg-gray-50 ${doc.file_name === '1health.pdf' || doc.isSupabaseFile ? 'bg-green-50' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <FileText className={`h-5 w-5 ${
                                  doc.file_name === '1health.pdf' || doc.isSupabaseFile ? 'text-green-600' : 'text-blue-500'
                                }`} />
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900 flex items-center">
                                    {doc.file_name}
                                    {(doc.file_name === '1health.pdf' || doc.isSupabaseFile) && (
                                      <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        From Supabase
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {doc.description}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(doc.upload_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button 
                                onClick={() => handleViewFile(doc)} 
                                className="text-blue-600 hover:text-blue-900 mr-3"
                                disabled={downloadingFile === doc.id}
                              >
                                {downloadingFile === doc.id ? <Loader2 className="h-4 w-4 animate-spin inline" /> : <Eye className="h-4 w-4 inline" />} View
                              </button>
                              <button 
                                onClick={() => handleDownloadFile(doc)} 
                                className="text-green-600 hover:text-green-900 mr-3"
                                disabled={downloadingFile === doc.id}
                              >
                                {downloadingFile === doc.id ? <Loader2 className="h-4 w-4 animate-spin inline" /> : <Download className="h-4 w-4 inline" />} Download
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-900">No documents in this category</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Upload documents to this category to see them here.
                  </p>
                  <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">All Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documentCategories.map(category => (
                  <div 
                    key={category.id}
                    onClick={() => handleCategoryClick(category.name)}
                    className="border rounded-lg p-4 flex flex-col items-center cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="bg-gray-100 rounded-full p-4 mb-3">
                      {getCategoryIcon(category.icon)}
                    </div>
                    <h4 className="text-sm font-medium">{category.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {category.name === 'Blood Tests' 
                        ? category.count + supabaseFiles.filter(f => f.category === 'Blood Tests').length 
                        : category.count} documents
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Documents</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Document
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
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
                        {[...mockMedicalDocuments.slice(0, 2), ...supabaseFiles.slice(0, 1)]
                          .map(doc => (
                            <tr key={doc.id} className={`hover:bg-gray-50 ${doc.file_name === '1health.pdf' || doc.isSupabaseFile ? 'bg-green-50' : ''}`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <FileText className={`h-5 w-5 ${
                                    doc.file_name === '1health.pdf' || doc.isSupabaseFile ? 'text-green-600' : 'text-blue-500'
                                  }`} />
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900 flex items-center">
                                      {doc.file_name}
                                      {(doc.file_name === '1health.pdf' || doc.isSupabaseFile) && (
                                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                          From Supabase
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {doc.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(doc.upload_date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button 
                                  onClick={() => handleViewFile(doc)} 
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                  disabled={downloadingFile === doc.id}
                                >
                                  {downloadingFile === doc.id ? <Loader2 className="h-4 w-4 animate-spin inline" /> : <Eye className="h-4 w-4 inline" />} View
                                </button>
                                <button 
                                  onClick={() => handleDownloadFile(doc)} 
                                  className="text-green-600 hover:text-green-900"
                                  disabled={downloadingFile === doc.id}
                                >
                                  {downloadingFile === doc.id ? <Loader2 className="h-4 w-4 animate-spin inline" /> : <Download className="h-4 w-4 inline" />} Download
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 