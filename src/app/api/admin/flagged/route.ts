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

    const items = await db
      .select()
      .from(flaggedContent)
      .where(eq(flaggedContent.resolved, 0))
      .orderBy(desc(flaggedContent.createdAt));

    return NextResponse.json(items);
  } catch (error: any) {
    console.error("[GET /api/admin/flagged Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch flagged items" }, { status: 500 });
  }
}
