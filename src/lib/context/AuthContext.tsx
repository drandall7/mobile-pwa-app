'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/types/database';
import { formatPhoneNumber } from '@/lib/utils/validation';

// Auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (phoneNumber: string, password: string) => Promise<void>;
  signUp: (phoneNumber: string, password: string, name: string, email?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Check for existing session and fetch user profile
  const checkSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        setUser(null);
        return;
      }

      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchUserProfile]);

  // Fetch user profile from users table
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        setUser(null);
        return;
      }

      if (profile) {
        setUser(profile);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setUser(null);
    }
  }, [supabase]);

  // Sign in function
  const signIn = async (phoneNumber: string, password: string) => {
    try {
      setLoading(true);
      
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const response = await fetch('/api/auth/login-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: formattedPhone,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Update user state
      setUser(data.user);
      
      // Refresh the session
      await supabase.auth.refreshSession();
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign up function
  const signUp = async (phoneNumber: string, password: string, name: string, email?: string) => {
    try {
      setLoading(true);
      
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      console.log('AuthContext: Making registration request to /api/auth/register');
      console.log('AuthContext: Request data:', { phone_number: formattedPhone, name, email });
      
      const response = await fetch('/api/auth/register-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: formattedPhone,
          password,
          name,
          email,
        }),
      });

      const data = await response.json();
      
      console.log('Registration response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Update user state
      setUser(data.user);
      
      // Note: We're bypassing Supabase Auth, so no session refresh needed
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Logout failed');
      }

      // Clear user state
      setUser(null);
      
      // Sign out from Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Refresh user function
  const refreshUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        await fetchUserProfile(authUser.id);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [checkSession, fetchUserProfile, supabase.auth]);

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
