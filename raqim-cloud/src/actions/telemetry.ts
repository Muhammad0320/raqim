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
export async function fetchTelemetryMetrics(): Promise<TelemetryMetric[]> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    // Fallback to localhost if not specified in env
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = `${appUrl}/api/dashboard/metrics`;

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

    return data as TelemetryMetric[];
  } catch (err: any) {
    console.error("[fetchTelemetryMetrics Action Error]:", err);
    throw err;
  }
}
