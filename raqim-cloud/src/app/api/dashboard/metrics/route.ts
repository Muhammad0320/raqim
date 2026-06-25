import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const requestedOrgId = searchParams.get('orgId');

  if (!requestedOrgId) {
    return NextResponse.json({ error: 'Missing parameter: orgId' }, { status: 400 });
  }

  // Enforce true cryptographic user context resolution
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthenticated execution context' }, { status: 401 });
  }

  // Cross-reference user authorization against the target organization membership record
  const { data: membership, error: rbacError } = await supabase
    .from('organization_members')
    .select('role')
    .eq('org_id', requestedOrgId)
    .eq('user_id', user.id)
    .single();

  if (rbacError || !membership) {
    return NextResponse.json({ error: 'Access Denied: Tenant Isolation Violation' }, { status: 403 });
  }

  // Fetch real telemetry daily rollups from the database view
  const { data: metrics, error: dbError } = await supabase
    .from('telemetry_daily_rollups')
    .select('*')
    .eq('org_id', requestedOrgId)
    .order('day', { ascending: true });

  if (dbError) {
    return NextResponse.json({ error: 'Database execution failure' }, { status: 500 });
  }

  return NextResponse.json({ metrics }, { status: 200 });
}
