// Error handling utility for comprehensive error management
// Provides user-friendly error messages, logging, and retry logic

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  PERMISSION = 'PERMISSION',
  DATA = 'DATA',
  PHONE = 'PHONE',
  UNKNOWN = 'UNKNOWN'
}

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  userMessage: string;
  actionable: string;
  retryable: boolean;
  originalError?: any;
  context?: string;
}

export interface RetryOptions {
  maxAttempts: number;
  delay: number;
  backoff?: boolean;
}

// Error message mappings for user-friendly display
const ERROR_MESSAGES = {
  [ErrorType.NETWORK]: {
    userMessage: 'Network connection issue. Please check your internet connection.',
    actionable: 'Try again or check your internet connection.',
    retryable: true
  },
  [ErrorType.VALIDATION]: {
    userMessage: 'Please check your input and try again.',
    actionable: 'Review the highlighted fields and correct any errors.',
    retryable: false
  },
  [ErrorType.AUTHENTICATION]: {
    userMessage: 'Your session has expired. Please log in again.',
    actionable: 'Please log in again to continue.',
    retryable: false
  },
  [ErrorType.PERMISSION]: {
    userMessage: 'Permission required to continue.',
    actionable: 'Please allow the requested permission in your browser settings.',
    retryable: false
  },
  [ErrorType.DATA]: {
    userMessage: 'Unable to load your data. Please try again.',
    actionable: 'Refresh the page or try again later.',
    retryable: true
  },
  [ErrorType.PHONE]: {
    userMessage: 'Please enter a valid phone number with country code (e.g., +1 555-555-5555)',
    actionable: 'Make sure your phone number includes the country code and is in the correct format.',
    retryable: false
  },
  [ErrorType.UNKNOWN]: {
    userMessage: 'Something went wrong. Please try again.',
    actionable: 'If the problem persists, please contact support.',
    retryable: true
  }
};

// Phone-specific error messages
const PHONE_ERROR_MESSAGES = {
  INVALID_FORMAT: 'Please enter a valid phone number with country code (e.g., +1 555-555-5555)',
  ALREADY_REGISTERED: 'This phone number is already registered. Try logging in instead.',
  INVALID_COUNTRY_CODE: 'Please include a valid country code (e.g., +1 for US)',
  TOO_SHORT: 'Phone number is too short. Please include the full number with country code.',
  TOO_LONG: 'Phone number is too long. Please check the format.',
  INVALID_CHARACTERS: 'Phone number contains invalid characters. Use only numbers and + sign.',
  MISSING_COUNTRY_CODE: 'Please include a country code at the beginning (e.g., +1)'
};

// Log error to console with context
export function logError(errorInfo: ErrorInfo, additionalContext?: any): void {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    type: errorInfo.type,
    message: errorInfo.message,
    userMessage: errorInfo.userMessage,
    context: errorInfo.context,
    originalError: errorInfo.originalError,
    additionalContext,
    url: typeof window !== 'undefined' ? window.location.href : 'server',
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
  };

  console.error('[ERROR]', logData);

  // In production, you might want to send this to an error tracking service
  // Example: Sentry, LogRocket, or your own logging endpoint
  if (process.env.NODE_ENV === 'production') {
    // Send to error tracking service
    // trackError(logData);
  }
}

