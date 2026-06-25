import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jsonwebtoken from 'jsonwebtoken';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing token signature' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const RAQIM_PUBLIC_KEY = process.env.RAQIM_RSA_PUBLIC_KEY!.replace(/\\n/g, '\n');

  try {
    // 1. Decode and verify the incoming daemon identity token
    const decoded = jsonwebtoken.verify(token, RAQIM_PUBLIC_KEY, { algorithms: ['RS256'] }) as any;
    const tenantAlias = decoded.sub; // This is the string alias (e.g., 'DEV_TENANT_LOCAL')

    // 2. Fetch the true organizational record to resolve the String-to-UUID gap
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('alias', tenantAlias)
      .single();

    if (orgError || !org) {
      return NextResponse.json({ error: 'Target organization registry unmapped' }, { status: 404 });
    }

    // 3. Query the corrected subscriptions table using the validated UUID
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('status, plan_tier')
      .eq('org_id', org.id)
      .single();

    if (subError || !subscription || subscription.status !== 'active') {
      return NextResponse.json({ error: 'Valid subscription matrix required', status: 402 }, { status: 402 });
    }

    // 4. Generate the 24-hour rolling license update token
    const RSA_PRIVATE_KEY = process.env.RSA_PRIVATE_KEY!.replace(/\\n/g, '\n');
    const newLicenseJwt = jsonwebtoken.sign(
      {
        sub: tenantAlias,
        features: decoded.features,
        exp: Math.floor(Date.now() / 1000) + 86400,
      },
      RSA_PRIVATE_KEY,
      { algorithm: 'RS256' }
    );

    return NextResponse.json({ new_license: newLicenseJwt }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Cryptographic signature verification failed' }, { status: 401 });
  }
}
