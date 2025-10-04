'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { LocationService } from '@/lib/services/location';
import { createErrorInfo, displayError, handleLocationError } from '@/lib/utils/errors';

// Location detection states
enum LocationState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

interface FormData {
  displayName: string;
  email: string;
}

interface LocationData {
  state: LocationState;
  name: string | null;
  coordinates: { latitude: number; longitude: number } | null;
  error: string | null;
}

interface ManualLocationData {
  address: string;
  coordinates: { latitude: number; longitude: number } | null;
}

export default function ProfileSetupPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    displayName: user?.name || '',
    email: user?.email || '',
  });

  const [locationData, setLocationData] = useState<LocationData>({
    state: LocationState.IDLE,
    name: null,
    coordinates: null,
    error: null,
  });

  const [manualLocationData, setManualLocationData] = useState<ManualLocationData>({
    address: '',
    coordinates: null,
  });

  const [showManualInput, setShowManualInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Update form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear submit error when user starts typing
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleLocationDetection = async () => {
    setLocationData({
      state: LocationState.LOADING,
      name: null,
      coordinates: null,
      error: null,
    });

    try {
      const result = await LocationService.getLocationWithFallback();
      
      if (result.success && result.data) {
        setLocationData({
          state: LocationState.SUCCESS,
          name: result.data.name,
          coordinates: result.data.coordinates,
          error: null,
        });
        // Hide manual input when auto-detection succeeds
        setShowManualInput(false);
      } else {
        setLocationData({
          state: LocationState.ERROR,
          name: null,
          coordinates: null,
          error: result.error || 'Failed to detect location',
        });
      }
    } catch (error) {
      // Use comprehensive location error handling
      const locationErrorInfo = handleLocationError(error);
      setLocationData({
        state: LocationState.ERROR,
        name: null,
        coordinates: null,
        error: displayError(locationErrorInfo),
      });
    }
  };

  const handleManualAddressChange = (address: string) => {
    setManualLocationData(prev => ({
      ...prev,
      address
    }));
  };


  const toggleManualInput = () => {
    setShowManualInput(!showManualInput);
    if (!showManualInput) {
      // Clear manual data when hiding
      setManualLocationData({ address: '', coordinates: null });
    }
  };

  const validateForm = (): boolean => {
    if (!formData.displayName.trim()) {
      setSubmitError('Display name is required');
      return false;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setSubmitError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Update user profile
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.displayName.trim(),
          email: formData.email.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Update location if detected (either auto or manual)
      const finalLocation = locationData.coordinates ? locationData : 
                           (manualLocationData.address ? {
                             state: LocationState.SUCCESS,
                             name: manualLocationData.address,
                             coordinates: null,
                             error: null
                           } : null);

      if (finalLocation?.name) {
        // Only update location if we have coordinates (auto-detection)
        if (finalLocation.coordinates) {
          await fetch('/api/profile/location', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              latitude: finalLocation.coordinates.latitude,
              longitude: finalLocation.coordinates.longitude,
              locationName: finalLocation.name,
            }),
          });
        }
        // For manual addresses without coordinates, we'll just store the address name
        // You can add a separate API endpoint later to store just the address string
      }

      // Refresh user data
      await refreshUser();

      // Redirect to feed
      router.push('/feed');
    } catch (error) {
      console.error('Profile setup error:', error);
      
      // Use comprehensive error handling
      const errorDetails = createErrorInfo(error, 'profile-setup');
      setSubmitError(displayError(errorDetails));
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex-grow flex flex-col justify-center px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome {user.name}!
          </h1>
          <p className="text-gray-300 text-base leading-relaxed">
            Let&apos;s set up your profile to connect with workout buddies
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-gray-800 rounded-2xl p-6 space-y-6">
          {/* Display Name */}
          <div>
            <label className="block text-white font-semibold mb-2" htmlFor="displayName">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              placeholder="How should friends find you?"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              className="w-full h-12 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-white font-semibold mb-1" htmlFor="email">
              Email <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <p className="text-gray-400 text-sm mb-2">Account recovery only</p>
            <input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full h-12 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-white font-semibold mb-1" htmlFor="location">
              Location
            </label>
            <p className="text-gray-400 text-sm mb-3">Keep your workouts local and private</p>
            
            <button
              type="button"
              onClick={handleLocationDetection}
              disabled={locationData.state === LocationState.LOADING}
              className="w-full h-12 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white font-semibold flex items-center justify-center gap-3 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {locationData.state === LocationState.LOADING ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Detecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Detect My Location</span>
                </>
              )}
            </button>

            {locationData.state === LocationState.SUCCESS && locationData.name && (
              <p className="text-green-400 text-sm mt-2">
                ✓ Location detected: {locationData.name}
              </p>
            )}

            {locationData.state === LocationState.ERROR && (
              <p className="text-red-400 text-sm mt-2">
                {locationData.error}
              </p>
            )}

            <p 
              className="text-orange-500 text-sm mt-3 text-center cursor-pointer hover:underline"
              onClick={toggleManualInput}
            >
              Or enter manually
            </p>

            {/* Manual Address Input */}
            {showManualInput && (
              <div className="mt-4 space-y-2">
                <label className="block text-white font-medium text-sm">
                  Enter your address
                </label>
                <input
                  type="text"
                  value={manualLocationData.address}
                  onChange={(e) => handleManualAddressChange(e.target.value)}
                  placeholder="Enter your full address..."
                  className="w-full h-12 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 mt-2"
                />
                {manualLocationData.address && (
                  <p className="text-green-400 text-sm mt-2">
                    ✓ Address entered: {manualLocationData.address}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-400 text-sm">{submitError}</p>
            </div>
          )}

          {/* Complete Setup Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.displayName.trim()}
            className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'COMPLETING...' : 'COMPLETE SETUP'}
          </button>
        </div>
      </div>

      {/* Bottom indicator */}
      <div className="flex justify-center pb-4">
        <div className="w-8 h-1 bg-gray-600 rounded-full"></div>
      </div>
    </div>
  );
}