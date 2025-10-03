// Validation result type
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

// Phone number validation
export function validatePhoneNumber(phone: string): ValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, message: 'Phone number is required' };
  }

  const trimmed = phone.trim();
  
  // Must start with +
  if (!trimmed.startsWith('+')) {
    return { valid: false, message: 'Phone number must include country code (e.g., +1)' };
  }

  // Remove + and check if remaining characters are digits
  const digits = trimmed.slice(1);
  if (!/^\d+$/.test(digits)) {
    return { valid: false, message: 'Phone number can only contain digits after the country code' };
  }

  // Check length (10-15 digits after country code)
  if (digits.length < 10 || digits.length > 15) {
    return { valid: false, message: 'Phone number must be 10-15 digits long' };
  }

  return { valid: true };
}

// Email validation
export function validateEmail(email: string): ValidationResult | undefined {
  if (!email || email.trim() === '') {
    return undefined; // Email is optional
  }

  const trimmed = email.trim();
  
  // Basic email regex
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  
  if (!emailRegex.test(trimmed)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }

  if (trimmed.length > 254) {
    return { valid: false, message: 'Email address is too long' };
  }

  return { valid: true };
}

// Password validation
export function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { valid: false, message: 'Password is too long' };
  }

  // Check for at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one letter' };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  return { valid: true };
}

// Name validation
export function validateName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: 'Name is required' };
  }

  const trimmed = name.trim();
  
  if (trimmed.length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters long' };
  }

  if (trimmed.length > 50) {
    return { valid: false, message: 'Name must be less than 50 characters' };
  }

  // Only letters, spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(trimmed)) {
    return { valid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { valid: true };
}

// Pace range validation
export function validatePaceRange(min?: number, max?: number): ValidationResult {
  // If neither provided, it's valid (optional field)
  if (min === undefined && max === undefined) {
    return { valid: true };
  }

  // If only one provided, check if it's positive
  if (min !== undefined) {
    if (typeof min !== 'number' || isNaN(min) || min <= 0) {
      return { valid: false, message: 'Pace must be a positive number' };
    }
    if (min < 4 || min > 20) {
      return { valid: false, message: 'Pace must be between 4 and 20 minutes per mile' };
    }
  }

  if (max !== undefined) {
    if (typeof max !== 'number' || isNaN(max) || max <= 0) {
      return { valid: false, message: 'Pace must be a positive number' };
    }
    if (max < 4 || max > 20) {
      return { valid: false, message: 'Pace must be between 4 and 20 minutes per mile' };
    }
  }

  // If both provided, check that min < max
  if (min !== undefined && max !== undefined && min >= max) {
    return { valid: false, message: 'Minimum pace must be less than maximum pace' };
  }

  return { valid: true };
}

// Activity preferences validation
export function validateActivityPreferences(prefs: string[]): ValidationResult {
  if (!Array.isArray(prefs)) {
    return { valid: false, message: 'Activity preferences must be an array' };
  }

  // Array can be empty
  if (prefs.length === 0) {
    return { valid: true };
  }

  const validActivities = ['run', 'bike', 'walk'];
  
  for (const pref of prefs) {
    if (typeof pref !== 'string' || !validActivities.includes(pref)) {
      return { valid: false, message: 'Activity preferences can only include: run, bike, walk' };
    }
  }

  return { valid: true };
}

// Phone number formatting
export function formatPhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it starts with +, keep it
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // If it's just digits, assume US number and add +1
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If it's 11 digits and starts with 1, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // Return as is if we can't determine format
  return phone;
}
