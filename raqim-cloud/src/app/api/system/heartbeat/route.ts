import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";


const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!); 
const PUBLIC_KEY = process.env.RAQIM_RSA_PUBLIC_KEY;
const PRIVATE_KEY = process.env.RAQIM_RSA_PRIVATE_KEY; 

export async function GET(req:Request) {
    
    const authHeader = req.headers.get("Authorization"); 
    if (!authHeader) return NextResponse.json({error: "Missing token"}, {status: 401}); 

    const token = authHeader.replace("Bearer ", "");
    let tenant_id: String; 

    try {
        const decoded = jwt.verify(token, (PUBLIC_KEY || "") as string, {algorithms: ["RS256"]}) as any; 
        tenant_id = decoded.sub;
    } catch (err) {
            return NextResponse.json({error: "Invalid Token"}, {status: 401})
    }

    const {data: sub} = await (supabaseAdmin.from("subsciptions" as any).select("status, plan_tier, current_period_end").eq("org_id", tenant_id).single() as any);

    if (!sub) return NextResponse.json({error: "No subsciption"}, {status: 404});

    let features: string[] = [];
    if (sub.plan_tier === "ENTERPRISE") features = ["global_crdt", "global_a2a",  "aegis", "time_travel"];
    if (sub.plan_tier === "STARTUP") features = ["global_a2a", "global_crdt"]

    // The Grace Period (Calculated dynamically)
    if (sub.status === "past_due") {

        const now = new Date().getTime();

        const graceEnd = new Date(sub.current_period_end).getTime() + (72 * 60 * 60 * 1000);

        if (now > graceEnd) {

            // Grace Period is exceeded
            const fallbackToken = jwt.sign({sub: tenant_id, features: []}, (PRIVATE_KEY || "") as string, {algorithm: "RS256", expiresIn: "30d"} );
            return NextResponse.json({ new_license: fallbackToken }, {status: 402});

        }

    }

    // Subscriptions is Active or Within the 72-h grace period. Mint the Premium 7-Day JWT. 
    const premiumToken = jwt.sign({sub: tenant_id, features}, (PRIVATE_KEY || "") as string, {algorithm: 'RS256', expiresIn: '7d'});
    
    return NextResponse.json({new_license: premiumToken});
}
