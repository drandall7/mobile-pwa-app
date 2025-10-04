import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  isValidPhoneNumber, 
  isValidEmail, 
  parsePhoneNumber,
  VALIDATION_LIMITS,
  type UserInsert 
} from '@/types/database';

// Request body type
interface RegisterRequest {
  phone_number: string;
  password: string;
  name: string;
  email?: string;
}

// Response types
interface RegisterSuccessResponse {
  user: {
    id: string;
    phone_number: string;
    email: string | null;
    name: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at?: number;
    token_type: string;
    user: {
      id: string;
      phone?: string;
      email?: string;
    };
  };
}

interface ErrorResponse {
  error: string;
  details?: string;
  code?: string;
}

// Validation functions
function validatePhoneNumber(phone: string): string | null {
  if (!phone || typeof phone !== 'string') {
    return 'Phone number is required';
  }

  // Parse to E.164 format if needed
  const normalizedPhone = parsePhoneNumber(phone);
  
  if (!isValidPhoneNumber(normalizedPhone)) {
    return 'Phone number must be in valid E.164 format (e.g., +19195551234)';
  }

  return null;
}

function validatePassword(password: string): string | null {
  if (!password || typeof password !== 'string') {
    return 'Password is required';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  if (password.length > 128) {
    return 'Password must be less than 128 characters';
  }

  // Check for at least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  if (!hasLetter) {
    return 'Password must contain at least one letter';
  }
  
  if (!hasNumber) {
    return 'Password must contain at least one number';
  }

  return null;
}

function validateName(name: string): string | null {
  if (!name || typeof name !== 'string') {
    return 'Name is required';
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length < VALIDATION_LIMITS.NAME_MIN_LENGTH) {
    return `Name must be at least ${VALIDATION_LIMITS.NAME_MIN_LENGTH} character(s) long`;
  }

  if (trimmedName.length > VALIDATION_LIMITS.NAME_MAX_LENGTH) {
    return `Name must be less than ${VALIDATION_LIMITS.NAME_MAX_LENGTH} characters`;
  }

  return null;
}

function validateEmail(email: string | undefined): string | null {
  if (!email) {
    return null; // Email is optional
  }

  if (typeof email !== 'string') {
    return 'Email must be a string';
  }

  const trimmedEmail = email.trim();
  
  if (trimmedEmail.length === 0) {
    return null; // Empty string is treated as no email
  }

  if (trimmedEmail.length > VALIDATION_LIMITS.EMAIL_MAX_LENGTH) {
    return `Email must be less than ${VALIDATION_LIMITS.EMAIL_MAX_LENGTH} characters`;
  }

  if (!isValidEmail(trimmedEmail)) {
    return 'Email must be in valid format';
  }

  return null;
}

