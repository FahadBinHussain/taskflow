import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { flaggedContent, tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { id } = await params;
    const [flag] = await db.select().from(flaggedContent).where(eq(flaggedContent.id, id)).limit(1);
    if (!flag) return NextResponse.json({ error: "Not found." }, { status: 404 });

    if (flag.taskId) {
      await db.delete(tasks).where(eq(tasks.id, flag.taskId));
    }
    await db.delete(flaggedContent).where(eq(flaggedContent.id, id));

    return NextResponse.json({ message: "Content and flag removed." });
  } catch (error: any) {
    console.error("[DELETE /api/admin/flagged/[id] Error]", error);
    return NextResponse.json({ error: error.message || "Failed to remove flag" }, { status: 500 });
  }
}
