import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: "2026-06-24.dahlia" as any,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

async function handleSubscriptionUpsert(subscriptionId: string, stripeCustomerId: string, orgIdFromEvent: string | undefined) {
  // Retrieve subscription from Stripe to get the latest status & price
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  let orgId = orgIdFromEvent || subscription.metadata?.org_id;

  if (!orgId) {
    // Fallback: look up organization by stripe_customer_id
    const { data: orgs } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('stripe_customer_id', stripeCustomerId);
    orgId = orgs?.[0]?.id;
  }

  if (!orgId) {
    console.error(`Could not resolve org_id for customer ${stripeCustomerId} and subscription ${subscriptionId}`);
    return;
  }

  // Ensure organization stripe_customer_id is set
  await supabaseAdmin
    .from('organizations')
    .update({ stripe_customer_id: stripeCustomerId })
    .eq('id', orgId);

  // Map Stripe price ID to our internal tier
  const priceId = subscription.items.data[0]?.price?.id;
  let tier = 'OPEN_CORE';

  const startupPriceId = process.env.STRIPE_PRICE_STARTUP || process.env.STRIPE_STARTUP_PRICE_ID || 'price_startup_mock_id';
  const enterprisePriceId = process.env.STRIPE_PRICE_ENTERPRISE || process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_mock_id';

  if (priceId === enterprisePriceId) {
    tier = 'ENTERPRISE';
  } else if (priceId === startupPriceId) {
    tier = 'STARTUP';
  }

  // Upsert subscription details
  const { error } = await (supabaseAdmin
    .from('subscriptions' as any)
    .upsert({
      org_id: orgId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: subscriptionId,
      plan_tier: tier,
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    }) as any);

  if (error) {
    console.error('Database error upserting subscription:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  const payload = await req.text()
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {

    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'
    );
  } catch (err: any) {
    console.error("Stripe Webhook Signature Verification Failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session

  
  
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const orgId = session.metadata?.org_id || session.client_reference_id || undefined;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (subscriptionId && customerId) {
          await handleSubscriptionUpsert(subscriptionId, customerId, orgId);
        }

        const subscriptionDetails = await stripe.subscriptions.retrieve(subscriptionId)

        // Extract specific metered subscription item ID from the array to map our database fields.
        const items = subscriptionDetails.items.data;
        const mergeItemId = items.find(i => i.id === process.env.STRIPE_MERGES)?.id || null 
        const forkItemId = items.find(i => i.id === process.env.STRIPE_MERGES)?.id || null 
        const bandwidthItemId = items.find(i => i.id === process.env.STRIPE_MERGES)?.id || null 

        let planTier;
        if (items.find(i => i.id === process.env.STRIPE_STARTUP_BASE )?.id) {
          planTier = "STARTUP"
        } else if (items.find(i => i.id === process.env.STRIPE_ENTERPRISE_BASE )?.id) {
          planTier = "ENTERPRISE"
        } else {
          planTier = "OPEN_CORE"
        } 

        // Atomically map map the subscription data into our relational table
        await supabaseAdmin.from("subscriptions").upsert({
          org_id: orgId, 
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan_tier: planTier,
          status: "active",
          stripe_merge_item_id: mergeItemId,
          stripe_bandwidth_item_id: bandwidthItemId,
          stripe_fork_item_id: forkItemId,
          grace_expires_at: null, 
          updated_at: new Date().toISOString()
          
        });

        await supabaseAdmin.from("organizations").update({stripe_customer_id: customerId, plan_tier: planTier}).eq("id", orgId);

        break; 
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.org_id || undefined;
        const subscriptionId = subscription.id;
        const customerId = subscription.customer as string;

        if (subscriptionId && customerId) {
          await handleSubscriptionUpsert(subscriptionId, customerId, orgId);
        }
        break;
      }
      case "invoice.payment_failed": {

        const stripeSubscriptionId = session.subscription as string;

        // Calculate a 7 hour cryptographic grace period 
        const graceTimeStamp = new Date()
        
        graceTimeStamp.setHours(graceTimeStamp.getHours() + 72);

        await supabaseAdmin.from("subscriptions").update({status: "past_due", grace_expires_at: graceTimeStamp.toISOString() }).eq("stripe_subscription_id", stripeSubscriptionId);

        println(`[STRIPE WEBHOOK] Invoice failed. 72h deployment grace active for sub: ${stripeSubscriptionId}`);
 
        break;

      }

      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const currentPeriodEnd = subscription.current_period_end; // unix timestamp

        // Extract currentPeriodEnd, do not immediately drop their enterprise status.
        // Update database record to log cancellation but preserve feature access until currentPeriodEnd.
        await (supabaseAdmin
          .from("subscriptions" as any)
          .update({
            status: "canceled",
            current_period_end: new Date(currentPeriodEnd * 1000).toISOString()
          })
          .eq("stripe_subscription_id", subscription.id) as any);
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: `Processing Error: ${err.message}` }, { status: 500 });
  }
}

function println(message: string) {
  console.log(message)
}