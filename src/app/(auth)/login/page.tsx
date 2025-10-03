'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  formatPhoneAsUserTypes, 
  parsePhoneToE164, 
  getPhonePlaceholder 
} from '@/lib/utils/phone';
import { 
  validatePhoneNumber, 
  validatePassword 
} from '@/lib/utils/validation';

interface FormData {
  phone: string;
  password: string;
}

interface FormErrors {
  phone?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    phone: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    let formattedValue = value;
    
    // Format phone number as user types
    if (field === 'phone') {
      formattedValue = formatPhoneAsUserTypes(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
    
    // Clear submit error
    if (submitError) {
      setSubmitError('');
    }
  };

  // Validate field on blur
  const handleFieldBlur = (field: keyof FormData) => {
    const value = formData[field];
    let error: string | undefined;

    switch (field) {
      case 'phone':
        const phoneValidation = validatePhoneNumber(value);
        error = phoneValidation.valid ? undefined : phoneValidation.message;
        break;
      case 'password':
        const passwordValidation = validatePassword(value);
        error = passwordValidation.valid ? undefined : passwordValidation.message;
        break;
    }

    if (error) {
      setErrors(prev => ({
        ...prev,
        [field]: error
      }));
    }
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate phone
    const phoneValidation = validatePhoneNumber(formData.phone);
    if (!phoneValidation.valid) {
      newErrors.phone = phoneValidation.message;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSubmitError('');

    try {
      // Convert phone to E.164 format
      const phoneE164 = parsePhoneToE164(formData.phone);
      
      await signIn(phoneE164, formData.password);
      
      // Redirect to feed on success
      router.push('/feed');
    } catch (error) {
      console.error('Login error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-grow bg-background-light dark:bg-black p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-background-light dark:bg-[#1a1a1a] p-6 rounded-xl shadow-lg border-2 border-background-dark/50 dark:border-[#2a2a2a]/80">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#ff8c42] to-[#f8d03a] bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-gray-600 dark:text-[#a0a0a0] mt-2">
                Sign in to your WorkoutSync account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Phone Number Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#e0e0e0] mb-1" htmlFor="phone">
                  Phone Number*
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder={getPhonePlaceholder()}
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  onBlur={() => handleFieldBlur('phone')}
                  className={`w-full h-12 px-4 bg-white dark:bg-[#0a0a0a] border rounded-lg text-gray-900 dark:text-[#e0e0e0] placeholder-gray-400 dark:placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#ff8c42] focus:border-[#ff8c42] transition-all duration-300 ${
                    errors.phone 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 dark:border-[#2a2a2a]'
                  }`}
                  disabled={isLoading}
                />
                {errors.phone && (
                  <div className="mt-1 flex items-center text-sm text-red-500">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.phone}
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#e0e0e0] mb-1" htmlFor="password">
                  Password*
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onBlur={() => handleFieldBlur('password')}
                  className={`w-full h-12 px-4 bg-white dark:bg-[#0a0a0a] border rounded-lg text-gray-900 dark:text-[#e0e0e0] placeholder-gray-400 dark:placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#ff8c42] focus:border-[#ff8c42] transition-all duration-300 ${
                    errors.password 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 dark:border-[#2a2a2a]'
                  }`}
                  disabled={isLoading}
                />
                {errors.password && (
                  <div className="mt-1 flex items-center text-sm text-red-500">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.password}
                  </div>
                )}
              </div>

              {/* Submit Error */}
              {submitError && (
                <div className="flex items-center text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {submitError}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full h-12 bg-[#ff8c42] text-black font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff8c42] dark:focus:ring-offset-[#1a1a1a] transition-all duration-300 hover:scale-105 active:scale-95 ${
                  isLoading 
                    ? 'opacity-50 cursor-not-allowed hover:scale-100' 
                    : 'hover:bg-[#ff8c42]/90'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    SIGNING IN...
                  </div>
                ) : (
                  'SIGN IN'
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <a
                href="/register"
                className="text-sm text-gray-600 dark:text-[#a0a0a0] hover:text-[#ff8c42] dark:hover:text-[#ff8c42] transition-colors duration-300"
              >
                Don&apos;t have an account? Create one
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
