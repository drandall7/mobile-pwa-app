'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/lib/notifications';

export function PushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const {
    isSupported,
    permission,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
  } = usePushNotifications();

  useEffect(() => {
    // Check if already subscribed
    const checkSubscription = async () => {
      if (isSupported && 'serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (err) {
          console.error('Error checking subscription:', err);
        }
      }
    };

    checkSubscription();
  }, [isSupported]);

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');

    try {
      // Request permission first
      const permissionResult = await requestPermission();
      
      if (permissionResult !== 'granted') {
        setError('Notification permission denied');
        return;
      }

      // Subscribe to push notifications
      const subscription = await subscribe();
      
      if (subscription) {
        setIsSubscribed(true);
        
        // Here you would typically send the subscription to your backend
        console.log('Push subscription:', subscription.toJSON());
        
        // Show a welcome notification
        await showNotification({
          title: 'Notifications Enabled!',
          body: 'You will now receive push notifications from this app.',
          tag: 'welcome',
        });
      } else {
        setError('Failed to subscribe to push notifications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setError('');

    try {
      const success = await unsubscribe();
      if (success) {
        setIsSubscribed(false);
      } else {
        setError('Failed to unsubscribe from notifications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await showNotification({
        title: 'Test Notification',
        body: 'This is a test notification from your PWA!',
        tag: 'test',
        data: { url: '/' },
        actions: [
          {
            action: 'open',
            title: 'Open App',
          },
          {
            action: 'close',
            title: 'Close',
          },
        ],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to show test notification');
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-100 dark:bg-yellow-900 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          Push Notifications Not Supported
        </h3>
        <p className="text-yellow-700 dark:text-yellow-300 text-sm">
          Your browser does not support push notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Push Notifications
        </h3>
        <div className={`w-3 h-3 rounded-full ${
          permission === 'granted' ? 'bg-green-500' : 
          permission === 'denied' ? 'bg-red-500' : 'bg-yellow-500'
        }`} />
      </div>

      <div className="space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <p><strong>Permission:</strong> {permission}</p>
          <p><strong>Subscribed:</strong> {isSubscribed ? 'Yes' : 'No'}</p>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col space-y-2">
          {!isSubscribed ? (
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Enabling...' : 'Enable Notifications'}
            </button>
          ) : (
            <>
              <button
                onClick={handleTestNotification}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Test Notification
              </button>
              <button
                onClick={handleUnsubscribe}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Disabling...' : 'Disable Notifications'}
              </button>
            </>
          )}
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>💡 Tip: Notifications work best when the app is installed on your device.</p>
          {!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && (
            <p className="text-yellow-600 dark:text-yellow-400 mt-1">
              ⚠️ VAPID key not configured. Add NEXT_PUBLIC_VAPID_PUBLIC_KEY to enable push notifications.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
