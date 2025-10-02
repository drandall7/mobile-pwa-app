'use client';

import { useAuth } from '@/hooks/useAuth';

export function UserProfile() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-lg">
            {user.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Welcome back!
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {user.email}
          </p>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
        <p><span className="font-medium">User ID:</span> {user.id}</p>
        <p><span className="font-medium">Email Verified:</span> {user.email_confirmed_at ? 'Yes' : 'No'}</p>
        <p><span className="font-medium">Last Sign In:</span> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}</p>
      </div>

      <button
        onClick={handleSignOut}
        className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
      >
        Sign Out
      </button>
    </div>
  );
}
