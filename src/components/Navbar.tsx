import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, MessageSquare, User, LogOut } from 'lucide-react';
import { signOut } from '../utils/authUtils';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Only show navbar on authenticated routes
  if (['/login', '/signup'].includes(location.pathname)) {
    return null;
  }

  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-blue-600 font-bold text-xl">MedGuide</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {/* Desktop navigation */}
              <Link 
                to="/documents"
                className={`${
                  location.pathname === '/documents'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </Link>
              <Link 
                to="/chat"
                className={`${
                  location.pathname === '/chat'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </Link>
              <Link 
                to="/profile"
                className={`${
                  location.pathname === '/profile'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none transition ease-in-out duration-150"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile navigation */}
      <div className="sm:hidden">
        <div className="flex justify-between px-2 pt-2 pb-3 space-x-1">
          <Link 
            to="/documents"
            className={`${
              location.pathname === '/documents'
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            } flex-1 text-center px-3 py-2 border-b-2 text-xs font-medium`}
          >
            <FileText className="h-4 w-4 mx-auto mb-1" />
            Documents
          </Link>
          <Link 
            to="/chat"
            className={`${
              location.pathname === '/chat'
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            } flex-1 text-center px-3 py-2 border-b-2 text-xs font-medium`}
          >
            <MessageSquare className="h-4 w-4 mx-auto mb-1" />
            Chat
          </Link>
          <Link 
            to="/profile"
            className={`${
              location.pathname === '/profile'
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            } flex-1 text-center px-3 py-2 border-b-2 text-xs font-medium`}
          >
            <User className="h-4 w-4 mx-auto mb-1" />
            Profile
          </Link>
          <button
            onClick={handleSignOut}
            className="flex-1 text-center px-3 py-2 border-b-2 border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 text-xs font-medium"
          >
            <LogOut className="h-4 w-4 mx-auto mb-1" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}; 