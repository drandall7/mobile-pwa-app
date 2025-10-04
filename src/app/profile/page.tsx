'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { formatPhoneForDisplay } from '@/lib/utils/phone';

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <button
            onClick={handleEditProfile}
            className="text-orange-500 font-semibold hover:text-orange-400 transition-colors duration-200"
          >
            Edit
          </button>
        </div>

        {/* Profile Avatar/Initial */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xl font-bold">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              {user.name || 'No name set'}
            </h2>
            <p className="text-gray-400 text-sm">
              {user.phone_number ? formatPhoneForDisplay(user.phone_number) : 'No phone number'}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="px-6 py-6 space-y-6">
        {/* Personal Information */}
        <div className="bg-gray-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
          
          <div className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-gray-400 text-sm mb-1">Display Name</label>
              <div className="text-white font-medium">
                {user.name || 'No name set'}
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-gray-400 text-sm mb-1">Phone Number</label>
              <div className="text-white font-medium">
                {user.phone_number ? formatPhoneForDisplay(user.phone_number) : 'No phone number'}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-400 text-sm mb-1">Email</label>
              <div className="text-white font-medium">
                {user.email || 'No email added'}
              </div>
            </div>
          </div>
        </div>

        {/* Location Information */}
        {user.home_location_name && (
          <div className="bg-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Location</h3>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Home Location</label>
              <div className="text-white font-medium">
                {user.home_location_name}
              </div>
            </div>
          </div>
        )}

        {/* Activity Preferences */}
        {user.activity_preferences && user.activity_preferences.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Activity Preferences</h3>
            <div className="flex flex-wrap gap-2">
              {user.activity_preferences.map((activity, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-orange-500/20 text-orange-300 text-sm rounded-full"
                >
                  {activity.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pace Range */}
        {(user.pace_range_min || user.pace_range_max) && (
          <div className="bg-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Pace Range</h3>
            <div className="text-white font-medium">
              {user.pace_range_min && user.pace_range_max
                ? `${user.pace_range_min} - ${user.pace_range_max} min/mile`
                : user.pace_range_min
                ? `${user.pace_range_min}+ min/mile`
                : `Up to ${user.pace_range_max} min/mile`
              }
            </div>
          </div>
        )}

        {/* Account Information */}
        <div className="bg-gray-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
          
          <div className="space-y-4">
            {/* Member Since */}
            <div>
              <label className="block text-gray-400 text-sm mb-1">Member Since</label>
              <div className="text-white font-medium">
                {user.created_at 
                  ? new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Unknown'
                }
              </div>
            </div>

            {/* Last Updated */}
            <div>
              <label className="block text-gray-400 text-sm mb-1">Last Updated</label>
              <div className="text-white font-medium">
                {user.updated_at 
                  ? new Date(user.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Unknown'
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-8 space-y-4">
        <button
          onClick={handleEditProfile}
          className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300"
        >
          Edit Profile
        </button>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full h-12 bg-gray-700 border border-gray-600 text-white font-semibold rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  );
}
