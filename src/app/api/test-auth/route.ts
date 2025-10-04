import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Test Supabase Auth with a test phone number
    const testPhone = '+19999999998';
    const testPassword = 'TestPassword123';

    console.log('Testing Supabase Auth signup...');

    const { data, error } = await supabase.auth.signUp({
      phone: testPhone,
      password: testPassword,
      options: {
        data: {
          name: 'Test User',
          phone_number: testPhone,
        },
      },
    });

    if (error) {
      console.error('Auth test error:', error);
      return NextResponse.json({ 
        success: false,
        error: 'Auth signup failed',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    // Clean up the test user
    if (data.user) {
      await supabase.auth.admin.deleteUser(data.user.id);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Supabase Auth is working',
      user_created: !!data.user
    });

  } catch (err) {
    console.error('Auth test error:', err);
    return NextResponse.json({ 
      error: 'Auth test failed',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
