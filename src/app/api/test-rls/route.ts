import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Test inserting a user profile to see if RLS is blocking it
    const testUser = {
      id: '00000000-0000-0000-0000-000000000000', // Test UUID
      phone_number: '+19999999999',
      name: 'Test User',
      activity_preferences: [],
    };

    console.log('Testing RLS with test user:', testUser);

    const { data, error } = await supabase
      .from('users')
      .insert(testUser)
      .select();

    if (error) {
      console.error('RLS test error:', error);
      return NextResponse.json({ 
        success: false,
        error: 'RLS blocked insert',
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 });
    }

    // Clean up the test user
    await supabase
      .from('users')
      .delete()
      .eq('id', testUser.id);

    return NextResponse.json({ 
      success: true,
      message: 'RLS allows inserts',
      test_user_created: !!data
    });

  } catch (err) {
    console.error('RLS test error:', err);
    return NextResponse.json({ 
      error: 'RLS test failed',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
