-- 1. PROFILES (Extends Supabase Auth users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ORGANIZATIONS (The Tenant)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alias VARCHAR(255) UNIQUE NOT NULL, -- e.g., 'jpm_chase'
    display_name VARCHAR(255) NOT NULL, -- e.g., 'JPMorgan Chase & Co.'
    sso_domain VARCHAR(255) UNIQUE,     -- e.g., 'jpmorgan.com'
    stripe_customer_id VARCHAR(255)
);

-- 3. ORGANIZATION MEMBERS
CREATE TABLE organization_members (
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'VIEWER', -- 'OWNER', 'ADMIN', 'VIEWER'
    PRIMARY KEY (org_id, user_id)
);

-- 4. LICENSES (The RSA JWT Tracker)
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    jwt_hash VARCHAR(255) NOT NULL UNIQUE,
    plan_tier VARCHAR(50) DEFAULT 'STARTUP',
    revoked BOOLEAN DEFAULT false,
    issued_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TELEMETRY AGGREGATES
CREATE TABLE telemetry (
    org_id UUID REFERENCES organizations(id) PRIMARY KEY,
    crdt_merges BIGINT DEFAULT 0,
    a2a_bytes_routed BIGINT DEFAULT 0,
    time_travel_queries BIGINT DEFAULT 0,
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);