import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Response types
interface LogoutSuccessResponse {
  message: string;
  success: boolean;
}

interface ErrorResponse {
  error: string;
  details?: string;
  code?: string;
}

// Main handler
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Create Supabase client
    const supabase = await createClient();

    // Sign out the current user
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Failed to logout',
          details: 'Unable to sign out user',
          code: 'LOGOUT_ERROR'
        },
        { status: 500 }
      );
    }

    // Prepare success response
    const response: LogoutSuccessResponse = {
      message: 'Successfully logged out',
      success: true,
    };

    // Create response and clear any auth cookies
    const nextResponse = NextResponse.json(response, { status: 200 });
    
    // Clear any potential auth cookies (optional, as Supabase handles this)
    nextResponse.cookies.set('sb-access-token', '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    
    nextResponse.cookies.set('sb-refresh-token', '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return nextResponse;

  } catch (error) {
    console.error('Unexpected error in logout route:', error);
    
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
