import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize the Admin factory client securely on the server side
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  
  // Enforce cron secret verification to prevent unauthenticated internet triggers
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized cron signature' }, { status: 401 });
  }

  try {
    // Correct the historical typo: query organization_members with accurate spelling
    const { data: pastDueAccounts, error: queryError } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        id,
        org_id,
        plan_tier,
        status,
        organizations (
          name,
          organization_members (
            profiles (email)
          )
        )
      `)
      .eq('status', 'past_due');

    if (queryError) throw queryError;

    // Trigger notification loops here via Resend...
    return NextResponse.json({ processed: pastDueAccounts?.length || 0 }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
