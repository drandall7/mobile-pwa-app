'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function FeedPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#ff8c42] to-[#f8d03a] bg-clip-text text-transparent">
                WorkoutSync Feed
              </h1>
              <p className="text-gray-600 dark:text-[#a0a0a0] mt-2">
                Welcome back, {user.name}!
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-[#ff8c42] text-black font-semibold rounded-lg hover:bg-[#ff8c42]/90 transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>

          {/* User Info Card */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 shadow-lg border border-gray-200 dark:border-[#2a2a2a] mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#e0e0e0] mb-4">
              Your Profile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-[#a0a0a0]">Name</p>
                <p className="text-gray-900 dark:text-[#e0e0e0] font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-[#a0a0a0]">Phone</p>
                <p className="text-gray-900 dark:text-[#e0e0e0] font-medium">{user.phone_number}</p>
              </div>
              {user.email && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-[#a0a0a0]">Email</p>
                  <p className="text-gray-900 dark:text-[#e0e0e0] font-medium">{user.email}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 dark:text-[#a0a0a0]">Activities</p>
                <p className="text-gray-900 dark:text-[#e0e0e0] font-medium">
                  {user.activity_preferences?.length > 0 
                    ? user.activity_preferences.join(', ') 
                    : 'None selected'}
                </p>
              </div>
            </div>
          </div>

          {/* Coming Soon Card */}
          <div className="bg-gradient-to-r from-[#ff8c42] to-[#f8d03a] rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-black mb-4">
              🚀 Coming Soon!
            </h2>
            <p className="text-black/80 mb-6">
              WorkoutSync is still under development. Soon you&apos;ll be able to:
            </p>
            <ul className="text-black/80 space-y-2 max-w-md mx-auto">
              <li>• Find workout partners near you</li>
              <li>• Create and join workout groups</li>
              <li>• Track your fitness progress</li>
              <li>• Share workout achievements</li>
              <li>• Get personalized recommendations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
