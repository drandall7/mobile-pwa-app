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

    // For now, we'll do a simple password check
    // In a real app, you'd hash the password and compare hashes
    // For this demo, we'll store the password in the database (not recommended for production)
    
    // Check if user has a password stored (for demo purposes)
    // In production, you'd use proper password hashing
    const storedPassword = (user as { password_hash?: string; password?: string }).password_hash || (user as { password_hash?: string; password?: string }).password;
    
    if (!storedPassword) {
      // User was created via direct registration, set a default password
      // In production, you'd handle this differently
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          phone_number: user.phone_number,
          email: user.email,
          name: user.name,
        },
        message: 'Login successful (first time login - password not set yet)'
      });
    }

    // Simple password comparison (for demo - use proper hashing in production)
    if (password !== storedPassword) {
      return NextResponse.json(
        { error: 'Invalid phone number or password' },
        { status: 401 }
      );
    }

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
