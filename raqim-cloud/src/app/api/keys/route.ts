import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import jwt from "jsonwebtoken";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const orgId = body.orgId || body.org_id;
    const { requested_features } = body;

    if (!orgId) {
      return NextResponse.json({ error: "org_id is required" }, { status: 400 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthenticated context' }, { status: 401 });
    }

    // Fetch the membership record and explicitly verify the security role
    const { data: membership, error: rbacError } = await supabase
      .from('organization_members')
      .select('role, organizations(id, alias)')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (rbacError || !membership) {
      return NextResponse.json({ error: 'Access Denied: Tenant Isolation Mismatch' }, { status: 403 });
    }

    // Strict RBAC Enforcement: Block regular VIEWERS from generating licenses
    if (membership.role !== 'ADMIN' && membership.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden: Elevate permissions to mint license keys' }, { status: 403 });
    }

    const org: any = Array.isArray(membership.organizations) ? membership.organizations[0] : membership.organizations;
    if (!org) {
      return NextResponse.json({ error: "Organization Access Denied" }, { status: 403 });
    }
    const tenant_id = org.alias;

    // Fetch subscription plan_tier supporting spelling variations
    let subData = null;
    
    const subRes = await (supabase
      .from("subscriptions" as any)
      .select("plan_tier")
      .eq("org_id", orgId)
      .single() as any);

    if (!subRes.error && subRes.data) {
      subData = subRes.data;
    } else {
      const fallbackRes = await (supabase
        .from("subsciptions" as any)
        .select("plan_tier")
        .eq("org_id", orgId)
        .single() as any);
      subData = fallbackRes.data;
    }

    const plan_tier = subData?.plan_tier || "OPEN_CORE";

    // Enforce plan restrictions on the backend source of truth
    const final_features = new Set<string>(requested_features || []);
    if (plan_tier === "STARTUP" || plan_tier === "OPEN_CORE") {
      final_features.delete("aegis");
      final_features.delete("time_travel");
    }

    // Enforce dependency rule: Distributed CRDT requires Global WAN Mesh
    if (final_features.has("global_crdt") && !final_features.has("global_a2a")) {
      final_features.add("global_a2a");
    }

    // Retrieve private key from environmental configuration
    let privateKey = process.env.RSA_PRIVATE_KEY || process.env.RAQIM_RSA_PRIVATE_KEY;
    if (!privateKey) {
      console.error("Missing cryptographic RSA key config");
      return NextResponse.json({ error: "Cryptographic key configuration is missing on server" }, { status: 500 });
    }

    privateKey = privateKey.replace(/\\n/g, "\n");

    // Sign JWT with RS256 algorithm
    const token = jwt.sign(
      { sub: tenant_id, features: Array.from(final_features) },
      privateKey,
      { algorithm: "RS256", expiresIn: "7d" }
    );

    // Hash the JWT with SHA-256 for secure database tracking and revocation auditing
    const jwtHash = crypto.createHash("sha256").update(token).digest("hex");

    // Save the record
    const { error: upsertError } = await supabase
      .from("licenses")
      .upsert(
        {
          org_id: orgId,
          jwt_hash: jwtHash,
          revoked: false,
          issued_by: user.id,
          created_at: new Date().toISOString()
        },
        { onConflict: "org_id" }
      );

    if (upsertError) {
      console.error("License tracking failure:", upsertError);
      return NextResponse.json({ error: "Failed to persist cryptographic license" }, { status: 500 });
    }

    // Return the plain-text signed token
    return NextResponse.json({ license_key: token });
  } catch (err: any) {
    console.error("Keys Minting Endpoint Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
