'use client';

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
}

export class PushNotificationManager {
  private static instance: PushNotificationManager;
  
  public static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  // Check if notifications are supported
  public isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Get current notification permission
  public getPermission(): NotificationPermission {
    return Notification.permission;
  }

  // Request notification permission
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Notifications are not supported in this browser');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Subscribe to push notifications
  public async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      return existingSubscription;
    }

    // Subscribe to push notifications
    // Note: You'll need to replace this with your VAPID public key
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    
    if (!vapidPublicKey) {
      console.warn('VAPID public key not found. Push notifications will not work.');
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });

    return subscription;
  }

  // Unsubscribe from push notifications
  public async unsubscribeFromPush(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      return await subscription.unsubscribe();
    }
    
    return true;
  }

  // Show a local notification
  public async showNotification(payload: NotificationPayload): Promise<void> {
    if (this.getPermission() !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const registration = await navigator.serviceWorker.ready;
    
    const options: NotificationOptions & { vibrate?: number[] } = {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.svg',
      badge: payload.badge || '/icons/icon-72x72.svg',
      tag: payload.tag,
      data: payload.data,
      vibrate: [200, 100, 200],
      requireInteraction: false,
    };

    // Add actions if supported and provided
    if (payload.actions && 'actions' in Notification.prototype) {
      (options as NotificationOptions & { actions?: NotificationAction[] }).actions = payload.actions;
    }

    await registration.showNotification(payload.title, options);
  }

  // Helper function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Hook for using push notifications in React components
export function usePushNotifications() {
  const notificationManager = PushNotificationManager.getInstance();

  return {
    isSupported: notificationManager.isSupported(),
    permission: notificationManager.getPermission(),
    requestPermission: () => notificationManager.requestPermission(),
    subscribe: () => notificationManager.subscribeToPush(),
    unsubscribe: () => notificationManager.unsubscribeFromPush(),
    showNotification: (payload: NotificationPayload) => notificationManager.showNotification(payload),
  };
}
