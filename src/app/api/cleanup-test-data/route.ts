import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();

    // Delete test users
    const { error } = await supabase
      .from('users')
      .delete()
      .like('phone_number', '+1804895097%'); // Delete test phone numbers

    if (error) {
      console.error('Cleanup error:', error);
      return NextResponse.json({ 
        success: false,
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Test data cleaned up' 
    });

  } catch (err) {
    console.error('Cleanup error:', err);
    return NextResponse.json({ 
      error: 'Cleanup failed',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
