import { createClient } from './server'

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

export async function updatePlanTier(licenseId: string, newTier: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('licenses')
    .update({ plan_tier: newTier })
    .eq('id', licenseId)
    .select()
    .single()

  if (error) {
    console.error('Error updating plan tier:', error)
    return null
  }
  return data
}
