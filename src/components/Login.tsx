import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { signIn } from '../utils/authUtils';
import { LockKeyhole, Mail, ArrowRight, Activity } from 'lucide-react';
import { useNotification } from './Notification';
import { supabase } from '../utils/supabase';

interface LocationState {
  from?: {
    pathname: string;
  };
}

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  
  // Get the redirect path if coming from a protected route
  const state = location.state as LocationState;
  const from = state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log('Attempting to sign in with email:', email);
      const { error, data } = await signIn(email, password);
      
      if (error) {
        console.error('Login error:', error.message);
        setError(error.message);
        showNotification('error', error.message);
        setLoading(false);
        return;
      }
      
      // Update last login time in profiles table if user exists
      if (data?.user) {
        console.log('User authenticated successfully:', data.user.id);
        
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert([
              { 
                id: data.user.id, 
                email: data.user.email || email, // Use the form email as fallback
                last_sign_in: new Date().toISOString()
              }
            ], { onConflict: 'id' });
            
          if (profileError) {
            console.error('Error updating profile login time:', profileError);
            // Continue with login even if profile update fails
          } else {
            console.log('User profile updated successfully');
          }
        } catch (profileErr) {
          console.error('Error updating user profile:', profileErr);
          // Continue with login even if profile update fails
        }
        
        // Show welcome notification
        const userEmail = data.user.email || email;
        const username = userEmail.split('@')[0];
        const firstName = username.charAt(0).toUpperCase() + username.slice(1);
        showNotification('success', `Welcome back, ${firstName}!`);
        
        // Navigate to documents page after successful login
        console.log('Navigating to documents page...');
        navigate('/documents', { replace: true });
      } else {
        console.error('No user data returned from login');
        setError('Login failed. Please try again.');
        showNotification('error', 'Login failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Unexpected login error:', err);
      setError('An unexpected error occurred. Please try again.');
      showNotification('error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <Activity className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">MedGuide</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your medical assistant
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md -space-y-px">
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockKeyhole className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}; 