"use server";

import Stripe from 'stripe';
import { redirect } from 'next/navigation';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-02-24.acacia' as any,
});

export async function createStripeCheckoutSession(orgId: string, priceId: string) {
  if (!orgId) {
    throw new Error('Organization ID is required');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, 
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing/canceled`,
      subscription_data: {
        metadata: {
          org_id: orgId,
        },
      },
    });

    if (session.url) {
      redirect(session.url);
    } else {
      throw new Error('Failed to create Stripe session URL');
    }
  } catch (err: any) {
    if (err.message === 'NEXT_REDIRECT') {
      throw err;
    }
    console.error('Stripe error:', err);
    throw new Error(err.message || 'Error creating checkout session');
  }
}
