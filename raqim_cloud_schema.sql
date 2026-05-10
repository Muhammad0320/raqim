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

CREATE TABLE subscriptions (
    org_id UUID REFERENCES organizations(id) PRIMARY KEY,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    plan_tier VARCHAR(50) DEFAULT 'OPEN_CORE', 
    status VARCHAR(50) DEFAULT 'active',       
    current_period_end TIMESTAMP WITH TIME ZONE
);

-- 4. LICENSES (The RSA JWT Tracker)
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    jwt_hash VARCHAR(255) NOT NULL UNIQUE,
    revoked BOOLEAN DEFAULT false,
    issued_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

---------------------------------------- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 5. THE RAW HYPERTABLE (Minute-by-Minute)
CREATE TABLE telemetry_events (
    org_id UUID REFERENCES organizations(id),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    crdt_merges BIGINT NOT NULL,
    a2a_bytes_routed BIGINT NOT NULL,
    time_travel_queries BIGINT NOT NULL,
    billed BOOLEAN DEFAULT false 
);

---------------------- 
SELECT create_hypertable("telemetry_events", "recorded_at");

-- THE CONTINUOUS AGG: This automatically sums the raw data in the background with zero CPU cost on the Next.js API.
CREATE MATERIALIZED VIEW telemetry_daily_rollups
WITH (timescale.continuous) AS 
SELECT org_id, time_bucket('1 day', recorded_at) AS day, SUM(crdt_merges) as daily_crdt, SUM(a2a_bytes_routed) as daily_a2a, SUM(time_travel_queries) as daily_time_travel 
FROM telemetry_events 
GROUP BY org_id, day;

-- THE DATA RETENTION POLICY
SELECT add_retention_policy('telemetry_events', INTERVAL '7 days');
