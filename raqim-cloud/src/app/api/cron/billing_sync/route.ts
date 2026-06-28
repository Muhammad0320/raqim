import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import crypto from 'crypto'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: "2026-06-24.dahlia" as any,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);


export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  
  // Enforce cron secret verification to prevent unauthenticated internet triggers
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized cron signature' }, { status: 401 });
  }

  const todayStr = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
  const currentTimestamp = Math.floor(Date.now() / 1000);

  

  try {

    /// 1. Fetch all active commercial cluster subscription
    const {data: activeSubscriptions, error: fetchError } = await supabaseAdmin.from("subscriptions").select(`org_id, stripe_subscription_id, stripe_merge_item_id, stripe_bandwidth_item_id, stripe_fork_item_id`).in("status", ['active', 'past_due']);

    if (fetchError || !activeSubscriptions) throw fetchError; 
    
    let syncCount = 0;

    for (const sub of activeSubscriptions) {

      // Query the raw metric rollups aggregated inside TimescaleDB for this specific day
      const {data: telemetry, error: metricError} = await supabaseAdmin.from("telemetry_daily_rollups").select("total_merges, total_bytes, total_forks").eq("org_id", sub.org_id).eq("bucket_day", todayStr).single();

      if (metricError || !telemetry) continue;

      // Process meter 1: Crdt Merges
      if (sub.stripe_merge_item_id && telemetry.total_merges > 0) {

        const idempotencyKey = crypto.createHash("sha256").update(`${sub.stripe_merge_item_id}-merges-${todayStr}`).digest("hex");

        await stripe.subscriptionItems.createUsageRecord(sub.stripe_merge_item_id, {quantity: telemetry.total_merges, timestamp: currentTimestamp, action: "set"}, {idempotencyKey})



      }

      // Process Meter 2: A2A Bandwidth (Converted from bytes to whole Gigabytes)
      if (sub.stripe_bandwidth_item_id && telemetry.total_bytes > 0) {

        const totalGB = Math.ceil(telemetry.total_bytes / (1024 * 1024 * 1024)); 

        const idempotencyKey = crypto.createHash("sha256").update(`${sub.stripe_bandwidth_item_id}-bandwidth-${todayStr}`).digest("hex");

        await stripe.subscriptionItems.createUsageRecord(sub.stripe_bandwidth_item_id, {quantity: totalGB, timestamp: currentTimestamp, action: "set"}, {idempotencyKey})

      }

      // Process Meter 2: Temporal Reality Fork
      if (sub.stripe_fork_item_id && telemetry.total_forks > 0) {

        const idempotencyKey = crypto.createHash("sha256").update(`${sub.stripe_fork_item_id}-forks-${todayStr}`).digest("hex");

        await stripe.subscriptionItems.createUsageRecord(sub.stripe_fork_item_id, {quantity: telemetry.total_forks, timestamp: currentTimestamp, action: "set" }, {idempotencyKey})

      }


      await supabaseAdmin.from("subscriptions").update({last_billing_sync: new Date().toISOString()}).eq("org_ig", sub.org_id)
      syncCount ++ 

    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
