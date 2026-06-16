-- Enable the TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create the telemetry_events table
CREATE TABLE IF NOT EXISTS public.telemetry_events (
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    crdt_merges BIGINT NOT NULL,
    a2a_bytes_routed BIGINT NOT NULL,
    time_travel_queries BIGINT NOT NULL,
    billed BOOLEAN DEFAULT false
);

-- Convert it to a hypertable chunked by recorded_at
SELECT create_hypertable('public.telemetry_events', 'recorded_at', if_not_exists => TRUE);

-- Create a continuous aggregate materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.telemetry_daily_rollups
WITH (timescale.continuous) AS
SELECT 
    org_id,
    time_bucket('1 day', recorded_at) AS day,
    SUM(crdt_merges) as daily_crdt,
    SUM(a2a_bytes_routed) as daily_a2a,
    SUM(time_travel_queries) as daily_time_travel
FROM public.telemetry_events
GROUP BY org_id, day;

-- Add a 7-day retention policy on the raw telemetry_events table
SELECT add_retention_policy('public.telemetry_events', INTERVAL '7 days', if_not_exists => TRUE);
