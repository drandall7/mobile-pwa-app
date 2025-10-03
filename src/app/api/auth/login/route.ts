import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  isValidPhoneNumber, 
  parsePhoneNumber,
  type User 
} from '@/types/database';

// Request body type
interface LoginRequest {
  phone_number: string;
  password: string;
}

// Response types
interface LoginSuccessResponse {
  user: User;
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

  if (password.length < 1) {
    return 'Password cannot be empty';
  }

  return null;
}

// Main handler
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    let body: LoginRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        },
        { status: 400 }
      );
    }

    // Validate required fields
    const { phone_number, password } = body;

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

    // Normalize phone number to E.164 format
    const normalizedPhone = parsePhoneNumber(phone_number);

    // Create Supabase client
    const supabase = await createClient();

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      phone: normalizedPhone,
      password: password,
    });

    if (authError) {
      console.error('Auth login error:', authError);
      
      // Handle specific auth errors
      if (authError.message.includes('Invalid login credentials') || 
          authError.message.includes('invalid') ||
          authError.message.includes('incorrect')) {
        return NextResponse.json<ErrorResponse>(
          { 
            error: 'Invalid credentials',
            details: 'Phone number or password is incorrect',
            code: 'INVALID_CREDENTIALS'
          },
          { status: 401 }
        );
      }

      if (authError.message.includes('not found') || 
          authError.message.includes('does not exist')) {
        return NextResponse.json<ErrorResponse>(
          { 
            error: 'User not found',
            details: 'No account found with this phone number',
            code: 'USER_NOT_FOUND'
          },
          { status: 404 }
        );
      }

      if (authError.message.includes('email not confirmed')) {
        return NextResponse.json<ErrorResponse>(
          { 
            error: 'Account not verified',
            details: 'Please verify your account before logging in',
            code: 'EMAIL_NOT_CONFIRMED'
          },
          { status: 401 }
        );
      }

      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Authentication failed',
          details: 'Please try again later',
          code: 'AUTH_ERROR'
        },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Authentication failed',
          details: 'No user data returned',
          code: 'NO_USER_DATA'
        },
        { status: 500 }
      );
    }

    if (!authData.session) {
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Authentication failed',
          details: 'No session created',
          code: 'NO_SESSION'
        },
        { status: 500 }
      );
    }

    // Fetch user profile from users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      
      // Handle specific profile errors
      if (profileError.code === 'PGRST116') {
        // User exists in auth but not in users table
        return NextResponse.json<ErrorResponse>(
          { 
            error: 'User profile not found',
            details: 'Account exists but profile is incomplete. Please contact support.',
            code: 'PROFILE_NOT_FOUND'
          },
          { status: 404 }
        );
      }

      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Failed to fetch user profile',
          details: 'Please try again later',
          code: 'PROFILE_FETCH_ERROR'
        },
        { status: 500 }
      );
    }

    if (!userProfile) {
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'User profile not found',
          details: 'No profile found for this user',
          code: 'PROFILE_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Verify the phone number matches (security check)
    if (userProfile.phone_number !== normalizedPhone) {
      console.error('Phone number mismatch:', {
        authPhone: normalizedPhone,
        profilePhone: userProfile.phone_number,
        userId: authData.user.id
      });
      
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Account mismatch',
          details: 'Phone number does not match user profile',
          code: 'PHONE_MISMATCH'
        },
        { status: 500 }
      );
    }

    // Prepare success response
    const response: LoginSuccessResponse = {
      user: {
        id: userProfile.id,
        phone_number: userProfile.phone_number,
        email: userProfile.email,
        name: userProfile.name,
        activity_preferences: userProfile.activity_preferences,
        pace_range_min: userProfile.pace_range_min,
        pace_range_max: userProfile.pace_range_max,
        home_location_coords: userProfile.home_location_coords,
        home_location_name: userProfile.home_location_name,
        created_at: userProfile.created_at,
        updated_at: userProfile.updated_at,
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_in: authData.session.expires_in,
        expires_at: authData.session.expires_at,
        token_type: authData.session.token_type,
        user: {
          id: authData.user.id,
          phone: authData.user.phone,
          email: authData.user.email,
        },
      },
    };

    return NextResponse.json(response, { status: 200 });

    } catch (err) {
      console.error('Unexpected error in login route:', err);
    
    return NextResponse.json<ErrorResponse>(
      { 
        error: 'Internal server error',
        details: 'An unexpected error occurred',
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
