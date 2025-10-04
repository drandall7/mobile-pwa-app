'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  children?: React.ReactNode;
}

export default function InstallPrompt({ onInstall, onDismiss, children }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Check if app is already installed
  const checkInstallationStatus = useCallback(() => {
    // Check if running as standalone (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true) {
      setIsInstalled(true);
      return true;
    }

    // Check localStorage for previous dismissal
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissTime) / (1000 * 60 * 60 * 24);
      
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return false;
      } else {
        // Clear old dismissal after 7 days
        localStorage.removeItem('pwa-install-dismissed');
      }
    }

    return false;
  }, []);

  // Handle beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Save the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt if not dismissed recently and not already installed
      if (!checkInstallationStatus()) {
        setShowPrompt(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-install-dismissed');
      onInstall?.();
    };

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Listen for the appinstalled event
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check installation status on mount
    checkInstallationStatus();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [checkInstallationStatus, onInstall]);

  // Handle install button click
  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      setIsInstalling(true);
      
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        // The appinstalled event will handle the rest
      } else {
        console.log('User dismissed the install prompt');
        handleDismiss();
      }
    } catch (error) {
      console.error('Error during installation:', error);
      handleDismiss();
    } finally {
      setIsInstalling(false);
    }
  };

  // Handle dismiss/not now
  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setDeferredPrompt(null);
    
    // Save dismissal to localStorage
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    
    onDismiss?.();
  }, [onDismiss]);

  // Manual trigger function
  const triggerInstallPrompt = useCallback(() => {
    if (deferredPrompt && !isInstalled) {
      setShowPrompt(true);
    }
  }, [deferredPrompt, isInstalled]);

  // Expose trigger function globally for manual use
  useEffect(() => {
    (window as Window & { triggerInstallPrompt?: () => void }).triggerInstallPrompt = triggerInstallPrompt;
    
    return () => {
      delete (window as Window & { triggerInstallPrompt?: () => void }).triggerInstallPrompt;
    };
  }, [triggerInstallPrompt]);

  // Don't render if already installed or no prompt available
  if (isInstalled || (!showPrompt && !children)) {
    return children ? <>{children}</> : null;
  }

  return (
    <>
      {/* Install Prompt Modal */}
      {showPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Install WorkoutSync
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                Add WorkoutSync to your home screen for quick access and a better experience.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white text-sm">Faster loading</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white text-sm">Works offline</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white text-sm">Native app feel</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInstalling ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Installing...</span>
                  </div>
                ) : (
                  'Install App'
                )}
              </button>
              
              <button
                onClick={handleDismiss}
                disabled={isInstalling}
                className="w-full h-12 bg-gray-700 border border-gray-600 text-white font-semibold rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Not now
              </button>
            </div>

            {/* Instructions for iOS */}
            {navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad') ? (
              <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
                <p className="text-gray-300 text-xs text-center">
                  Tap the share button <span className="inline-block w-4 h-4 bg-gray-400 rounded mx-1"></span> and select &quot;Add to Home Screen&quot;
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Render children */}
      {children}
    </>
  );
}

// Hook for using the install prompt
export function useInstallPrompt() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkAvailability = () => {
      // Check if running as standalone (installed)
      const installed = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsInstalled(installed);

      // Check if beforeinstallprompt is supported
      const available = 'onbeforeinstallprompt' in window;
      setIsAvailable(available && !installed);
    };

    checkAvailability();

    const handleBeforeInstallPrompt = () => {
      setIsAvailable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsAvailable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(() => {
    if ((window as Window & { triggerInstallPrompt?: () => void }).triggerInstallPrompt) {
      (window as Window & { triggerInstallPrompt?: () => void }).triggerInstallPrompt();
    }
  }, []);

  return {
    isAvailable,
    isInstalled,
    triggerInstall
  };
}