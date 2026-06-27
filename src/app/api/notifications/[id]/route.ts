import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    await db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));

    return NextResponse.json({ message: "Notification dismissed." });
  } catch (error: any) {
    console.error("[DELETE /api/notifications/[id] Error]", error);
    return NextResponse.json({ error: error.message || "Failed to delete notification" }, { status: 500 });
  }
}
