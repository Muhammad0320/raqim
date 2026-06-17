import { createClient } from './server'
import { cache } from 'react'

export const getCachedUserTenantContext = cache(async () => {
  const supabase = await createClient()
  
  // Mocking the active session by taking the first org for demonstration
  const { data: orgs } = await supabase.from('organizations').select('*').limit(1)
  const org = orgs?.[0]
  
  if (!org) {
    return { alias: "JPM_CHASE_PROD", planTier: "ENTERPRISE", licenseKey: "eyJhb..." } // Default mock if DB is empty
  }

  const { data: sub } = await (supabase
    .from('subscriptions' as any)
    .select('plan_tier')
    .eq('org_id', org.id)
    .single() as any)

  const { data: license } = await supabase
    .from('licenses')
    .select('jwt_hash')
    .eq('org_id', org.id)
    .eq('revoked', false)
    .single()

  return {
    alias: org.alias,
    planTier: sub?.plan_tier || 'OPEN_CORE',
    licenseKey: license?.jwt_hash || 'eyJhb...'
  }
})


// Utility functions for easy DB access from Server Components or Server Actions

export async function getUserProfile(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
  return data
}

export async function getOrganizationDetails(orgId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single()
  
  if (error) {
    console.error('Error fetching organization:', error)
    return null
  }
  return data
}

export async function getOrganizationMembers(orgId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organization_members')
    .select('*, profiles(*)')
    .eq('org_id', orgId)
  
  if (error) {
    console.error('Error fetching organization members:', error)
    return null
  }
  return data
}

export async function getLicenseDetails(orgId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('org_id', orgId)
    .eq('revoked', false)
    .single()
  
  if (error) {
    console.error('Error fetching active license:', error)
    return null
  }
  return data
}

export async function getTelemetry(orgId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('telemetry')
    .select('*')
    .eq('org_id', orgId)
    .single()
  
  if (error) {
    console.error('Error fetching telemetry:', error)
    return null
  }
  return data
}

export async function getSubscriptionDetails(orgId: string) {
  const supabase = await createClient()
  const { data, error } = await (supabase
    .from('subscriptions' as any)
    .select('*')
    .eq('org_id', orgId)
    .single() as any)
  
  if (error) {
    console.error('Error fetching subscription details:', error)
    return null
  }
  return data
}
