'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { ActivityType } from '@/types/database';
import { LocationService } from '@/lib/services/location';
import { validateEmail } from '@/lib/utils/validation';

// Goal levels enum
enum GoalLevel {
  STAY_ACTIVE = 'stay_active',
  MAINTAIN_FITNESS = 'maintain_fitness',
  BUILD_FITNESS = 'build_fitness',
  PEAK_PERFORMANCE = 'peak_performance'
}

// Location detection states
enum LocationState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

interface FormData {
  displayName: string;
  activityPreferences: ActivityType[];
  goalLevel: GoalLevel | null;
  email: string;
}

interface LocationData {
  state: LocationState;
  name: string | null;
  coordinates: { latitude: number; longitude: number } | null;
  error: string | null;
}

export default function ProfileSetupPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    activityPreferences: [],
    goalLevel: null,
    email: '',
  });

  const [locationData, setLocationData] = useState<LocationData>({
    state: LocationState.IDLE,
    name: null,
    coordinates: null,
    error: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        displayName: user.name || '',
        activityPreferences: user.activity_preferences || [],
        email: user.email || '',
      }));
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleInputChange = (field: keyof FormData, value: string | ActivityType[] | GoalLevel | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleActivityToggle = (activity: ActivityType) => {
    setFormData(prev => ({
      ...prev,
      activityPreferences: prev.activityPreferences.includes(activity)
        ? prev.activityPreferences.filter(a => a !== activity)
        : [...prev.activityPreferences, activity]
    }));
  };

  const handleDetectLocation = async () => {
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
      } else {
        setLocationData({
          state: LocationState.ERROR,
          name: null,
          coordinates: null,
          error: result.error || 'Failed to detect location',
        });
      }
    } catch (error) {
      setLocationData({
        state: LocationState.ERROR,
        name: null,
        coordinates: null,
        error: 'An unexpected error occurred',
      });
    }
  };

  const validateForm = (): boolean => {
    // Email validation (if provided)
    if (formData.email.trim()) {
      const emailValidation = validateEmail(formData.email);
      if (emailValidation && !emailValidation.valid) {
        setSubmitError(emailValidation.message || 'Invalid email format');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (skipSetup = false) => {
    if (!skipSetup && !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Update profile if not skipping
      if (!skipSetup) {
        const profileUpdate: {
          name?: string;
          email?: string;
          activity_preferences?: ActivityType[];
          pace_range_min?: number;
          pace_range_max?: number;
        } = {
          name: formData.displayName || user?.name,
          activity_preferences: formData.activityPreferences,
        };

        // Add email if provided and valid
        if (formData.email.trim()) {
          profileUpdate.email = formData.email.trim();
        }

        // Add goal level (convert to pace range for now)
        if (formData.goalLevel) {
          switch (formData.goalLevel) {
            case GoalLevel.STAY_ACTIVE:
              profileUpdate.pace_range_min = 12;
              profileUpdate.pace_range_max = 18;
              break;
            case GoalLevel.MAINTAIN_FITNESS:
              profileUpdate.pace_range_min = 9;
              profileUpdate.pace_range_max = 12;
              break;
            case GoalLevel.BUILD_FITNESS:
              profileUpdate.pace_range_min = 7;
              profileUpdate.pace_range_max = 10;
              break;
            case GoalLevel.PEAK_PERFORMANCE:
              profileUpdate.pace_range_min = 5;
              profileUpdate.pace_range_max = 8;
              break;
          }
        }

        // Update profile
        const profileResponse = await fetch('/api/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileUpdate),
        });

        if (!profileResponse.ok) {
          throw new Error('Failed to update profile');
        }

        // Update location if detected
        if (locationData.state === LocationState.SUCCESS && locationData.coordinates) {
          const locationResponse = await fetch('/api/profile/location', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              latitude: locationData.coordinates.latitude,
              longitude: locationData.coordinates.longitude,
              locationName: locationData.name,
            }),
          });

          if (!locationResponse.ok) {
            console.warn('Failed to update location, but continuing...');
          }
        }
      }

      // Refresh user data
      await refreshUser();
      
      // Redirect to feed
      router.push('/feed');
    } catch (error) {
      console.error('Profile setup error:', error);
      setSubmitError('Failed to save your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#e0e0e0] text-lg font-semibold">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome, {user.name}!
          </h1>
          <p className="text-[#888888] text-lg">
            Let&apos;s set up your fitness profile
          </p>
        </div>

        <div className="space-y-6">
          {/* Display Name */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
            <h2 className="text-white text-xl font-semibold mb-4">Display Name</h2>
            <input
              type="text"
              placeholder="Your preferred name"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              className="w-full h-12 px-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[#e0e0e0] placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#ff8c42] focus:border-[#ff8c42] transition-all duration-200"
            />
          </div>

          {/* Activity Preferences */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
            <h2 className="text-white text-xl font-semibold mb-4">Activity Preferences</h2>
            <p className="text-[#888888] text-sm mb-4">Select the activities you enjoy:</p>
            
            <div className="space-y-3">
              {[
                { key: ActivityType.RUN, label: 'Running', icon: '🏃‍♂️' },
                { key: ActivityType.BIKE, label: 'Cycling', icon: '🚴‍♂️' },
                { key: ActivityType.WALK, label: 'Walking', icon: '🚶‍♂️' },
              ].map(({ key, label, icon }) => (
                <label
                  key={key}
                  className="flex items-center p-3 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a] hover:border-[#ff8c42] transition-all duration-200 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.activityPreferences.includes(key)}
                    onChange={() => handleActivityToggle(key)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-all duration-200 ${
                    formData.activityPreferences.includes(key)
                      ? 'bg-[#ff8c42] border-[#ff8c42]'
                      : 'border-[#2a2a2a]'
                  }`}>
                    {formData.activityPreferences.includes(key) && (
                      <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-2xl mr-3">{icon}</span>
                  <span className="text-[#e0e0e0] font-medium">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
            <h2 className="text-white text-xl font-semibold mb-4">Fitness Goals</h2>
            <p className="text-[#888888] text-sm mb-4">What&apos;s your primary fitness goal?</p>
            
            <div className="space-y-3">
              {[
                { key: GoalLevel.STAY_ACTIVE, label: 'Stay Active', description: 'Light, regular activity' },
                { key: GoalLevel.MAINTAIN_FITNESS, label: 'Maintain Fitness', description: 'Keep current level' },
                { key: GoalLevel.BUILD_FITNESS, label: 'Build Fitness', description: 'Improve endurance & strength' },
                { key: GoalLevel.PEAK_PERFORMANCE, label: 'Peak Performance', description: 'Competitive training' },
              ].map(({ key, label, description }) => (
                <label
                  key={key}
                  className="flex items-center p-3 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a] hover:border-[#ff8c42] transition-all duration-200 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="goalLevel"
                    checked={formData.goalLevel === key}
                    onChange={() => handleInputChange('goalLevel', key)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-all duration-200 ${
                    formData.goalLevel === key
                      ? 'bg-[#ff8c42] border-[#ff8c42]'
                      : 'border-[#2a2a2a]'
                  }`}>
                    {formData.goalLevel === key && (
                      <div className="w-2 h-2 bg-black rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <div className="text-[#e0e0e0] font-medium">{label}</div>
                    <div className="text-[#888888] text-sm">{description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Email */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
            <h2 className="text-white text-xl font-semibold mb-4">Email (Optional)</h2>
            <p className="text-[#888888] text-sm mb-4">Add an email for notifications and account recovery</p>
            <input
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full h-12 px-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[#e0e0e0] placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#ff8c42] focus:border-[#ff8c42] transition-all duration-200"
            />
          </div>

          {/* Location Detection */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
            <h2 className="text-white text-xl font-semibold mb-4">📍 Location</h2>
            <p className="text-[#888888] text-sm mb-4">Help us find workout partners near you</p>
            
            {locationData.state === LocationState.IDLE && (
              <button
                onClick={handleDetectLocation}
                className="w-full h-12 bg-[#ff8c42] text-black font-bold rounded-lg hover:bg-[#ffa726] focus:outline-none focus:ring-2 focus:ring-[#ff8c42] transition-all duration-200"
              >
                Detect My Location
              </button>
            )}

            {locationData.state === LocationState.LOADING && (
              <div className="flex items-center justify-center h-12 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                <svg className="animate-spin h-5 w-5 text-[#ff8c42] mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-[#e0e0e0]">Detecting location...</span>
              </div>
            )}

            {locationData.state === LocationState.SUCCESS && (
              <div className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border border-[#10b981]">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-[#10b981] mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[#e0e0e0] font-medium">{locationData.name}</span>
                </div>
                <button
                  onClick={handleDetectLocation}
                  className="text-[#ff8c42] text-sm hover:text-[#ffa726] transition-colors duration-200"
                >
                  Change
                </button>
              </div>
            )}

            {locationData.state === LocationState.ERROR && (
              <div className="p-3 bg-[#0a0a0a] rounded-lg border border-[#ef4444]">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-[#ef4444] mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[#ef4444] font-medium">Location Error</span>
                </div>
                <p className="text-[#888888] text-sm mb-3">{locationData.error}</p>
                <button
                  onClick={handleDetectLocation}
                  className="text-[#ff8c42] text-sm hover:text-[#ffa726] transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            )}

            <button
              onClick={() => handleSubmit(true)}
              className="w-full mt-3 h-10 text-[#888888] text-sm hover:text-[#e0e0e0] transition-colors duration-200"
            >
              Skip location for now
            </button>
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="flex items-center text-sm text-[#ef4444] bg-[#0a0a0a] p-3 rounded-lg border border-[#ef4444]">
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {submitError}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className={`w-full h-12 bg-[#ff8c42] text-black font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff8c42] transition-all duration-200 hover:bg-[#ffa726] ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  SAVING...
                </div>
              ) : (
                'COMPLETE SETUP'
              )}
            </button>
            
            <button
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="w-full h-10 text-[#888888] text-sm hover:text-[#e0e0e0] transition-colors duration-200"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}