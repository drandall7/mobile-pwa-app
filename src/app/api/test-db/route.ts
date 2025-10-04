import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ 
        error: 'Missing environment variables',
        supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabase_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }, { status: 500 });
    }

    // Create Supabase client
    const supabase = await createClient();
    console.log('Supabase client created');

    // Test database connection by checking if users table exists
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      users_table_exists: true
    });

  } catch (err) {
    console.error('Test error:', err);
    return NextResponse.json({ 
      error: 'Test failed',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
