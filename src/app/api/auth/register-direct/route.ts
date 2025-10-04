import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  isValidPhoneNumber, 
  parsePhoneNumber
} from '@/types/database';

// Temporary direct registration that bypasses Supabase Auth
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('=== DIRECT REGISTER API ROUTE CALLED ===');
    
    const body = await request.json();
    const { phone_number, password, name, email } = body;

    // Validate inputs
    if (!phone_number || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const normalizedPhone = parsePhoneNumber(phone_number);
    
    if (!isValidPhoneNumber(normalizedPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone_number', normalizedPhone)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 409 }
      );
    }

    // Create user profile directly (bypassing Supabase Auth for now)
    const userProfile: Record<string, unknown> = {
      id: crypto.randomUUID(), // Generate a UUID
      phone_number: normalizedPhone,
      email: email?.trim() || null,
      name: name.trim(),
      activity_preferences: [],
      pace_range_min: null,
      pace_range_max: null,
      home_location_coords: null,
      home_location_name: null,
      password_hash: password, // Store password for demo (use proper hashing in production)
    };

    const { error: profileError } = await supabase
      .from('users')
      .insert(userProfile)
      .select();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userProfile.id,
        phone_number: normalizedPhone,
        email: userProfile.email,
        name: userProfile.name,
      },
      message: 'User created successfully (bypassing auth)'
    });

  } catch (err) {
    console.error('Direct registration error:', err);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
