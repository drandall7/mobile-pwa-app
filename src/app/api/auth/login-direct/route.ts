import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  isValidPhoneNumber, 
  parsePhoneNumber
} from '@/types/database';

// Direct login that works with database-only users
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('=== DIRECT LOGIN API ROUTE CALLED ===');
    
    const body = await request.json();
    const { phone_number, password } = body;

    // Validate inputs
    if (!phone_number || !password) {
      return NextResponse.json(
        { error: 'Phone number and password are required' },
        { status: 400 }
      );
    }

    const normalizedPhone = parsePhoneNumber(phone_number);
    
    if (!isValidPhoneNumber(normalizedPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find user in database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', normalizedPhone)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid phone number or password' },
        { status: 401 }
      );
    }

    // For demo purposes, we'll accept any password for existing users
    // In production, you'd implement proper password hashing and verification
    // For now, if the user exists in the database, we'll let them login

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone_number: user.phone_number,
        email: user.email,
        name: user.name,
      },
      message: 'Login successful'
    });

  } catch (err) {
    console.error('Direct login error:', err);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
