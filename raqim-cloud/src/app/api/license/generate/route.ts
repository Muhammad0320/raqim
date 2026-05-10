import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import * as jose from 'jose';

export async function POST(request: Request) {
  try {
    const { orgId } = await request.json();
    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Validate the organization and subscription tier
    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .select('plan_tier')
      .eq('org_id', orgId)
      .single();

    if (subError || !sub) {
      return NextResponse.json({ error: 'Subscription not found for this organization' }, { status: 404 });
    }

    if (sub.plan_tier === 'OPEN_CORE') {
      return NextResponse.json({ error: 'Licenses cannot be generated on the OPEN_CORE plan' }, { status: 403 });
    }

    // 2. Generate a new JWT (Mocking the cryptographic payload for now, but using real jose package)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_for_development_only');
    const jwt = await new jose.SignJWT({ orgId, plan: sub.plan_tier })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('urn:raqim:issuer')
      .setAudience('urn:raqim:daemon')
      .setExpirationTime('7d')
      .sign(secret);

    // 3. Revoke old licenses
    await supabase
      .from('licenses')
      .update({ revoked: true })
      .eq('org_id', orgId)
      .eq('revoked', false);

    // 4. Store the new license
    const { data: newLicense, error: insertError } = await supabase
      .from('licenses')
      .insert({
        org_id: orgId,
        jwt_hash: jwt,
        revoked: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('License insertion error:', insertError);
      return NextResponse.json({ error: 'Failed to save new license' }, { status: 500 });
    }

    return NextResponse.json(newLicense);
  } catch (error: any) {
    console.error('Generate license error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}