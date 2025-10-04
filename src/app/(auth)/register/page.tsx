'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  formatPhoneAsUserTypes
} from '@/lib/utils/phone';
import { 
  validatePhoneNumber, 
  validatePassword, 
  validateEmail, 
  validateName 
} from '@/lib/utils/validation';

interface FormData {
  countryCode: string;
  phone: string;
  password: string;
  name: string;
  email: string;
}

interface FormErrors {
  countryCode?: string;
  phone?: string;
  password?: string;
  name?: string;
  email?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    countryCode: '+1',
    phone: '',
    password: '',
    name: '',
    email: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-zA-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 25;
    return strength;
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    let formattedValue = value;
    
    // Format phone number as user types (only if it's not countryCode)
    if (field === 'phone') {
      formattedValue = formatPhoneAsUserTypes(value);
    }
    
    // Calculate password strength
    if (field === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
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
        // Combine country code and phone number for validation
        const fullPhone = formData.countryCode + value.replace(/\D/g, '');
        const phoneValidation = validatePhoneNumber(fullPhone);
        error = phoneValidation.valid ? undefined : phoneValidation.message;
        break;
      case 'password':
        const passwordValidation = validatePassword(value);
        error = passwordValidation.valid ? undefined : passwordValidation.message;
        break;
      case 'name':
        const nameValidation = validateName(value);
        error = nameValidation.valid ? undefined : nameValidation.message;
        break;
      case 'email':
        const emailValidation = validateEmail(value);
        error = emailValidation?.valid ? undefined : emailValidation?.message;
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

    // Validate phone (combine with country code)
    const fullPhone = formData.countryCode + formData.phone.replace(/\D/g, '');
    const phoneValidation = validatePhoneNumber(fullPhone);
    if (!phoneValidation.valid) {
      newErrors.phone = phoneValidation.message;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.message;
    }

    // Validate name
    const nameValidation = validateName(formData.name);
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.message;
    }

    // Validate email (optional)
    const emailValidation = validateEmail(formData.email);
    if (emailValidation && !emailValidation.valid) {
      newErrors.email = emailValidation.message;
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
      // Combine country code and phone number
      const fullPhone = formData.countryCode + formData.phone.replace(/\D/g, '');
      
      await signUp(
        fullPhone,
        formData.password,
        formData.name.trim(),
        formData.email.trim() || undefined
      );
      
      console.log('Registration successful, redirecting to profile setup...');
      // Redirect to profile setup on success
      router.push('/profile-setup');
    } catch (error) {
      console.error('Registration error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get password strength color
  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return '#ef4444'; // red
    if (passwordStrength < 50) return '#f59e0b'; // amber
    if (passwordStrength < 75) return '#3b82f6'; // blue
    return '#10b981'; // green
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-grow bg-background-light dark:bg-black p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-background-light dark:bg-[#1a1a1a] p-6 rounded-xl shadow-lg border-2 border-background-dark/50 dark:border-[#2a2a2a]/80">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#ff8c42] to-[#f8d03a] bg-clip-text text-transparent">
                Create Account
              </h1>
              <p className="text-gray-600 dark:text-[#a0a0a0] mt-2">
                Join WorkoutSync to start your fitness journey.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#e0e0e0] mb-1" htmlFor="name">
                  Name*
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onBlur={() => handleFieldBlur('name')}
                  className={`w-full h-12 px-4 bg-white dark:bg-[#0a0a0a] border rounded-lg text-gray-900 dark:text-[#e0e0e0] placeholder-gray-400 dark:placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#ff8c42] focus:border-[#ff8c42] transition-all duration-300 ${
                    errors.name 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 dark:border-[#2a2a2a]'
                  }`}
                  disabled={isLoading}
                />
                {errors.name && (
                  <div className="mt-1 flex items-center text-sm text-red-500">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.name}
                  </div>
                )}
              </div>

              {/* Phone Number Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#e0e0e0] mb-1" htmlFor="phone">
                  Phone Number*
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.countryCode}
                    onChange={(e) => handleInputChange('countryCode', e.target.value)}
                    className="h-12 px-3 bg-white dark:bg-[#0a0a0a] border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#ff8c42] focus:border-[#ff8c42] transition-all duration-300"
                    disabled={isLoading}
                  >
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+81">🇯🇵 +81</option>
                    <option value="+86">🇨🇳 +86</option>
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+55">🇧🇷 +55</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+39">🇮🇹 +39</option>
                  </select>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    onBlur={() => handleFieldBlur('phone')}
                    className={`flex-1 h-12 px-4 bg-white dark:bg-[#0a0a0a] border rounded-lg text-gray-900 dark:text-[#e0e0e0] placeholder-gray-400 dark:placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#ff8c42] focus:border-[#ff8c42] transition-all duration-300 ${
                      errors.phone 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 dark:border-[#2a2a2a]'
                    }`}
                    disabled={isLoading}
                  />
                </div>
                {errors.phone && (
                  <div className="mt-1 flex items-center text-sm text-red-500">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.phone}
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#e0e0e0] mb-1" htmlFor="email">
                  Email <span className="text-[#a0a0a0]">(optional)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={() => handleFieldBlur('email')}
                  className={`w-full h-12 px-4 bg-white dark:bg-[#0a0a0a] border rounded-lg text-gray-900 dark:text-[#e0e0e0] placeholder-gray-400 dark:placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#ff8c42] focus:border-[#ff8c42] transition-all duration-300 ${
                    errors.email 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 dark:border-[#2a2a2a]'
                  }`}
                  disabled={isLoading}
                />
                {errors.email && (
                  <div className="mt-1 flex items-center text-sm text-red-500">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.email}
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
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="pt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${passwordStrength}%`,
                          backgroundColor: getPasswordStrengthColor()
                        }}
                      />
                    </div>
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
                    CREATING ACCOUNT...
                  </div>
                ) : (
                  'CREATE ACCOUNT'
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <a
                href="/login"
                className="text-sm text-gray-600 dark:text-[#a0a0a0] hover:text-[#ff8c42] dark:hover:text-[#ff8c42] transition-colors duration-300"
              >
                Already have an account? Log in
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
