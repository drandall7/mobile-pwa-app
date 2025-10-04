import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Test Supabase Auth with email instead of phone
    const testEmail = 'test@example.com';
    const testPassword = 'TestPassword123';

    console.log('Testing Supabase Auth signup with email...');

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test User',
        },
      },
    });

    if (error) {
      console.error('Email auth test error:', error);
      return NextResponse.json({ 
        success: false,
        error: 'Email auth signup failed',
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
      message: 'Email auth is working',
      user_created: !!data.user
    });

  } catch (err) {
    console.error('Email auth test error:', err);
    return NextResponse.json({ 
      error: 'Email auth test failed',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
