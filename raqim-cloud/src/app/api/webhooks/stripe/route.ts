import { NextResponse } from "next/server";
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {apiVersion: "2025-10-16"});

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
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session; 
    }
 
    // THE KILL SWITCH: Their monthly card declined
    if (event.type ===  "invoice.payment_failed" ) {
        
    } 

    return NextResponse.json({received: true});
}