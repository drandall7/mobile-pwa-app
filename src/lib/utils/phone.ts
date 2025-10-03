// Format phone for display (E.164 to user-friendly)
export function formatPhoneForDisplay(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  const cleaned = phone.replace(/\D/g, '');
  
  // Handle US numbers (+1 followed by 10 digits)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const areaCode = cleaned.slice(1, 4);
    const exchange = cleaned.slice(4, 7);
    const number = cleaned.slice(7);
    return `(${areaCode}) ${exchange}-${number}`;
  }
  
  // Handle 10-digit US numbers
  if (cleaned.length === 10) {
    const areaCode = cleaned.slice(0, 3);
    const exchange = cleaned.slice(3, 6);
    const number = cleaned.slice(6);
    return `(${areaCode}) ${exchange}-${number}`;
  }
  
  // For international numbers, return as-is with + prefix
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // Fallback: return original
  return phone;
}

// Format phone as user types
export function formatPhoneAsUserTypes(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove all non-numeric characters except +
  let cleaned = input.replace(/[^\d+]/g, '');
  
  // If user is typing a +, allow it
  if (cleaned.startsWith('+')) {
    // Remove the + for processing
    cleaned = cleaned.slice(1);
    
    // If it's a US number (starts with 1), format it
    if (cleaned.startsWith('1') && cleaned.length <= 11) {
      const digits = cleaned.slice(1); // Remove the 1
      return formatUSPhone(digits);
    }
    
    // For other international numbers, return as-is
    return `+${cleaned}`;
  }
  
  // For regular input without +, format as US number
  return formatUSPhone(cleaned);
}

// Helper function to format US phone numbers
function formatUSPhone(digits: string): string {
  if (digits.length === 0) return '';
  
  if (digits.length <= 3) {
    return `(${digits}`;
  }
  
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  
  if (digits.length <= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // If more than 10 digits, truncate
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

// Check if phone has enough digits
export function isValidPhoneLength(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const digits = input.replace(/\D/g, '');
  
  // For US numbers, need 10 digits
  return digits.length === 10;
}

// Parse phone to E.164 format
export function parsePhoneToE164(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove all non-numeric characters except +
  let cleaned = input.replace(/[^\d+]/g, '');
  
  // If it already starts with +, return as-is
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // Extract just the digits
  const digits = cleaned.replace(/\D/g, '');
  
  // If 10 digits, assume US number
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If 11 digits and starts with 1, assume US number
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // For other cases, return as-is (might be incomplete)
  return input;
}

// Get phone number placeholder
export function getPhonePlaceholder(): string {
  return '(919) 555-1234';
}

// Check if phone number is complete
export function isPhoneComplete(input: string): boolean {
  const e164 = parsePhoneToE164(input);
  const digits = e164.replace(/\D/g, '');
  
  // For US numbers, need 11 digits (1 + 10)
  return digits.length === 11 && digits.startsWith('1');
}

// Extract country code from E.164 number
export function extractCountryCode(phone: string): string {
  if (!phone || !phone.startsWith('+')) {
    return '';
  }
  
  const digits = phone.slice(1);
  
  // US/Canada
  if (digits.startsWith('1') && digits.length === 11) {
    return '+1';
  }
  
  // For now, just return +1 as default
  return '+1';
}
