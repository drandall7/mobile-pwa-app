import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { type User } from '@/types/database';

// Response types
interface ProfileSuccessResponse {
  user: User;
}

interface ErrorResponse {
  error: string;
  details?: string;
  code?: string;
}

// GET method - Fetch user profile
export async function GET(): Promise<NextResponse> {
  try {
    // Create Supabase client
    const supabase = await createClient();

    // Get the current user from session
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Authentication failed',
          details: 'Unable to verify user session',
          code: 'AUTH_ERROR'
        },
        { status: 401 }
      );
    }

    if (!authUser) {
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Not authenticated',
          details: 'Please log in to access your profile',
          code: 'NOT_AUTHENTICATED'
        },
        { status: 401 }
      );
    }

    // Fetch user profile from users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      
      // Handle specific profile errors
      if (profileError.code === 'PGRST116') {
        // User exists in auth but not in users table
        return NextResponse.json<ErrorResponse>(
          { 
            error: 'Profile not found',
            details: 'User profile does not exist. Please contact support.',
            code: 'PROFILE_NOT_FOUND'
          },
          { status: 404 }
        );
      }

      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Failed to fetch profile',
          details: 'Unable to retrieve user profile',
          code: 'PROFILE_FETCH_ERROR'
        },
        { status: 500 }
      );
    }

    if (!userProfile) {
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Profile not found',
          details: 'No profile found for this user',
          code: 'PROFILE_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Verify the auth user ID matches the profile ID (security check)
    if (userProfile.id !== authUser.id) {
      console.error('User ID mismatch:', {
        authUserId: authUser.id,
        profileUserId: userProfile.id
      });
      
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Profile mismatch',
          details: 'Profile does not match authenticated user',
          code: 'PROFILE_MISMATCH'
        },
        { status: 500 }
      );
    }

    // Prepare success response
    const response: ProfileSuccessResponse = {
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
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in profile route:', error);
    
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
export async function POST(): Promise<NextResponse> {
  return NextResponse.json<ErrorResponse>(
    { 
      error: 'Method not allowed',
      details: 'This endpoint only supports GET requests',
      code: 'METHOD_NOT_ALLOWED'
    },
    { status: 405 }
  );
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json<ErrorResponse>(
    { 
      error: 'Method not allowed',
      details: 'This endpoint only supports GET requests',
      code: 'METHOD_NOT_ALLOWED'
    },
    { status: 405 }
  );
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json<ErrorResponse>(
    { 
      error: 'Method not allowed',
      details: 'This endpoint only supports GET requests',
      code: 'METHOD_NOT_ALLOWED'
    },
    { status: 405 }
  );
}
