import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { ChatInterface } from './components/ChatInterface';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { Profile } from './components/Profile';
import { Documents } from './components/Documents';
import { ProtectedRoute } from './components/ProtectedRoute';
import { User, LogOut, MessageSquare, FolderOpen } from 'lucide-react';
import { getCurrentUser, signOut } from './utils/authUtils';
import { initializeStorage } from './utils/setupStorage';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [storageInitialized, setStorageInitialized] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          // Add mock display name for Rashmi Elavazhagan
          setCurrentUser({
            ...user,
            displayName: 'Rashmi Elavazhagan'
          });
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setCurrentUser(null);
      } finally {
        setUserLoading(false);
      }
    };

    loadUser();
  }, []);

  // Initialize storage on app startup
  useEffect(() => {
    const setupStorage = async () => {
      try {
        console.log('Initializing storage...');
        const result = await initializeStorage();
        
        if (result.success) {
          console.log('Storage initialized successfully');
          setStorageInitialized(true);
        } else {
          console.error('Failed to initialize storage:', result);
          // If storage initialization fails, we can still try to use the app
          // since we've updated the upload logic to be more resilient
          setStorageInitialized(true); // Set to true anyway to not block the app
        }
      } catch (error) {
        console.error('Error during storage initialization:', error);
        // Even if initialization fails, we can still use the app
        setStorageInitialized(true); 
      }
    };

    setupStorage();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setCurrentUser(null);
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                  MedGuide: Intelligent Medical Assistant
              </h1>
              <div className="flex items-center space-x-4">
                {!userLoading && (
                  currentUser ? (
                    <div className="flex items-center space-x-4">
                      <Link 
                        to="/profile" 
                        className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
                      >
                        <div className="bg-blue-100 rounded-full p-1 mr-2">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        {currentUser.displayName || currentUser.email}
                      </Link>
                      <button 
                        onClick={handleSignOut}
                        className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <Link 
                        to="/login" 
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        Log in
                      </Link>
                      <Link 
                        to="/signup" 
                        className="text-sm font-medium text-white bg-blue-600 px-3 py-2 rounded-md hover:bg-blue-700"
                      >
                        Sign up
                      </Link>
                    </div>
                  )
                )}
              </div>
            </div>
            <nav className="mt-2">
              <ul className="flex space-x-6">
                {currentUser && (
                  <li>
                    <Link 
                      to="/documents" 
                      className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <FolderOpen className="h-4 w-4 mr-1" />
                      My Documents
                    </Link>
                  </li>
                )}
                <li>
                  <Link 
                    to="/" 
                    className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Chat Assistant
                  </Link>
                </li>
                {currentUser && (
                  <li>
                    <Link 
                      to="/profile" 
                      className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <User className="h-4 w-4 mr-1" />
                      Profile
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {userLoading ? (
            // Show loading spinner while checking authentication
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <Routes>
              {/* Redirect root to login for unauthenticated users or to documents for authenticated users */}
              <Route path="/" element={
                currentUser ? <Navigate to="/documents" replace /> : <Navigate to="/login" replace />
              } />
              <Route path="/login" element={
                currentUser ? <Navigate to="/documents" replace /> : <Login />
              } />
              <Route path="/signup" element={
                currentUser ? <Navigate to="/documents" replace /> : <Signup />
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/documents" element={
                <ProtectedRoute>
                  <Documents />
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute>
                  <ChatInterface />
                </ProtectedRoute>
              } />
              {/* Catch all other routes */}
              <Route path="*" element={
                currentUser ? <Navigate to="/documents" replace /> : <Navigate to="/login" replace />
              } />
            </Routes>
          )}
        </main>

        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              MedGuide - AI-Driven Medical Report Analysis
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;