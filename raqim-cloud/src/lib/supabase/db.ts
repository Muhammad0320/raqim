import { createClient } from './server'
import { cache } from 'react'
import { cookies } from 'next/headers'

export const getCachedUserTenantContext = cache(async () => {
  const isDevelopmentBypassActive = () => {
    return process.env.NODE_ENV === 'development' && process.env.DEV_MODE_BYPASS === 'true';
  };

  if (isDevelopmentBypassActive()) {
    return { 
      alias: "DEV_TENANT_LOCAL", 
      planTier: "ENTERPRISE", 
      licenseKey: "DEV_BYPASS_KEY",
      isAuthenticated: true 
    };
  }

  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { 
        alias: "YOUR_TENANT_ALIAS", 
        planTier: "OPEN_CORE", 
        licenseKey: "YOUR_RSA_LICENSE_KEY",
        isAuthenticated: false 
      }
    }

    // Fetch user organizations through organization_members table
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('org_id, organizations(*)')
      .eq('user_id', user.id)

    if (memberError || !memberData || memberData.length === 0) {
      return { 
        alias: "YOUR_TENANT_ALIAS", 
        planTier: "OPEN_CORE", 
        licenseKey: "YOUR_RSA_LICENSE_KEY",
        isAuthenticated: false 
      }
    }

    // Safely extract organizations
    const userOrgs = memberData
      .map((item) => {
        const org = Array.isArray(item.organizations) ? item.organizations[0] : item.organizations
        return org
      })
      .filter((org): org is NonNullable<typeof org> => !!org)

    if (userOrgs.length === 0) {
      return { 
        alias: "YOUR_TENANT_ALIAS", 
        planTier: "OPEN_CORE", 
        licenseKey: "YOUR_RSA_LICENSE_KEY",
        isAuthenticated: false 
      }
    }

    // Resolve the active organization context from cookie
    const cookieStore = await cookies()
    const activeOrgId = cookieStore.get('active-org-id')?.value
    let activeOrg = userOrgs.find((org) => org.id === activeOrgId) || userOrgs[0]

    // Fetch subscription
    const { data: sub } = await (supabase
      .from('subscriptions' as any)
      .select('plan_tier')
      .eq('org_id', activeOrg.id)
      .single() as any)

    // Fetch active license
    const { data: license } = await supabase
      .from('licenses')
      .select('jwt_hash')
      .eq('org_id', activeOrg.id)
      .eq('revoked', false)
      .single()

    return {
      alias: activeOrg.alias,
      planTier: sub?.plan_tier || 'OPEN_CORE',
      licenseKey: license?.jwt_hash || 'YOUR_RSA_LICENSE_KEY',
      isAuthenticated: true
    }
  } catch (error) {
    console.error('Error fetching cached user tenant context:', error)
    return {
      alias: "YOUR_TENANT_ALIAS",
      planTier: "OPEN_CORE",
      licenseKey: "YOUR_RSA_LICENSE_KEY",
      isAuthenticated: false
    }
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
