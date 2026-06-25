"use server";

import { createClient } from '@/lib/supabase/server';
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

export async function revokeAndDestroyAllKeys(orgId: string) {
  if (!orgId) throw new Error("Organization ID is required");

  const supabase = await createClient();

  // 1. Revoke all licenses for the organization
  const { error: licError } = await supabase
    .from('licenses')
    .update({ revoked: true })
    .eq('org_id', orgId);

  if (licError) {
    throw new Error('Failed to revoke active organization licenses');
  }

  // 2. Drop subscription tier to OPEN_CORE
  const { error: subError } = await (supabase
    .from('subscriptions' as any)
    .update({ plan_tier: 'OPEN_CORE' })
    .eq('org_id', orgId) as any);

  if (subError) {
    // Fallback to potential typo tables
    const { error: fallbackSubError } = await (supabase
      .from('subsciptions' as any)
      .update({ plan_tier: 'OPEN_CORE' })
      .eq('org_id', orgId) as any);
      
    if (fallbackSubError) {
      throw new Error('Failed to downgrade subscription plan');
    }
  }

  revalidatePath('/dashboard');
}

export async function updateOrganizationFootprint(orgId: string, name: string, alias: string, billingEmail: string) {
  if (!orgId) throw new Error("Organization ID is required");

  const supabase = await createClient();
  const sso_domain = billingEmail.includes('@') ? billingEmail.split('@')[1] : billingEmail;

  const { error } = await supabase
    .from('organizations')
    .update({
      display_name: name.trim(),
      alias: alias.trim().toUpperCase().replace(/\s+/g, "_"),
      sso_domain: sso_domain.trim()
    })
    .eq('id', orgId);

  if (error) {
    throw new Error(error.message || 'Failed to update organization footprint');
  }

  revalidatePath('/dashboard');
}

export async function executeEmergencyRevocation(orgId: string) {
  return revokeAndDestroyAllKeys(orgId);
}
