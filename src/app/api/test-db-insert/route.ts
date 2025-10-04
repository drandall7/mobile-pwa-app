import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Test direct database insert without auth
    const testUser = {
      id: '00000000-0000-0000-0000-000000000001',
      phone_number: '+19999999998',
      email: 'test@example.com',
      name: 'Test User',
      activity_preferences: [],
      pace_range_min: null,
      pace_range_max: null,
      home_location_coords: null,
      home_location_name: null,
    };

    console.log('Testing direct database insert...');

    const { data, error } = await supabase
      .from('users')
      .insert(testUser)
      .select();

    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json({ 
        success: false,
        error: 'Database insert failed',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    // Clean up the test user
    await supabase
      .from('users')
      .delete()
      .eq('id', testUser.id);

    return NextResponse.json({ 
      success: true,
      message: 'Database insert works',
      user_created: !!data
    });

  } catch (err) {
    console.error('Database insert test error:', err);
    return NextResponse.json({ 
      error: 'Database insert test failed',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
