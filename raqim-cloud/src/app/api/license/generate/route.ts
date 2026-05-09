import { NextResponse } from "next/server";
import {createClient} from "@/utils/supabase/server"
import jwt from "jsonwebtoken";
import crypto from "crypto" 

export async function POST(req: Request) {

        const supabase =  await createClient();

        // Absolute Authentication
        const {data: {user}, error: authtError} = await supabase.auth.getUser();
        if (authtError || !user) return NextResponse.json({error: "Unauthorized"}, {status: 401});

        const {org_id, requested_features} = await req.json();

        // Fetch Organization Data & Enforce Authentication
        const {data: orgData, error: OrgError} = await supabase.from("organization_members").select("organizations(id, alias, plan_tier)").eq("user_id", user.id).eq("org_id", org_id).single();

        if (!orgData || OrgError) return NextResponse.json({error: "Organization Acess Denied."}, {status: 403});

        // @ts-ignore
        const tenant_id = orgData.organizations.alias;
        // @ts-ignore
        const plan_tier = orgData.organizations.plan_tier;

        // Plan Enforcement (Backend source of truth)
        let final_features = new Set<string>(requested_features);
        if (plan_tier === "STARTUP" || plan_tier === "OPEN_CORE") {
                final_features.delete("aegis");
                final_features.delete("time_travel");
        }

        // Dependency Rule. 
        if (final_features.has("global_crdt") && !final_features.has("global_a2a") ) {
                final_features.add("global_a2a");
        }

        // Cryptographic Minting
        const privateKey = process.env.RAQIM_RSA_PRIVATE_KEY!;
        const token = jwt.sign(
                {sub: tenant_id, features: Array.from(final_features)}, 
                privateKey, 
                {algorithm: "RS256", expiresIn: "7d"}
        );

        // Database Tracking ( SHA-256 Hash for revocation )
        const jwtHash = crypto.createHash("sha256").update(token).digest("hex");

        await supabase.from("licenses").upsert({
                org_id: org_id,
                jwt_hash: jwtHash, 
                plan_tier: plan_tier,
                revoked: false,
                issued_by: user.id, 
        }, {onConflict: "org_id"})

        return NextResponse.json({license_key: token});

}