// Main handler
export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('=== REGISTER API ROUTE CALLED ===');
  try {
    // Parse request body
    console.log('Parsing request body...');
    let body: RegisterRequest;
    try {
      body = await request.json();
      console.log('Request body parsed:', body);
    } catch {
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        },
        { status: 400 }
      );
    }

    // Validate required fields
    const { phone_number, password, name, email } = body;

    // Validate phone number
    const phoneError = validatePhoneNumber(phone_number);
    if (phoneError) {
      return NextResponse.json<ErrorResponse>(
        { 
          error: phoneError,
          code: 'INVALID_PHONE'
        },
        { status: 400 }
      );
    }

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json<ErrorResponse>(
        { 
          error: passwordError,
          code: 'INVALID_PASSWORD'
        },
        { status: 400 }
      );
    }

    // Validate name
    const nameError = validateName(name);
    if (nameError) {
      return NextResponse.json<ErrorResponse>(
        { 
          error: nameError,
          code: 'INVALID_NAME'
        },
        { status: 400 }
      );
    }

    // Validate email (optional)
    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json<ErrorResponse>(
        { 
          error: emailError,
          code: 'INVALID_EMAIL'
        },
        { status: 400 }
      );
    }

    // Normalize phone number to E.164 format
    const normalizedPhone = parsePhoneNumber(phone_number);
    const normalizedEmail = email?.trim() || null;

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Server configuration error',
          details: 'Supabase configuration is missing',
          code: 'CONFIG_ERROR'
        },
        { status: 500 }
      );
    }

    // Create Supabase client
    console.log('Creating Supabase client...');
    const supabase = await createClient();
    console.log('Supabase client created successfully');

    // Check if phone number already exists
    console.log('Checking if phone number exists:', normalizedPhone);
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, phone_number')
      .eq('phone_number', normalizedPhone)
      .single();
    
    console.log('Phone check result:', { existingUser, checkError });

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected
      console.error('Error checking existing user:', checkError);
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Failed to check existing user',
          details: 'Please try again later',
          code: 'DATABASE_ERROR'
        },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Phone number already registered',
          details: 'An account with this phone number already exists',
          code: 'PHONE_EXISTS'
        },
        { status: 409 }
      );
    }

    // Check if email already exists (if provided)
    if (normalizedEmail) {
      const { data: existingEmailUser, error: emailCheckError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', normalizedEmail)
        .single();

      if (emailCheckError && emailCheckError.code !== 'PGRST116') {
        console.error('Error checking existing email:', emailCheckError);
        return NextResponse.json<ErrorResponse>(
          { 
            error: 'Failed to check existing email',
            details: 'Please try again later',
            code: 'DATABASE_ERROR'
          },
          { status: 500 }
        );
      }

      if (existingEmailUser) {
        return NextResponse.json<ErrorResponse>(
          { 
            error: 'Email already registered',
            details: 'An account with this email already exists',
            code: 'EMAIL_EXISTS'
          },
          { status: 409 }
        );
      }
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      phone: normalizedPhone,
      password: password,
      options: {
        data: {
          name: name.trim(),
          email: normalizedEmail,
          phone_number: normalizedPhone,
        },
      },
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      console.error('Auth error details:', {
        message: authError.message,
        status: authError.status,
        name: authError.name
      });
      
      // Handle specific auth errors
      if (authError.message.includes('already registered')) {
        return NextResponse.json<ErrorResponse>(
          { 
            error: 'Phone number already registered',
            details: 'An account with this phone number already exists',
            code: 'PHONE_EXISTS'
          },
          { status: 409 }
        );
      }

      if (authError.message.includes('password')) {
        return NextResponse.json<ErrorResponse>(
          { 
            error: 'Invalid password',
            details: 'Password does not meet requirements',
            code: 'INVALID_PASSWORD'
          },
          { status: 400 }
        );
      }

      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Failed to create account',
          details: 'Please try again later',
          code: 'AUTH_ERROR'
        },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Failed to create user',
          details: 'User creation failed',
          code: 'USER_CREATION_FAILED'
        },
        { status: 500 }
      );
    }

    // Create user profile in users table
    console.log('Creating user profile...');
    const userProfile: UserInsert = {
      id: authData.user.id,
      phone_number: normalizedPhone,
      email: normalizedEmail,
      name: name.trim(),
      activity_preferences: [], // Default empty array
      pace_range_min: null,
      pace_range_max: null,
      home_location_coords: null,
      home_location_name: null,
    };

    console.log('User profile data:', userProfile);
    const { data: insertData, error: profileError } = await supabase
      .from('users')
      .insert(userProfile)
      .select();
    
    console.log('Profile insert result:', { insertData, profileError });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      
      // If profile creation fails, we should clean up the auth user
      // This is a best-effort cleanup - if it fails, we log it
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }

      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Failed to create user profile',
          details: 'Please try again later',
          code: 'PROFILE_CREATION_FAILED'
        },
        { status: 500 }
      );
    }

    // Prepare success response
    const response: RegisterSuccessResponse = {
      user: {
        id: authData.user.id,
        phone_number: normalizedPhone,
        email: normalizedEmail,
        name: name.trim(),
      },
      session: {
        access_token: authData.session?.access_token || '',
        refresh_token: authData.session?.refresh_token || '',
        expires_in: authData.session?.expires_in || 3600,
        expires_at: authData.session?.expires_at,
        token_type: authData.session?.token_type || 'bearer',
        user: {
          id: authData.user.id,
          phone: authData.user.phone,
          email: authData.user.email,
        },
      },
    };

    return NextResponse.json(response, { status: 201 });

         } catch (err) {
           console.error('Unexpected error in register route:', err);
           
           // Log more details for debugging
           if (err instanceof Error) {
             console.error('Error message:', err.message);
             console.error('Error stack:', err.stack);
           }
           
           return NextResponse.json<ErrorResponse>(
             { 
               error: 'Internal server error',
               details: err instanceof Error ? err.message : 'An unexpected error occurred',
               code: 'INTERNAL_ERROR'
             },
             { status: 500 }
           );
         }
}

// Handle unsupported methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json<ErrorResponse>(
    { 
      error: 'Method not allowed',
      details: 'This endpoint only supports POST requests',
      code: 'METHOD_NOT_ALLOWED'
    },
    { status: 405 }
  );
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json<ErrorResponse>(
    { 
      error: 'Method not allowed',
      details: 'This endpoint only supports POST requests',
      code: 'METHOD_NOT_ALLOWED'
    },
    { status: 405 }
  );
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json<ErrorResponse>(
    { 
      error: 'Method not allowed',
      details: 'This endpoint only supports POST requests',
      code: 'METHOD_NOT_ALLOWED'
    },
    { status: 405 }
  );
}
