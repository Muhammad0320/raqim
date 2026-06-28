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
  const headerPayload = await headers();
  const sig = headerPayload.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // Read raw body buffer for signature verification
    const body = Buffer.from(await req.arrayBuffer());
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'
    );
  } catch (err: any) {
    console.error("Stripe Webhook Signature Verification Failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.org_id || session.client_reference_id || undefined;
      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;

      if (subscriptionId && customerId) {
        await handleSubscriptionUpsert(subscriptionId, customerId, orgId);
      }
    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const orgId = subscription.metadata?.org_id || undefined;
      const subscriptionId = subscription.id;
      const customerId = subscription.customer as string;

      if (subscriptionId && customerId) {
        await handleSubscriptionUpsert(subscriptionId, customerId, orgId);
      }
    } else if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      const { data: orgs } = await supabaseAdmin
        .from("organizations")
        .select("id, alias")
        .eq("stripe_customer_id", customerId);

      if (orgs && orgs.length > 0) {
        const orgId = orgs[0].id;
        const tenantAlias = orgs[0].alias;

        // Do not downgrade the tenant to Open Core instantly.
        // Update database status to "past_due".
        await (supabaseAdmin
          .from("subscriptions" as any)
          .update({ status: "past_due" })
          .eq("org_id", orgId) as any);

        // Generate emergency fallback license with a strict exp timestamp set to exactly now + 72 hours.
        let privateKey = process.env.RSA_PRIVATE_KEY || process.env.RAQIM_RSA_PRIVATE_KEY;
        if (privateKey) {
          privateKey = privateKey.replace(/\\n/g, "\n");
          const nowUnix = Math.floor(Date.now() / 1000);
          const expUnix = nowUnix + (72 * 3600); // 72 hours in seconds

          const fallbackToken = jwt.sign(
            {
              sub: tenantAlias,
              features: ["local_swarm", "global_a2a", "global_crdt"],
              exp: expUnix,
              iat: nowUnix
            },
            privateKey,
            { algorithm: "RS256" }
          );

          const jwtHash = crypto.createHash("sha256").update(fallbackToken).digest("hex");

          // Upsert fallback token hash into database
          await supabaseAdmin
            .from("licenses")
            .upsert({
              org_id: orgId,
              jwt_hash: jwtHash,
              revoked: false,
              created_at: new Date().toISOString()
            }, { onConflict: "org_id" });
        }
      }
    } else if (event.type === "customer.subscription.deleted") {
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
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: `Processing Error: ${err.message}` }, { status: 500 });
  }
}