import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/authUtils';
import { getUserDocuments } from '../utils/storageUtils';
import { Calendar, FileText, Activity, User, Settings, Bell, Heart, Brain, FolderOpen } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [documentCount, setDocumentCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData) {
          // Fetch document count
          const documents = await getUserDocuments(userData.id);
          if (documents.success && documents.data) {
            setDocumentCount(documents.data.length);
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
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
          Please log in to view your dashboard.
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

  // Extract username from email for personalization
  const username = user.email.split('@')[0];
  const firstName = username.charAt(0).toUpperCase() + username.slice(1);

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-md p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {firstName}!</h2>
        <p className="opacity-80">Your personal medical dashboard</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-full p-3 mr-4">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Health Score</h3>
              <p className="text-2xl font-bold text-green-600">92/100</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-full p-3 mr-4">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Next Check-up</h3>
              <p className="text-gray-700">Not scheduled</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-full p-3 mr-4">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Medical Reports</h3>
              <p className="text-gray-700">0 uploaded</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-4">Recent Health Insights</h3>
            <div className="border-l-4 border-yellow-500 pl-4 py-2 mb-4">
              <h4 className="font-medium text-gray-900">Start tracking your health data</h4>
              <p className="text-gray-600 text-sm mt-1">Upload medical reports or enter health metrics to get personalized insights.</p>
            </div>
            <button 
              onClick={() => navigate('/pdf-extractor')}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
            >
              <FileText className="h-4 w-4 mr-1" />
              Upload a medical report
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-4">Health Recommendations</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="bg-blue-100 rounded-full p-1 mr-3 mt-0.5">
                  <Heart className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Regular Cardiovascular Exercise</h4>
                  <p className="text-gray-600 text-sm">Aim for at least 150 minutes of moderate activity per week.</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-green-100 rounded-full p-1 mr-3 mt-0.5">
                  <Brain className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Mental Health Check-in</h4>
                  <p className="text-gray-600 text-sm">Practice mindfulness or meditation for 10 minutes daily.</p>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-4">Medical Documents</h3>
            <div className="border-l-4 border-blue-500 pl-4 py-2 mb-4">
              <h4 className="font-medium text-gray-900">Document Management</h4>
              <p className="text-gray-600 text-sm mt-1">
                Securely store and manage your medical documents, reports, and prescriptions in one place.
              </p>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Uploaded documents: <span className="font-medium">{documentCount}</span></p>
              </div>
              <button 
                onClick={() => navigate('/documents')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Manage Documents
              </button>
            </div>
          </div>
        </div>
        
        {/* Right column */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-4">Account Overview</h3>
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 rounded-full p-3 mr-3">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">{user.email}</h4>
                <p className="text-sm text-gray-500">Member since {new Date(user.created_at || Date.now()).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/profile')}
                className="w-full flex justify-between items-center py-2 px-3 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
              >
                <span className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Profile Settings
                </span>
                <span className="text-gray-400">→</span>
              </button>
              <button 
                className="w-full flex justify-between items-center py-2 px-3 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
              >
                <span className="flex items-center">
                  <Bell className="h-4 w-4 mr-2" />
                  Notification Settings
                </span>
                <span className="text-gray-400">→</span>
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/chat-assistant')}
                className="w-full text-left py-2 px-3 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
              >
                Ask the Medical Assistant
              </button>
              <button 
                onClick={() => navigate('/document-analysis')}
                className="w-full text-left py-2 px-3 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
              >
                Analyze a Medical Document
              </button>
              <button 
                onClick={() => navigate('/blood-analysis')}
                className="w-full text-left py-2 px-3 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
              >
                Analyze Blood Test Results
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 