// Detect error type from various error sources
export function detectErrorType(error: any, context?: string): ErrorType {
  if (!error) return ErrorType.UNKNOWN;

  const errorString = error.toString().toLowerCase();
  const errorMessage = error.message?.toLowerCase() || '';

  // Network errors
  if (
    errorString.includes('network') ||
    errorString.includes('fetch') ||
    errorString.includes('connection') ||
    errorString.includes('timeout') ||
    error.code === 'NETWORK_ERROR' ||
    error.code === 'TIMEOUT' ||
    (error.status >= 500 && error.status < 600)
  ) {
    return ErrorType.NETWORK;
  }

  // Authentication errors
  if (
    errorString.includes('unauthorized') ||
    errorString.includes('forbidden') ||
    errorString.includes('authentication') ||
    errorString.includes('session') ||
    error.status === 401 ||
    error.status === 403 ||
    error.code === 'AUTH_ERROR' ||
    error.code === 'SESSION_EXPIRED'
  ) {
    return ErrorType.AUTHENTICATION;
  }

  // Permission errors
  if (
    errorString.includes('permission') ||
    errorString.includes('denied') ||
    errorString.includes('blocked') ||
    error.name === 'NotAllowedError' ||
    error.name === 'PermissionDeniedError'
  ) {
    return ErrorType.PERMISSION;
  }

  // Phone-specific errors
  if (
    context?.includes('phone') ||
    errorString.includes('phone') ||
    errorMessage.includes('phone') ||
    error.code === 'INVALID_PHONE' ||
    error.code === 'PHONE_ALREADY_EXISTS'
  ) {
    return ErrorType.PHONE;
  }

  // Validation errors
  if (
    errorString.includes('validation') ||
    errorString.includes('invalid') ||
    errorString.includes('required') ||
    error.status === 400 ||
    error.code === 'VALIDATION_ERROR'
  ) {
    return ErrorType.VALIDATION;
  }

  // Data errors
  if (
    errorString.includes('not found') ||
    errorString.includes('does not exist') ||
    error.status === 404 ||
    error.code === 'NOT_FOUND' ||
    error.code === 'PROFILE_NOT_FOUND'
  ) {
    return ErrorType.DATA;
  }

  return ErrorType.UNKNOWN;
}

// Create error info object
export function createErrorInfo(
  error: any,
  context?: string,
  customUserMessage?: string
): ErrorInfo {
  const type = detectErrorType(error, context);
  const baseError = ERROR_MESSAGES[type];

  let userMessage = customUserMessage || baseError.userMessage;
  let actionable = baseError.actionable;

  // Handle phone-specific errors
  if (type === ErrorType.PHONE) {
    const phoneError = getPhoneSpecificError(error);
    userMessage = phoneError.message;
    actionable = phoneError.actionable;
  }

  // Handle specific validation errors
  if (type === ErrorType.VALIDATION) {
    const validationError = getValidationSpecificError(error);
    if (validationError) {
      userMessage = validationError.message;
      actionable = validationError.actionable;
    }
  }

  const errorInfo: ErrorInfo = {
    type,
    message: error.message || error.toString(),
    userMessage,
    actionable,
    retryable: baseError.retryable,
    originalError: error,
    context
  };

  // Log the error
  logError(errorInfo);

  return errorInfo;
}

// Get phone-specific error details
function getPhoneSpecificError(error: any): { message: string; actionable: string } {
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code || '';

  if (
    errorMessage.includes('already') ||
    errorMessage.includes('exists') ||
    errorCode === 'PHONE_ALREADY_EXISTS'
  ) {
    return {
      message: PHONE_ERROR_MESSAGES.ALREADY_REGISTERED,
      actionable: 'Try logging in instead, or contact support if you forgot your password.'
    };
  }

  if (
    errorMessage.includes('country') ||
    errorMessage.includes('code') ||
    errorCode === 'INVALID_COUNTRY_CODE'
  ) {
    return {
      message: PHONE_ERROR_MESSAGES.INVALID_COUNTRY_CODE,
      actionable: 'Make sure to include your country code (e.g., +1 for US, +44 for UK).'
    };
  }

  if (
    errorMessage.includes('short') ||
    errorMessage.includes('length') ||
    errorCode === 'PHONE_TOO_SHORT'
  ) {
    return {
      message: PHONE_ERROR_MESSAGES.TOO_SHORT,
      actionable: 'Include the full phone number with country code.'
    };
  }

  if (
    errorMessage.includes('long') ||
    errorCode === 'PHONE_TOO_LONG'
  ) {
    return {
      message: PHONE_ERROR_MESSAGES.TOO_LONG,
      actionable: 'Check that your phone number is in the correct format.'
    };
  }

  if (
    errorMessage.includes('invalid') ||
    errorMessage.includes('character') ||
    errorCode === 'INVALID_CHARACTERS'
  ) {
    return {
      message: PHONE_ERROR_MESSAGES.INVALID_CHARACTERS,
      actionable: 'Use only numbers and the + sign for country code.'
    };
  }

  // Default phone error
  return {
    message: PHONE_ERROR_MESSAGES.INVALID_FORMAT,
    actionable: 'Make sure your phone number includes the country code and is in the correct format.'
  };
}

