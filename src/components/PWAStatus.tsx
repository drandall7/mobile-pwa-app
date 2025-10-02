'use client';

import { useState, useEffect } from 'react';

interface PWACapabilities {
  isStandalone: boolean;
  isInstallable: boolean;
  hasServiceWorker: boolean;
  isOnline: boolean;
  supportsNotifications: boolean;
}

export function PWAStatus() {
  const [capabilities, setCapabilities] = useState<PWACapabilities>({
    isStandalone: false,
    isInstallable: false,
    hasServiceWorker: false,
    isOnline: true,
    supportsNotifications: false,
  });

  useEffect(() => {
    const checkCapabilities = () => {
      setCapabilities({
        isStandalone: window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator as { standalone?: boolean }).standalone === true,
        isInstallable: 'serviceWorker' in navigator && 'PushManager' in window,
        hasServiceWorker: 'serviceWorker' in navigator,
        isOnline: navigator.onLine,
        supportsNotifications: 'Notification' in window,
      });
    };

    checkCapabilities();

    // Listen for online/offline changes
    const handleOnline = () => setCapabilities(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setCapabilities(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const StatusItem = ({ 
    label, 
    status, 
    icon 
  }: { 
    label: string; 
    status: boolean; 
    icon: string;
  }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <div className={`w-3 h-3 rounded-full ${status ? 'bg-green-500' : 'bg-red-500'}`} />
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <span className="mr-2">⚙️</span>
        PWA Status
      </h3>
      
      <div className="space-y-3">
        <StatusItem 
          label="Installed as App" 
          status={capabilities.isStandalone} 
          icon="📱" 
        />
        <StatusItem 
          label="PWA Compatible" 
          status={capabilities.isInstallable} 
          icon="✨" 
        />
        <StatusItem 
          label="Service Worker" 
          status={capabilities.hasServiceWorker} 
          icon="🔧" 
        />
        <StatusItem 
          label="Online Status" 
          status={capabilities.isOnline} 
          icon="🌐" 
        />
        <StatusItem 
          label="Notifications" 
          status={capabilities.supportsNotifications} 
          icon="🔔" 
        />
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {capabilities.isStandalone 
            ? '🎉 App is running in standalone mode!' 
            : '💡 Install this app for the best experience'}
        </p>
      </div>
    </div>
  );
}
