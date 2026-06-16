import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    // 1. Authenticate custom RS256 Bearer JWT from the edge daemon
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const publicKey = process.env.RAQIM_RSA_PUBLIC_KEY || process.env.RSA_PUBLIC_KEY;
    if (!publicKey) {
      console.error("Missing RAQIM_RSA_PUBLIC_KEY env variable");
      return NextResponse.json({ error: "Ingestion service key configuration error" }, { status: 500 });
    }

    let decoded: any;
    try {
      const formattedPublicKey = publicKey.replace(/\\n/g, "\n");
      decoded = jwt.verify(token, formattedPublicKey, { algorithms: ["RS256"] });
    } catch (err: any) {
      return NextResponse.json({ error: `Unauthorized: ${err.message}` }, { status: 401 });
    }

    const tenantAlias = decoded.sub;
    if (!tenantAlias) {
      return NextResponse.json({ error: "Invalid token: sub claim is missing" }, { status: 401 });
    }

    // 2. Initialize Supabase Admin client using @supabase/ssr with the service role key
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return []; },
          setAll() {}
        }
      }
    );

    // 3. Resolve the organization's UUID from the alias
    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("alias", tenantAlias)
      .single();

    if (orgError || !org) {
      console.error(`Organization look up failed for alias: ${tenantAlias}`, orgError);
      return NextResponse.json({ error: "Organization tenant mismatch" }, { status: 404 });
    }

    // 4. Parse payload supporting NDJSON and standard JSON
    const contentType = req.headers.get("content-type") || "";
    const rawBody = await req.text();
    let events: any[] = [];

    if (contentType.includes("ndjson") || rawBody.trim().includes("\n")) {
      const lines = rawBody.split("\n").map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        try {
          events.push(JSON.parse(line));
        } catch (e) {
          console.error("Failed to parse NDJSON line:", line, e);
        }
      }
    } else {
      try {
        const parsed = JSON.parse(rawBody);
        events = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        return NextResponse.json({ error: "Invalid JSON body format" }, { status: 400 });
      }
    }

    if (events.length === 0) {
      return NextResponse.json({ error: "No valid events provided in payload" }, { status: 400 });
    }

    // 5. Map and insert telemetry events
    const rows = events.map((event) => ({
      org_id: org.id,
      crdt_merges: Number(event.crdt_merges ?? event.daily_crdt ?? 0),
      a2a_bytes_routed: Number(event.a2a_bytes ?? event.daily_a2a ?? 0),
      time_travel_queries: Number(event.time_travels ?? event.daily_time_travel ?? 0),
      billed: false,
      recorded_at: event.recorded_at ? new Date(event.recorded_at).toISOString() : new Date().toISOString(),
    }));

    const { error: insertError } = await supabaseAdmin
      .from("telemetry_events")
      .insert(rows);

    if (insertError) {
      console.error("Database telemetry ingestion failed:", insertError);
      return NextResponse.json({ error: "Ingestion database insertion failure" }, { status: 500 });
    }

    return NextResponse.json({ status: "success", count: rows.length });
  } catch (err: any) {
    console.error("Telemetry ingestion endpoint error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
