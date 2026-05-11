import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABABSE_SERVICE_ROLE_KEY! );
const PUBLIC_KEY = process.env.RAQIM_RSA_PUBLIC_KEY!;

export async function POST(req:Request) {
    
    try {

        const authHeader = req.headers.get("Authorization");
        if (!authHeader) return NextResponse.json({error: "Missing token"}, {"status": 401}); 

         const token = authHeader.replace("Bearer ", "");
         const decoded = jwt.verify(token, PUBLIC_KEY, {algorithms: ['RS256']}) as any;
         const tenant_id = decoded.sub;

        // Parse the NDJSON body ( Rust sends multiple lines separated by \n )
        const textBody = await req.text();
        const lines = textBody.split("\n").filter(line => line.trim() !== "");

        const payload = lines.map(l => {
            const data = JSON.parse(l);
            return {
                org_id: data.tenant,
                recorded_at: new Date(data.timestamp * 1000).toISOString(),
                crdt_merges: data.crdt_merges, 
                a2a_bytes_routed: data.a2a_bytes, 
                time_travel_queries: data.time_travels, 
            };
        });

        // Bulk insert into Timescale DB hypertable
        await supabaseAdmin.from("telemetry_events").insert("payload");

        return NextResponse.json({status: "Injested"}, {status: 201})
    } catch (err) {
        return NextResponse.json({error: "Injestion Failed"}, {status: 400})
    }

}   
