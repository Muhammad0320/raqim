import { NextResponse } from "next/server";
import {createClient} from "@/supabase/supabase-js"

export async function POST(request:Request) {
        const {org_id, requested_features} = await request.json();
        const features = new Set(requested_features)
        // Fetch the Private Key from Supabase Vault (or Vercel Env)
        const privateKeyPem = process.env.RAQIM_RSA_PRIVATE_KEY;
        if (!privateKeyPem) throw new Error("KMS offline");

        // Cryptographic ignition. 
        const private_key = await importPKCS8(privateKeyPem, "RS256");

        const jwt = await new SignJwt({features: Array.from(features)}).setProtectedHeaderr({alg: "RS256"}).setSubject(org_id).setIssueAt().SetExpirationTime("7d").sign(private_key);

        // Update the DB
        await supabaseAdmin.from("licenses").update({ jwt_hash:  await hash(jwt) })
}