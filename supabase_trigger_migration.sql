-- -----------------------------------------------------------------------------
-- Supabase Trigger Migration: Multi-Tenant Organization Initialization
-- Hook: Runs AFTER INSERT on auth.users
-- Purpose: Seamlessly creates profiles, default organizations, and sets user as OWNER
-- -----------------------------------------------------------------------------

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    v_full_name varchar(255);
    v_org_id uuid;
    v_org_alias varchar(255);
    v_org_display_name varchar(255);
BEGIN
    -- 1. Extract full name from raw_user_meta_data fallback to email local part or default
    v_full_name := COALESCE(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        split_part(new.email, '@', 1),
        'New User'
    );

    -- 2. Insert user profile
    INSERT INTO public.profiles (id, full_name, avatar_url, updated_at)
    VALUES (
        new.id,
        v_full_name,
        new.raw_user_meta_data->>'avatar_url',
        NOW()
    );

    -- 3. Generate a clean and unique organization alias
    -- e.g., "Muhammad's Org" -> "muhammad-s-org"
    v_org_alias := lower(regexp_replace(v_full_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_org_alias := trim(both '-' from v_org_alias);
    
    IF v_org_alias = '' OR v_org_alias IS NULL THEN
        v_org_alias := 'org-' || substring(new.id::text, 1, 8);
    END IF;

    -- Avoid collisions on unique organization alias
    IF EXISTS (SELECT 1 FROM public.organizations WHERE alias = v_org_alias) THEN
        v_org_alias := v_org_alias || '-' || substring(new.id::text, 1, 8);
    END IF;

    -- Set organization display name
    v_org_display_name := v_full_name || '''s Organization';

    -- 4. Create default organization
    INSERT INTO public.organizations (alias, display_name)
    VALUES (v_org_alias, v_org_display_name)
    RETURNING id INTO v_org_id;

    -- 5. Associate the user to the organization as OWNER
    INSERT INTO public.organization_members (org_id, user_id, role)
    VALUES (v_org_id, new.id, 'OWNER');

    -- 6. Insert a default subscription to satisfy the primary key mapping and avoid null references in client db operations
    INSERT INTO public.subscriptions (org_id, plan_tier, status, current_period_end)
    VALUES (v_org_id, 'OPEN_CORE', 'active', NOW() + INTERVAL '10 years');

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
