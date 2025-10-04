import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Request body type
interface LocationUpdateRequest {
  latitude: number;
  longitude: number;
  locationName: string;
}

// Response types
interface LocationSuccessResponse {
  success: boolean;
  message: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
  code?: string;
}

// PATCH method - Update user location
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    let body: LocationUpdateRequest;
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

    // Validate required fields
    const { latitude, longitude, locationName } = body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Invalid coordinates',
          details: 'Latitude and longitude must be numbers',
          code: 'INVALID_COORDINATES'
        },
        { status: 400 }
      );
    }

    if (!locationName || typeof locationName !== 'string') {
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Invalid location name',
          details: 'Location name is required',
          code: 'INVALID_LOCATION_NAME'
        },
        { status: 400 }
      );
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Invalid latitude',
          details: 'Latitude must be between -90 and 90',
          code: 'INVALID_LATITUDE'
        },
        { status: 400 }
      );
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Invalid longitude',
          details: 'Longitude must be between -180 and 180',
          code: 'INVALID_LONGITUDE'
        },
        { status: 400 }
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
          details: 'Please log in to update your location',
          code: 'NOT_AUTHENTICATED'
        },
        { status: 401 }
      );
    }

    // Create PostGIS geography point
    const geoPoint = `POINT(${longitude} ${latitude})`;

    // Update user location
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update({
        home_location_coords: supabase.rpc('ST_GeogFromText', { wkt: geoPoint }),
        home_location_name: locationName.trim(),
      })
      .eq('id', authUser.id)
      .select('id, home_location_coords, home_location_name')
      .single();

    if (updateError) {
      console.error('Location update error:', updateError);
      
      // Try alternative approach if PostGIS function fails
      try {
        const { error: altUpdateError } = await supabase
          .from('users')
          .update({
            home_location_name: locationName.trim(),
          })
          .eq('id', authUser.id)
          .select('id, home_location_name')
          .single();

        if (altUpdateError) {
          throw altUpdateError;
        }

        const response: LocationSuccessResponse = {
          success: true,
          message: 'Location name updated successfully (coordinates not saved)',
        };

        return NextResponse.json(response, { status: 200 });
      } catch {
        return NextResponse.json<ErrorResponse>(
          { 
            error: 'Failed to update location',
            details: 'Unable to save location information',
            code: 'UPDATE_ERROR'
          },
          { status: 500 }
        );
      }
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

    // Return success response
    const response: LocationSuccessResponse = {
      success: true,
      message: 'Location updated successfully',
    };

    return NextResponse.json(response, { status: 200 });

  } catch (err) {
    console.error('Unexpected error in location PATCH route:', err);
    
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
      details: 'This endpoint only supports PATCH requests',
      code: 'METHOD_NOT_ALLOWED'
    },
    { status: 405 }
  );
}

export async function POST(): Promise<NextResponse> {
  return NextResponse.json<ErrorResponse>(
    { 
      error: 'Method not allowed',
      details: 'This endpoint only supports PATCH requests',
      code: 'METHOD_NOT_ALLOWED'
    },
    { status: 405 }
  );
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json<ErrorResponse>(
    { 
      error: 'Method not allowed',
      details: 'This endpoint only supports PATCH requests',
      code: 'METHOD_NOT_ALLOWED'
    },
    { status: 405 }
  );
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json<ErrorResponse>(
    { 
      error: 'Method not allowed',
      details: 'This endpoint only supports PATCH requests',
      code: 'METHOD_NOT_ALLOWED'
    },
    { status: 405 }
  );
}