// Get validation-specific error details
function getValidationSpecificError(error: any): { message: string; actionable: string } | null {
  const errorMessage = error.message?.toLowerCase() || '';
  const field = error.field || '';

  if (field === 'name' || errorMessage.includes('name')) {
    return {
      message: 'Please enter a valid name.',
      actionable: 'Name should be at least 2 characters long and contain only letters.'
    };
  }

  if (field === 'email' || errorMessage.includes('email')) {
    return {
      message: 'Please enter a valid email address.',
      actionable: 'Make sure your email address is in the correct format (e.g., user@example.com).'
    };
  }

  if (field === 'password' || errorMessage.includes('password')) {
    return {
      message: 'Password must be at least 6 characters long.',
      actionable: 'Choose a password with at least 6 characters.'
    };
  }

  return null;
}

// Retry logic with exponential backoff
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = { maxAttempts: 3, delay: 1000, backoff: true }
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on authentication or validation errors
      const errorType = detectErrorType(error);
      if (!ERROR_MESSAGES[errorType].retryable) {
        throw error;
      }
      
      if (attempt === options.maxAttempts) {
        break;
      }
      
      const delay = options.backoff 
        ? options.delay * Math.pow(2, attempt - 1)
        : options.delay;
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Handle API errors specifically
export function handleApiError(error: any, context?: string): ErrorInfo {
  // Extract error details from API response
  let errorDetails = error;
  
  if (error.response?.data) {
    errorDetails = error.response.data;
  } else if (error.data) {
    errorDetails = error.data;
  }

  return createErrorInfo(errorDetails, context);
}

// Handle location permission errors
export function handleLocationError(error: any): ErrorInfo {
  const errorInfo = createErrorInfo(error, 'location');
  
  if (error.name === 'NotAllowedError') {
    errorInfo.userMessage = 'Location access is required to find nearby workout partners.';
    errorInfo.actionable = 'Please enable location access in your browser settings and refresh the page.';
  } else if (error.name === 'PositionUnavailableError') {
    errorInfo.userMessage = 'Unable to determine your location.';
    errorInfo.actionable = 'Make sure you have a good internet connection and try again.';
  } else if (error.name === 'TimeoutError') {
    errorInfo.userMessage = 'Location request timed out.';
    errorInfo.actionable = 'Please try again or enter your location manually.';
  }
  
  return errorInfo;
}

// Handle notification permission errors
export function handleNotificationError(error: any): ErrorInfo {
  const errorInfo = createErrorInfo(error, 'notifications');
  
  if (error.name === 'NotAllowedError') {
    errorInfo.userMessage = 'Notification permission is required for workout reminders.';
    errorInfo.actionable = 'Please enable notifications in your browser settings to receive workout updates.';
  }
  
  return errorInfo;
}

// Display error to user (for UI components)
export function displayError(errorInfo: ErrorInfo): string {
  return errorInfo.userMessage;
}

// Get actionable steps for error recovery
export function getActionableSteps(errorInfo: ErrorInfo): string {
  return errorInfo.actionable;
}

// Check if error is retryable
export function isRetryable(errorInfo: ErrorInfo): boolean {
  return errorInfo.retryable;
}

// Error boundary helper for React components
export function createErrorBoundaryMessage(errorInfo: ErrorInfo): string {
  return `Something went wrong: ${errorInfo.userMessage}. ${errorInfo.actionable}`;
}
