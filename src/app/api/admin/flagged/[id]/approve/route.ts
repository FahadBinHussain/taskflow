import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { flaggedContent } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { id } = await params;
    await db.update(flaggedContent).set({ resolved: 1 }).where(eq(flaggedContent.id, id));

    return NextResponse.json({ message: "Marked as not spam." });
  } catch (error: any) {
    console.error("[PATCH /api/admin/flagged/[id]/approve Error]", error);
    return NextResponse.json({ error: error.message || "Failed to approve flag" }, { status: 500 });
  }
}
