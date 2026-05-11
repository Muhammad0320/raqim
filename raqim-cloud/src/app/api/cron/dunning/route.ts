
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {Resend} from "resend";

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function GET(req: Request) {

    // Fetch only organizations whose Stripe payment has failed (past_due)
    const {data: orgs} = await supabaseAdmin.from("subscriptions").select(`
        org_id, 
        current_period_end, organizations (alias),
         organization_members (auth.users (email) )
          `).eq("status", "past_due");

    if (!orgs) return NextResponse.json({processed: 0})

    const now = new Date().getTime();

    for (const sub of orgs) {

        // @ts-ignore
        const period = new Date(sub.current_period_end).getTime(); 

        // How many hours has passed since the invoice failed 
        const hoursPastDue = (now - period) / (60 * 60 * 1000); 

        // Extract the admins email to notify
        // @ts-ignore
        const adminEmails = sub.organization_memebers.filter((m: any) => m.role === "ADMIN" ).map((m: any) => m.auth.users.email);

        if (hoursPastDue >= 24 && hoursPastDue < 36) {
            // (T-48h warning) 
            await resend.emails.send({  from: "billing@raqim.cloud", to: adminEmails, subject: "URGENT: Raqim OS Disruption in 48 Hours", text: `Your Stripe Invoice failed. Your Global CRDT mesh will mathematically be severed in 48 hours. Update your paymentt method` })

        } else if (hoursPastDue >= 72 && hoursPastDue < 84) {

            await resend.emails.send({ from: "billing@raqim.cloud", to: adminEmails, subject: "[ACTION REQUIRED] Raqim OS downgraded to OPEN CORE", "text": `Your 72-hour grace period expired. Premium OS features have been safely disabled. Your swarm is now running in local-loopback mode.`})

        }
    } 

    return NextResponse.json({processed: orgs.length});
}
