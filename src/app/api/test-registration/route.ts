import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Test registration with email instead of phone
    const testEmail = 'testuser@example.com';
    const testPassword = 'TestPassword123';
    const testName = 'Test User';

    console.log('Testing registration with email...');

    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: testName,
          email: testEmail,
        },
      },
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return NextResponse.json({ 
        success: false,
        error: 'Auth signup failed',
        details: authError.message,
        code: authError.code
      }, { status: 500 });
    }

    if (!authData.user) {
      return NextResponse.json({ 
        success: false,
        error: 'No user created'
      }, { status: 500 });
    }

    // Step 2: Create user profile in database
    const userProfile = {
      id: authData.user.id,
      phone_number: '+19999999999', // Dummy phone for test
      email: testEmail,
      name: testName,
      activity_preferences: [],
      pace_range_min: null,
      pace_range_max: null,
      home_location_coords: null,
      home_location_name: null,
    };

    const { data: insertData, error: profileError } = await supabase
      .from('users')
      .insert(userProfile)
      .select();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Clean up auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json({ 
        success: false,
        error: 'Profile creation failed',
        details: profileError.message
      }, { status: 500 });
    }

    // Clean up test data
    await supabase.auth.admin.deleteUser(authData.user.id);
    await supabase
      .from('users')
      .delete()
      .eq('id', authData.user.id);

    return NextResponse.json({ 
      success: true,
      message: 'Registration flow works with email',
      auth_user_created: !!authData.user,
      profile_created: !!insertData
    });

  } catch (err) {
    console.error('Registration test error:', err);
    return NextResponse.json({ 
      error: 'Registration test failed',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
