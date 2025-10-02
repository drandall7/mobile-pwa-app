'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function ConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test the connection by getting the current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setConnectionStatus('error');
          setError(error.message);
        } else {
          setConnectionStatus('connected');
          console.log('Supabase connection successful:', data);
        }
      } catch (err) {
        setConnectionStatus('error');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Supabase Connection Status
      </h3>
      
      <div className="flex items-center space-x-2">
        {connectionStatus === 'testing' && (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-gray-600 dark:text-gray-300">Testing connection...</span>
          </>
        )}
        
        {connectionStatus === 'connected' && (
          <>
            <div className="h-4 w-4 bg-green-500 rounded-full"></div>
            <span className="text-green-600 dark:text-green-400">Connected successfully!</span>
          </>
        )}
        
        {connectionStatus === 'error' && (
          <>
            <div className="h-4 w-4 bg-red-500 rounded-full"></div>
            <span className="text-red-600 dark:text-red-400">Connection failed: {error}</span>
          </>
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
        <p>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
      </div>
    </div>
  );
}
