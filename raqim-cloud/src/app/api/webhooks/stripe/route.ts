import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {apiVersion: "2025-12-18" as any});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

export async function POST(req: Request) {

    const sig = req.headers.get("stripe-signature")!
    const body = await req.text() 

    let event;
    try {
            event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err) {
        return NextResponse.json({error: "Webhook Error"}, {status: 400});
    }


    // SUCCESS
    if (event.type as string === "customer.subscription.updated" || event.type as string === "customer.subscription.created" ) {

        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata.org_id;

        let tier = "OPEN_CORE";
        const priceId = subscription.items.data[0].price.id; 
        if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) tier = "ENTERPRISE"
        else if (priceId === process.env.STRIPE_PRICE_STARTUP) tier = "STARTUP"

        if (orgId) {

            await (supabaseAdmin.from("subscriptions" as any).upsert({
                org_id: orgId,
                stripe_subscription_id: subscription.id, 
                plan_tier: tier, 
                status: subscription.status,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString() 
            }) as any)

        }

    }
 
    // THE KILL SWITCH: Their monthly card declined
    if (event.type as string ===  "invoice.payment_failed" || event.type as string === "customer.subscription.deleted" ) {
        const obj = event.data.object as any;
        const subscriptionId = obj.subscription || obj.id; 
        const customerId = obj.customer;

        const {data: orgs} = await supabaseAdmin.from("organizations").select("id").eq("stripe_customer_id", customerId);

        if (orgs && orgs.length > 0) {
            const org_id = orgs[0].id;
            // Instantly revoke license in the db. 
            await supabaseAdmin.from("licenses").update({revoked: true}).eq("org_id", org_id); 
            await (supabaseAdmin.from("subscriptions" as any).update({plan_tier: "OPEN_CORE"}).eq("org_id", org_id) as any);
        }
    } 

    return NextResponse.json({received: true});
}