import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await db
      .update(notifications)
      .set({ read: 1 })
      .where(eq(notifications.userId, user.id));

    return NextResponse.json({ message: "All notifications marked as read." });
  } catch (error: any) {
    console.error("[PATCH /api/notifications/read-all Error]", error);
    return NextResponse.json({ error: error.message || "Failed to mark notifications read" }, { status: 500 });
  }
}
