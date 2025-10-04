'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { LocationService } from '@/lib/services/location';
import { formatPhoneForDisplay } from '@/lib/utils/phone';
import { validateName, validateEmail } from '@/lib/utils/validation';

// Location detection states
enum LocationState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

interface FormData {
  name: string;
  email: string;
}

interface FormErrors {
  name?: string;
  email?: string;
}

interface LocationData {
  state: LocationState;
  name: string | null;
  coordinates: { latitude: number; longitude: number } | null;
  error: string | null;
}

export default function ProfileEditPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  const [locationData, setLocationData] = useState<LocationData>({
    state: LocationState.IDLE,
    name: null,
    coordinates: null,
    error: null,
  });

  const [locationUpdated, setLocationUpdated] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Pre-populate form with current user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });

      // Set initial location data
      if (user.home_location_name) {
        setLocationData({
          state: LocationState.SUCCESS,
          name: user.home_location_name,
          coordinates: user.home_location_coords,
          error: null,
        });
      }
    }
  }, [user]);

  // Check for unsaved changes
  useEffect(() => {
    if (user) {
      const hasChanges = 
        formData.name !== (user.name || '') ||
        formData.email !== (user.email || '') ||
        locationUpdated;
      
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, locationUpdated, user]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }

    // Clear submit error
    if (submitError) {
      setSubmitError('');
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Validate name
    const nameError = validateName(formData.name);
    if (nameError) {
      errors.name = nameError;
    }

    // Validate email if provided
    if (formData.email.trim()) {
      const emailError = validateEmail(formData.email.trim());
      if (emailError) {
        errors.email = emailError;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLocationUpdate = async () => {
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
        setLocationUpdated(true);
      } else {
        setLocationData({
          state: LocationState.ERROR,
          name: null,
          coordinates: null,
          error: result.error || 'Failed to detect location',
        });
      }
    } catch {
      setLocationData({
        state: LocationState.ERROR,
        name: null,
        coordinates: null,
        error: 'An unexpected error occurred',
      });
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Update profile data
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Update location if it was changed
      if (locationUpdated && locationData.coordinates) {
        await fetch('/api/profile/location', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: locationData.coordinates.latitude,
            longitude: locationData.coordinates.longitude,
            locationName: locationData.name || 'Unknown Location',
          }),
        });
      }

      // Refresh user data
      await refreshUser();

      // Redirect to profile page
      router.push('/profile');
    } catch (error) {
      console.error('Profile update error:', error);
      setSubmitError('Failed to save changes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/profile');
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
          <button
            onClick={handleCancel}
            className="text-orange-500 font-semibold hover:text-orange-400 transition-colors duration-200"
          >
            Cancel
          </button>
          <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSubmitting}
            className="text-orange-500 font-semibold hover:text-orange-400 transition-colors duration-200 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>

        {hasUnsavedChanges && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mb-4">
            <p className="text-orange-300 text-sm">You have unsaved changes</p>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="px-6 py-6 space-y-6">
        {/* Personal Information */}
        <div className="bg-gray-800 rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-semibold text-white">Personal Information</h3>
          
          {/* Phone Number (Read-only) */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Phone Number
            </label>
            <input
              type="text"
              value={user.phone_number ? formatPhoneForDisplay(user.phone_number) : ''}
              readOnly
              disabled
              className="w-full h-12 px-4 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
            />
            <p className="text-gray-400 text-sm mt-2">
              Contact support to change phone number
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-white font-semibold mb-2" htmlFor="name">
              Display Name *
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="How should friends find you?"
              className={`w-full h-12 px-4 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 ${
                formErrors.name ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {formErrors.name && (
              <p className="text-red-400 text-sm mt-2">{formErrors.name}</p>
            )}
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
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your.email@example.com"
              className={`w-full h-12 px-4 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 ${
                formErrors.email ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {formErrors.email && (
              <p className="text-red-400 text-sm mt-2">{formErrors.email}</p>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="bg-gray-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Location</h3>
          
          {/* Current Location */}
          {locationData.state === LocationState.SUCCESS && locationData.name && (
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-1">Current Location</label>
              <div className="text-white font-medium">
                {locationData.name}
              </div>
            </div>
          )}

          {/* Update Location Button */}
          <button
            type="button"
            onClick={handleLocationUpdate}
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
                <span>{locationData.state === LocationState.SUCCESS ? 'Update Location' : 'Detect My Location'}</span>
              </>
            )}
          </button>

          {/* Location Success Message */}
          {locationData.state === LocationState.SUCCESS && locationData.name && (
            <p className="text-green-400 text-sm mt-2">
              ✓ Location updated: {locationData.name}
            </p>
          )}

          {/* Location Error Message */}
          {locationData.state === LocationState.ERROR && (
            <p className="text-red-400 text-sm mt-2">
              {locationData.error}
            </p>
          )}
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3">
            <p className="text-red-400 text-sm">{submitError}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-8 space-y-4">
        <button
          onClick={handleSave}
          disabled={!hasUnsavedChanges || isSubmitting}
          className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
        </button>

        <button
          onClick={handleCancel}
          disabled={isSubmitting}
          className="w-full h-12 bg-gray-700 border border-gray-600 text-white font-semibold rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
