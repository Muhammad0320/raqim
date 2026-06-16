import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Resolve active org_id from headers (dev bypass), cookies, or active user session
    let orgId = req.headers.get("x-dev-org-id") || req.headers.get("x-org-id");

    if (!orgId) {
      const cookieStore = await cookies();
      orgId = cookieStore.get("active-org-id")?.value;
    }

    if (!orgId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!authError && user) {
        const { data: memberData } = await supabase
          .from("organization_members")
          .select("org_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();
        orgId = memberData?.org_id;
      }
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "Unauthorized: Active organization context missing" },
        { status: 401 }
      );
    }

    // 2. Query telemetry aggregates for the past 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: metrics, error: queryError } = await supabase
      .from("telemetry_daily_rollups" as any)
      .select("day, daily_crdt, daily_a2a, daily_time_travel")
      .eq("org_id", orgId)
      .gte("day", thirtyDaysAgo.toISOString())
      .order("day", { ascending: true });

    if (queryError) {
      console.error("Failed to query telemetry aggregates:", queryError);
      return NextResponse.json(
        { error: "Failed to retrieve aggregated dashboard metrics" },
        { status: 500 }
      );
    }

    // 3. Format telemetry metrics cleanly for Recharts compatibility
    const formattedData = (metrics || []).map((row: any) => ({
      date: row.day ? new Date(row.day).toISOString().split("T")[0] : "",
      crdt_merges: Number(row.daily_crdt || 0),
      a2a_bytes: Number(row.daily_a2a || 0),
      time_travels: Number(row.daily_time_travel || 0),
    }));

    return NextResponse.json(formattedData);
  } catch (err: any) {
    console.error("Dashboard metrics read endpoint error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
