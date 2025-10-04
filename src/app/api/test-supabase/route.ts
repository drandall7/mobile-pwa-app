import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('Testing Supabase connection...');
    
    const supabase = await createClient();
    console.log('Supabase client created');

    // Test basic connection by getting the current user (should be null for unauthenticated)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User check result:', { user, userError });

    // Test database connection
    const { data: dbData, error: dbError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    console.log('Database check result:', { dbData, dbError });

    return NextResponse.json({ 
      success: true,
      message: 'Supabase connection successful',
      user_check: { user: !!user, error: userError?.message },
      database_check: { data: !!dbData, error: dbError?.message }
    });

  } catch (err) {
    console.error('Supabase test error:', err);
    return NextResponse.json({ 
      error: 'Supabase test failed',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
