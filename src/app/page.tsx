'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
import { Header } from '@/components/Header';
import { FeatureCard } from '@/components/FeatureCard';
import { InstallPrompt } from '@/components/InstallPrompt';
import { Auth } from '@/components/Auth';
import { UserProfile } from '@/components/UserProfile';
import { ConnectionTest } from '@/components/ConnectionTest';
import { PushNotifications } from '@/components/PushNotifications';
import { PWAStatus } from '@/components/PWAStatus';
import { useAuth } from '@/lib/context/AuthContext';

export default function Home() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const features = [
    {
      title: 'Offline First',
      description: 'Works seamlessly even without internet connection',
      icon: '📱',
    },
    {
      title: 'Fast Loading',
      description: 'Optimized for mobile performance and speed',
      icon: '⚡',
    },
    {
      title: 'Native Feel',
      description: 'App-like experience with smooth animations',
      icon: '🎨',
    },
    {
      title: 'Push Notifications',
      description: 'Stay updated with important notifications',
      icon: '🔔',
    },
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  // Show auth component if not authenticated
  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Mobile PWA App
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            A modern Progressive Web App built with Next.js 14, TypeScript, and Tailwind CSS
          </p>
          
          {showInstallPrompt && (
            <InstallPrompt
              deferredPrompt={deferredPrompt}
              onClose={() => setShowInstallPrompt(false)}
            />
          )}
        </div>

        {/* Connection Test & User Profile Section */}
        <div className="mb-12 max-w-md mx-auto space-y-6">
          <PWAStatus />
          <ConnectionTest />
          <UserProfile />
          <PushNotifications />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>

        <div className="text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Install this app on your device for the best experience
            </p>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full transition-colors duration-200 transform hover:scale-105 active:scale-95"
              onClick={() => {
                if (deferredPrompt) {
                  deferredPrompt.prompt();
                  deferredPrompt.userChoice.then(() => {
                    setDeferredPrompt(null);
                    setShowInstallPrompt(false);
                  });
                }
              }}
            >
              Install App
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
