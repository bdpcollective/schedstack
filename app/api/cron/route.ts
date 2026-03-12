import { NextRequest, NextResponse } from "next/server";
import { invalidateCache, getCachedData } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await invalidateCache();
    await getCachedData();
    return NextResponse.json({ success: true, time: new Date().toISOString() });
  } catch {
    return NextResponse.json(
      { error: "Cron refresh failed" },
      { status: 500 }
    );
  }
}
