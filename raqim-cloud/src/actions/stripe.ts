"use server";

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-02-24.acacia' as any,
});

export async function createCheckoutSession(priceId: string, orgId: string) {
  if (!priceId) {
    throw new Error('Price ID is required');
  }
  if (!orgId) {
    throw new Error('Organization ID is required');
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/dashboard`,
      cancel_url: `${appUrl}/dashboard`,
      client_reference_id: orgId,
      metadata: {
        org_id: orgId,
      },
      subscription_data: {
        metadata: {
          org_id: orgId,
        },
      },
    });

    if (!session.url) {
      throw new Error('Failed to create Stripe checkout session url');
    }

    return { url: session.url };
  } catch (err: any) {
    console.error('Error creating Stripe checkout session:', err);
    throw new Error(err.message || 'Failed to create checkout session');
  }
}
