"use server";

import { cookies } from "next/headers";

export interface TelemetryMetric {
  date: string;
  crdt_merges: number;
  a2a_bytes: number;
  time_travels: number;
}

/**
 * Fetches the rolling 30-day telemetry array from the internal dashboard metrics endpoint.
 * This runs securely on the server and forwards cookies (e.g. active-org-id, auth sessions).
 */
export async function fetchTelemetryMetrics(orgId?: string): Promise<TelemetryMetric[]> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    const activeOrgId = orgId || cookieStore.get('active-org-id')?.value;

    // Fallback to localhost if not specified in env
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = `${appUrl}/api/dashboard/metrics${activeOrgId ? `?orgId=${activeOrgId}` : ""}`;

    const res = await fetch(url, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store", // Ensure we pull fresh telemetry rollups without caching
    });

    if (!res.ok) {
      const errorMsg = await res.text().catch(() => "Unknown error");
      throw new Error(`Failed to fetch telemetry metrics: HTTP ${res.status} - ${errorMsg}`);
    }

    const data = await res.json();
    if (data && data.error) {
      throw new Error(data.error);
    }

    // Map the returned metrics from { metrics } to TelemetryMetric[]
    const rawMetrics = data.metrics || [];
    return rawMetrics.map((row: any) => ({
      date: row.day ? new Date(row.day).toISOString().split("T")[0] : "",
      crdt_merges: Number(row.daily_crdt || 0),
      a2a_bytes: Number(row.daily_a2a || 0),
      time_travels: Number(row.daily_time_travel || 0),
    })) as TelemetryMetric[];
  } catch (err: any) {
    console.error("[fetchTelemetryMetrics Action Error]:", err);
    throw err;
  }
}
