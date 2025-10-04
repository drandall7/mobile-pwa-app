import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();

    // Delete the specific test user we created
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('phone_number', '+18048950976');

    if (error) {
      console.error('Cleanup error:', error);
      return NextResponse.json({ 
        success: false,
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Test user cleared successfully' 
    });

  } catch (err) {
    console.error('Cleanup error:', err);
    return NextResponse.json({ 
      error: 'Cleanup failed',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
