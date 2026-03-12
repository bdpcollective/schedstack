import { NextResponse } from "next/server";
import { getCachedData } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getCachedData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch assignment data" },
      { status: 500 }
    );
  }
}
