import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Interface for the expected incoming telemetry payload
interface TelemetryPayload {
  org_id: string;
  crdt_merges: number;
  a2a_bytes: number;
  time_travel_queries: number;
}

// Define plan tiers to establish hierarchy
const PLAN_TIERS: Record<string, number> = {
  'OPEN_CORE': 0,
  'PRO': 1,
  'ENTERPRISE': 2,
  'SOVEREIGN': 3
};

export async function POST(req: Request) {
  try {
    // 1. Verify the Authorization header contains a valid Bearer token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken: any;

    try {
      // In production, this would use a securely stored secret or public key
      const secret = process.env.JWT_SECRET || 'development_secret';
      decodedToken = jwt.verify(token, secret);
    } catch (err: any) {
      console.error(`JWT Verification Failed: ${err.message}`);
      return NextResponse.json({ error: 'Invalid or expired license key' }, { status: 401 });
    }

    // Parse the incoming JSON body
    let body: TelemetryPayload;
    try {
      body = await req.json();
    } catch (err) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { org_id, crdt_merges, a2a_bytes, time_travel_queries } = body;

    // Validate required fields
    if (!org_id || crdt_merges === undefined || a2a_bytes === undefined || time_travel_queries === undefined) {
      return NextResponse.json({ error: 'Missing required telemetry fields' }, { status: 400 });
    }

    // 2. Update the telemetry table in Supabase
    // TODO: await supabase.from('telemetry').insert({
    //   org_id,
    //   crdt_merges,
    //   a2a_bytes,
    //   time_travel_queries,
    //   timestamp: new Date().toISOString()
    // });
    
    console.log(`[Telemetry] Heartbeat logged for org_id: ${org_id}`);

    // 3. Query the licenses table to check for discrepancies
    // TODO: const { data: license, error: dbError } = await supabase.from('licenses').select('plan_tier').eq('org_id', org_id).single();
    // if (dbError) { throw dbError; }
    
    // Mocking the database plan tier response for now:
    const dbPlanTier = 'ENTERPRISE'; // In reality, this is: license?.plan_tier || 'OPEN_CORE'
    const jwtPlanTier = decodedToken.plan_tier || 'OPEN_CORE';
    
    // Check if the database plan tier is higher than the JWT plan tier
    const dbTierLevel = PLAN_TIERS[dbPlanTier] ?? 0;
    const jwtTierLevel = PLAN_TIERS[jwtPlanTier] ?? 0;
    
    const isTierHigher = dbTierLevel > jwtTierLevel;

    // Check if the JWT expires in less than 48 hours
    // JWT exp is in seconds, Date.now() is in milliseconds
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const fortyEightHoursInSeconds = 48 * 60 * 60;
    
    let expiresSoon = false;
    if (decodedToken.exp) {
      const timeUntilExpiration = decodedToken.exp - nowInSeconds;
      expiresSoon = timeUntilExpiration < fortyEightHoursInSeconds;
    }

    // Return renewal requirement if any condition is met
    if (isTierHigher || expiresSoon) {
      console.log(`[Telemetry] Renewal required for org ${org_id}. Tier disparity: ${isTierHigher}, Expiring soon: ${expiresSoon}`);
      return NextResponse.json({ requires_renewal: true }, { status: 200 });
    }

    // Otherwise, signal success
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('Unhandled telemetry route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
