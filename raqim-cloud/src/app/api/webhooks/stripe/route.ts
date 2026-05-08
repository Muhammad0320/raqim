import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe (assuming process.env.STRIPE_SECRET_KEY is set)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-02-24.acacia', // Use latest stable or preferred API version
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Extract client_reference_id which acts as our org_id
        const orgId = session.client_reference_id;
        
        if (!orgId) {
          console.warn('Checkout session completed without client_reference_id');
          break;
        }

        console.log(`Checkout session completed for org_id: ${orgId}`);
        // TODO: supabase.from('organizations').update({ status: 'active' }).eq('id', orgId);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Extract Stripe Customer ID
        const customerId = subscription.customer as string;
        
        console.log(`Subscription deleted for customer: ${customerId}`);
        
        // Look up the org_id using the customerId and downgrade their tier
        // TODO: const { data: org } = await supabase.from('organizations').select('id').eq('stripe_customer_id', customerId).single();
        // TODO: if (org) { await supabase.from('licenses').update({ plan_tier: 'OPEN_CORE' }).eq('org_id', org.id); }
        break;
      }

      default:
        // Unhandled event type
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error('Unhandled webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
