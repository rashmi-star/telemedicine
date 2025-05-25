import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export const signUp = async (email: string, password: string) => {
  console.log('Signing up user with email:', email);
  try {
    const result = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (result.error) {
      console.error('Signup failed:', result.error.message);
    } else {
      console.log('Signup successful, user created:', result.data?.user?.id);
    }
    
    return result;
  } catch (err) {
    console.error('Unexpected error in signUp:', err);
    throw err;
  }
};

export const signIn = async (email: string, password: string) => {
  console.log('Signing in user with email:', email);
  try {
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (result.error) {
      console.error('Sign in failed:', result.error.message);
    } else {
      console.log('Sign in successful, user:', result.data?.user?.id);
    }
    
    return result;
  } catch (err) {
    console.error('Unexpected error in signIn:', err);
    throw err;
  }
};

export const signOut = async () => {
  console.log('Signing out user');
  try {
    const result = await supabase.auth.signOut();
    
    if (result.error) {
      console.error('Sign out failed:', result.error.message);
    } else {
      console.log('Sign out successful');
    }
    
    return result;
  } catch (err) {
    console.error('Unexpected error in signOut:', err);
    throw err;
  }
};

export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting current session:', error.message);
      return null;
    }
    
    return data.session;
  } catch (err) {
    console.error('Unexpected error in getCurrentSession:', err);
    return null;
  }
};

export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting current user:', error.message);
      return null;
    }
    
    return data.user;
  } catch (err) {
    console.error('Unexpected error in getCurrentUser:', err);
    return null;
  }
};

// Setup auth listener
export const onAuthStateChange = (callback: (session: Session | null) => void) => {
  try {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed, event:', _event);
      callback(session);
    });
    
    return data.subscription;
  } catch (err) {
    console.error('Error setting up auth listener:', err);
    throw err;
  }
}; 