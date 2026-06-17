"use server";

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import * as jose from 'jose';

export async function regenerateLicense(orgId: string) {
  if (!orgId) throw new Error("Organization ID is required");

  const supabase = await createClient();

  // 1. Validate subscription tier
  const { data: sub, error: subError } = await (supabase
    .from('subscriptions' as any)
    .select('plan_tier')
    .eq('org_id', orgId)
    .single() as any);

  if (subError || !sub) {
    throw new Error('Subscription not found');
  }

  if (sub.plan_tier === 'OPEN_CORE') {
    throw new Error('Cannot generate licenses on OPEN_CORE plan');
  }

  // 2. Mint cryptographic RSA JWT
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_for_development_only');
  const jwt = await new jose.SignJWT({ orgId, plan: sub.plan_tier })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('urn:raqim:issuer')
    .setAudience('urn:raqim:daemon')
    .setExpirationTime('7d')
    .sign(secret);

  // 3. Revoke active licenses
  await supabase
    .from('licenses')
    .update({ revoked: true })
    .eq('org_id', orgId)
    .eq('revoked', false);

  // 4. Insert new license
  const { error: insertError } = await supabase
    .from('licenses')
    .insert({
      org_id: orgId,
      jwt_hash: jwt,
      revoked: false,
    });

  if (insertError) {
    throw new Error('Failed to save new license');
  }

  revalidatePath('/dashboard');
}
