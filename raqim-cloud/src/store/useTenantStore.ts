import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Organization = Database['public']['Tables']['organizations']['Row'] & {
  plan_tier?: string;
};

interface TenantState {
  profile: Profile | null;
  organizations: Organization[];
  activeOrganizationId: string | null;
  isLoading: boolean;
  error: string | null;
  
  setActiveOrganization: (id: string) => void;
  fetchTenantData: () => Promise<void>;
  clearTenantData: () => void;
}

// Client-side helper functions for cookie management
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

export const useTenantStore = create<TenantState>((set, get) => ({
  profile: null,
  organizations: [],
  activeOrganizationId: null,
  isLoading: false,
  error: null,

  setActiveOrganization: (id: string) => {
    set({ activeOrganizationId: id });
    setCookie('active-org-id', id);
  },

  fetchTenantData: async () => {
    set({ isLoading: true, error: null });
    try {
      // Check if local dev auth bypass is active
      const isDevBypass = typeof document !== 'undefined' && document.cookie.includes('dev-mode-bypass-active=true');

      if (isDevBypass) {
        const mockUserId = 'd0000000-0000-0000-0000-000000000000';
        
        // Retrieve or set mock active org
        const activeOrgId = getCookie('active-org-id') || 'e0000000-0000-0000-0000-000000000000';

        const mockProfile: Profile = {
          id: mockUserId,
          full_name: 'Muhammad (Dev Bypass)',
          avatar_url: 'https://github.com/shadcn.png',
          updated_at: new Date().toISOString(),
        };

        const mockOrganizations: Organization[] = [
          {
            id: 'e0000000-0000-0000-0000-000000000000',
            alias: 'DEV_TENANT_LOCAL',
            display_name: 'Acme Corp (Dev Bypass)',
            sso_domain: 'acme.com',
            stripe_customer_id: null,
            plan_tier: 'ENTERPRISE',
          },
          {
            id: 'e0000000-0000-0000-0000-000000000001',
            alias: 'jpm-chase',
            display_name: 'JPMorgan Chase (Dev Bypass)',
            sso_domain: 'jpmorgan.com',
            stripe_customer_id: null,
            plan_tier: 'ENTERPRISE',
          },
          {
            id: 'e0000000-0000-0000-0000-000000000002',
            alias: 'open-source-lab',
            display_name: 'Open Source Lab (Dev Bypass)',
            sso_domain: 'oslab.org',
            stripe_customer_id: null,
            plan_tier: 'OPEN_CORE',
          },
        ];

        set({
          profile: mockProfile,
          organizations: mockOrganizations,
          activeOrganizationId: activeOrgId,
          isLoading: false,
        });

        // Ensure active organization cookie is in sync
        setCookie('active-org-id', activeOrgId);
        return;
      }

      // Standard Supabase client-side fetch
      const supabase = createClient();

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error(authError?.message || 'No authenticated user found');
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error(profileError.message || 'Failed to fetch profile');
      }

      // Fetch user organizations through organization_members table
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('role, organizations (*)')
        .eq('user_id', user.id);

      if (memberError) {
        throw new Error(memberError.message || 'Failed to fetch user organizations');
      }

      // Fetch subscriptions to associate plan_tier
      const { data: subsData } = await supabase
        .from('subscriptions' as any)
        .select('org_id, plan_tier');

      const subsMap = new Map((subsData || []).map((s: any) => [s.org_id, s.plan_tier]));

      // Safeguard extraction in case organizations is an array or object
      const organizations = (memberData || [])
        .map((item) => {
          const org = Array.isArray(item.organizations) ? item.organizations[0] : item.organizations;
          if (!org) return null;
          return {
            ...org,
            plan_tier: subsMap.get(org.id) || 'OPEN_CORE'
          };
        })
        .filter((org): org is Organization => !!org);

      // Resolve the active organization context
      let activeOrgId = getCookie('active-org-id');
      if (!activeOrgId || !organizations.some((org) => org.id === activeOrgId)) {
        activeOrgId = organizations[0]?.id || null;
      }

      set({
        profile,
        organizations,
        activeOrganizationId: activeOrgId,
        isLoading: false,
      });

      if (activeOrgId) {
        setCookie('active-org-id', activeOrgId);
      }
    } catch (err: any) {
      console.error('Error fetching tenant data:', err);
      set({
        error: err.message || 'An unknown error occurred while fetching tenant data',
        isLoading: false,
      });
    }
  },

  clearTenantData: () => {
    set({
      profile: null,
      organizations: [],
      activeOrganizationId: null,
      error: null,
    });
    // Remove active-org-id cookie
    if (typeof document !== 'undefined') {
      document.cookie = 'active-org-id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  },
}));
