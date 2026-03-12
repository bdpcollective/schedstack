import { NextResponse } from "next/server";
import { invalidateCache, getCachedData } from "@/lib/cache";

export async function POST() {
  try {
    await invalidateCache();
    const data = await getCachedData();
    return NextResponse.json({
      success: true,
      lastRefreshed: data.lastRefreshed,
    });
  } catch {
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
