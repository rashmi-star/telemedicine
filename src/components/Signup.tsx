import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp } from '../utils/authUtils';
import { LockKeyhole, Mail, User, ArrowRight, CheckCircle } from 'lucide-react';
import { useNotification } from './Notification';
import { supabase } from '../utils/supabase';

export const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [signupComplete, setSignupComplete] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // Check Supabase connection
  const checkSupabaseConnection = async () => {
    setCheckingConnection(true);
    try {
      const { data, error } = await supabase.from('_health').select('*').limit(1);
      
      if (error) {
        console.error('Supabase connection error:', error);
        setError('Could not connect to the database. Please try again later.');
        showNotification('error', 'Database connection failed. Please try again later.');
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Supabase health check error:', err);
      setError('Could not verify database connection. Please try again later.');
      showNotification('error', 'Database connection check failed. Please try again later.');
      return false;
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      showNotification('error', 'Passwords do not match');
      return;
    }
    
    // Basic password validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      showNotification('error', 'Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);

    // First check if we can connect to Supabase
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      setLoading(false);
      return;
    }

    try {
      const { error, data } = await signUp(email, password);
      
      if (error) {
        setError(error.message);
        showNotification('error', error.message);
        return;
      }
      
      if (data?.user) {
        const successMsg = `Account created successfully for ${email}!`;
        showNotification('success', successMsg);
        
        // Save user data in Supabase profiles table if needed
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: data.user.id, 
                email: data.user.email,
                created_at: new Date().toISOString(),
                last_sign_in: new Date().toISOString()
              }
            ]);
            
          if (profileError) {
            console.error('Error saving profile:', profileError);
          }
        } catch (profileErr) {
          console.error('Error saving user profile:', profileErr);
        }
        
        // If email confirmation is not required or already confirmed
        if (data.user.email_confirmed_at) {
          // Directly navigate to documents page
          navigate('/documents', { replace: true });
        } else {
          // Still navigate to documents if possible
          navigate('/documents', { replace: true });
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      showNotification('error', 'An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const goToDashboard = () => {
    navigate('/documents');
  };

  if (signupComplete) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-green-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Registration Successful!</h2>
        </div>
        
        <div className="p-6 text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          </div>
          
          <h3 className="text-lg font-medium mb-2">{successMessage}</h3>
          
          <p className="text-gray-600 mb-6">
            Your account has been created and you can now access all features of MedGuide.
          </p>
          
          <div className="space-y-3">
            <button 
              onClick={goToDashboard}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
            
            <button
              onClick={() => navigate('/login')}
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white">Create an Account</h2>
        <p className="text-blue-100 mt-1">Join MedGuide Medical Assistant</p>
      </div>
      
      <div className="p-6">
        {error && (
          <div className="bg-red-50 text-red-800 rounded-md p-3 mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@example.com"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Password must be at least 6 characters long
            </p>
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockKeyhole className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading || checkingConnection}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <span>Creating account...</span>
              ) : checkingConnection ? (
                <span>Checking connection...</span>
              ) : (
                <>
                  <span>Sign up</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}; 