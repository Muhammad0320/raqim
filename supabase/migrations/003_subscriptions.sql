-- Establish the subscriptions table with Stripe tracking columns
CREATE TABLE IF NOT EXISTS public.subscriptions (
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE PRIMARY KEY,
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    plan_tier VARCHAR(50) DEFAULT 'OPEN_CORE',
    status VARCHAR(50) DEFAULT 'active',
    current_period_end TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security (RLS) on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Remove duplicate policies if any exist
DROP POLICY IF EXISTS "Users can view their own organization subscription" ON public.subscriptions;

-- Establish select policy allowing organization members to view subscription details
CREATE POLICY "Users can view their own organization subscription" ON public.subscriptions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.org_id = subscriptions.org_id
            AND organization_members.user_id = auth.uid()
        )
    );
