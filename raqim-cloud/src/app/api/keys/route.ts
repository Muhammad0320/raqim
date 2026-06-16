import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate the user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { org_id, requested_features } = body;

    if (!org_id) {
      return NextResponse.json({ error: "org_id is required" }, { status: 400 });
    }

    // 2. Fetch organization membership to verify ownership/permission
    const { data: orgMember, error: orgMemberError } = await supabase
      .from("organization_members")
      .select("organizations(id, alias)")
      .eq("user_id", user.id)
      .eq("org_id", org_id)
      .single();

    if (orgMemberError || !orgMember || !orgMember.organizations) {
      return NextResponse.json({ error: "Organization Access Denied" }, { status: 403 });
    }

    const org = Array.isArray(orgMember.organizations) ? orgMember.organizations[0] : orgMember.organizations;
    const tenant_id = org.alias;

    // 3. Fetch subscription plan_tier supporting spelling variations
    let subData = null;
    
    const subRes = await supabase
      .from("subscriptions")
      .select("plan_tier")
      .eq("org_id", org_id)
      .single();

    if (!subRes.error && subRes.data) {
      subData = subRes.data;
    } else {
      const fallbackRes = await supabase
        .from("subsciptions" as any)
        .select("plan_tier")
        .eq("org_id", org_id)
        .single();
      subData = fallbackRes.data;
    }

    const plan_tier = subData?.plan_tier || "OPEN_CORE";

    // 4. Enforce plan restrictions on the backend source of truth
    const final_features = new Set<string>(requested_features || []);
    if (plan_tier === "STARTUP" || plan_tier === "OPEN_CORE") {
      final_features.delete("aegis");
      final_features.delete("time_travel");
    }

    // Enforce dependency rule: Distributed CRDT requires Global WAN Mesh
    if (final_features.has("global_crdt") && !final_features.has("global_a2a")) {
      final_features.add("global_a2a");
    }

    // 5. Retrieve private key from environmental configuration
    let privateKey = process.env.RSA_PRIVATE_KEY || process.env.RAQIM_RSA_PRIVATE_KEY;
    if (!privateKey) {
      console.error("Missing cryptographic RSA key config");
      return NextResponse.json({ error: "Cryptographic key configuration is missing on server" }, { status: 500 });
    }

    privateKey = privateKey.replace(/\\n/g, "\n");

    // 6. Sign JWT with RS256 algorithm
    const token = jwt.sign(
      { sub: tenant_id, features: Array.from(final_features) },
      privateKey,
      { algorithm: "RS256", expiresIn: "7d" }
    );

    // 7. Hash the JWT with SHA-256 for secure database tracking and revocation auditing
    const jwtHash = crypto.createHash("sha256").update(token).digest("hex");

    // Save the record
    const { error: upsertError } = await supabase
      .from("licenses")
      .upsert(
        {
          org_id: org_id,
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
