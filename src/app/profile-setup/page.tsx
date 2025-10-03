'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfileSetupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-black flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 shadow-lg border border-gray-200 dark:border-[#2a2a2a]">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#ff8c42] to-[#f8d03a] bg-clip-text text-transparent">
                Welcome to WorkoutSync!
              </h1>
              <p className="text-gray-600 dark:text-[#a0a0a0] mt-2">
                Your account has been created successfully.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center text-green-600 dark:text-green-400">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Account created
              </div>
              <div className="flex items-center text-green-600 dark:text-green-400">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Profile initialized
              </div>
              <div className="flex items-center text-green-600 dark:text-green-400">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Ready to start!
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-[#e0e0e0] mb-2">
                Next Steps:
              </h3>
              <ul className="text-sm text-gray-600 dark:text-[#a0a0a0] space-y-1">
                <li>• Complete your fitness profile</li>
                <li>• Set your activity preferences</li>
                <li>• Find workout partners nearby</li>
                <li>• Start your first workout!</li>
              </ul>
            </div>

            <button
              onClick={() => router.push('/feed')}
              className="w-full h-12 bg-[#ff8c42] text-black font-bold rounded-lg hover:bg-[#ff8c42]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff8c42] dark:focus:ring-offset-[#1a1a1a] transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Continue to Feed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
