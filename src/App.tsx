import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChatInterface } from './components/ChatInterface';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { Profile } from './components/Profile';
import { Documents } from './components/Documents';
import { ProtectedRoute } from './components/ProtectedRoute';
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

  // Function to check if a route should be redirected
  const shouldRedirect = (route: string) => {
    // If user is logged in and trying to access auth pages
    if (currentUser && ['/login', '/signup', '/'].includes(route)) {
      return '/documents';
    }
    
    // If user is not logged in and trying to access the root
    if (!currentUser && route === '/') {
      return '/login';
    }
    
    return null;
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
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
                <Navigate to={currentUser ? "/documents" : "/login"} replace />
              } />
              
              {/* Public auth routes - accessible only when not logged in */}
              <Route path="/login" element={
                currentUser ? <Navigate to="/documents" replace /> : <Login />
              } />
              <Route path="/signup" element={
                currentUser ? <Navigate to="/documents" replace /> : <Signup />
              } />
              
              {/* Protected routes - require authentication */}
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
                <Navigate to={currentUser ? "/documents" : "/login"} replace />
              } />
            </Routes>
          )}
        </main>
      </div>
    </Router>
  );
};

export default App;