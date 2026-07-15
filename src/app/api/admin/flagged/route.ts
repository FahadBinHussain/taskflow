import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { flaggedContent } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    // Cap queue size so the moderation panel stays fast on large workspaces.
    const { searchParams } = new URL(req.url);
    const rawLimit = parseInt(searchParams.get("limit") || "50", 10);
    const limit = Number.isNaN(rawLimit) ? 50 : Math.min(Math.max(rawLimit, 1), 100);

    const items = await db
      .select()
      .from(flaggedContent)
      .where(eq(flaggedContent.resolved, 0))
      .orderBy(desc(flaggedContent.createdAt))
      .limit(limit);

    return NextResponse.json(items);
  } catch (error: any) {
    console.error("[GET /api/admin/flagged Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch flagged items" }, { status: 500 });
  }
}
