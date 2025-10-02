'use client';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptProps {
  deferredPrompt: BeforeInstallPromptEvent | null;
  onClose: () => void;
}

export function InstallPrompt({ deferredPrompt, onClose }: InstallPromptProps) {
  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      onClose();
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 border border-gray-200 dark:border-gray-700 z-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Install App
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Add to home screen for quick access
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={handleInstall}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Install
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2 py-2 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
