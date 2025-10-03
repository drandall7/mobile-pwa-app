import { NextRequest, NextResponse } from 'next/server';
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
// PATCH method - Update user profile
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    let body: {
      name?: string;
      email?: string | null;
      activity_preferences?: string[];
      pace_range_min?: number | null;
      pace_range_max?: number | null;
    };
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
          details: 'Please log in to update your profile',
          code: 'NOT_AUTHENTICATED'
        },
        { status: 401 }
      );
    }

    // Validate and prepare update data
    const updateData: {
      name?: string;
      email?: string | null;
      activity_preferences?: string[];
      pace_range_min?: number | null;
      pace_range_max?: number | null;
    } = {};

    if (body.name !== undefined) {
      if (typeof body.name === 'string' && body.name.trim().length > 0) {
        updateData.name = body.name.trim();
      } else {
        return NextResponse.json<ErrorResponse>(
          { 
            error: 'Invalid name',
            details: 'Name must be a non-empty string',
            code: 'INVALID_NAME'
          },
          { status: 400 }
        );
      }
    }

    if (body.email !== undefined) {
      if (body.email === null || body.email === '') {
        updateData.email = null;
      } else if (typeof body.email === 'string') {
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (emailRegex.test(body.email.trim())) {
          updateData.email = body.email.trim();
        } else {
          return NextResponse.json<ErrorResponse>(
            { 
              error: 'Invalid email',
              details: 'Please provide a valid email address',
              code: 'INVALID_EMAIL'
            },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json<ErrorResponse>(
          { 
            error: 'Invalid email',
            details: 'Email must be a string or null',
            code: 'INVALID_EMAIL'
          },
          { status: 400 }
        );
      }
    }

    if (body.activity_preferences !== undefined) {
      if (Array.isArray(body.activity_preferences)) {
        updateData.activity_preferences = body.activity_preferences;
      } else {
        return NextResponse.json<ErrorResponse>(
          { 
            error: 'Invalid activity preferences',
            details: 'Activity preferences must be an array',
            code: 'INVALID_ACTIVITIES'
          },
          { status: 400 }
        );
      }
    }

    if (body.pace_range_min !== undefined) {
      if (body.pace_range_min === null || (typeof body.pace_range_min === 'number' && body.pace_range_min > 0)) {
        updateData.pace_range_min = body.pace_range_min;
      } else {
        return NextResponse.json<ErrorResponse>(
          { 
            error: 'Invalid pace range',
            details: 'Pace range must be a positive number or null',
            code: 'INVALID_PACE'
          },
          { status: 400 }
        );
      }
    }

    if (body.pace_range_max !== undefined) {
      if (body.pace_range_max === null || (typeof body.pace_range_max === 'number' && body.pace_range_max > 0)) {
        updateData.pace_range_max = body.pace_range_max;
      } else {
        return NextResponse.json<ErrorResponse>(
          { 
            error: 'Invalid pace range',
            details: 'Pace range must be a positive number or null',
            code: 'INVALID_PACE'
          },
          { status: 400 }
        );
      }
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'No updates provided',
          details: 'Please provide at least one field to update',
          code: 'NO_UPDATES'
        },
        { status: 400 }
      );
    }

    // Update user profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', authUser.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Failed to update profile',
          details: 'Unable to update user profile',
          code: 'UPDATE_ERROR'
        },
        { status: 500 }
      );
    }

    if (!updatedProfile) {
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Profile not found',
          details: 'User profile does not exist',
          code: 'PROFILE_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Return updated profile
    const response: ProfileSuccessResponse = {
      user: {
        id: updatedProfile.id,
        phone_number: updatedProfile.phone_number,
        email: updatedProfile.email,
        name: updatedProfile.name,
        activity_preferences: updatedProfile.activity_preferences,
        pace_range_min: updatedProfile.pace_range_min,
        pace_range_max: updatedProfile.pace_range_max,
        home_location_coords: updatedProfile.home_location_coords,
        home_location_name: updatedProfile.home_location_name,
        created_at: updatedProfile.created_at,
        updated_at: updatedProfile.updated_at,
      },
    };

    return NextResponse.json(response, { status: 200 });

  } catch (err) {
    console.error('Unexpected error in profile PATCH route:', err);
    
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

export async function POST(): Promise<NextResponse> {
  return NextResponse.json<ErrorResponse>(
    { 
      error: 'Method not allowed',
      details: 'This endpoint supports GET and PATCH requests',
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
