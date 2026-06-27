import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, tasks, projectMembers, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { id } = await params;
    if (id === user.id) {
      return NextResponse.json({ error: "Cannot delete yourself." }, { status: 400 });
    }

    const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

    await db.delete(tasks).where(eq(tasks.ownerId, id));
    await db.delete(projectMembers).where(eq(projectMembers.userId, id));
    await db.delete(notifications).where(eq(notifications.userId, id));
    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({ message: "User removed." });
  } catch (error: any) {
    console.error("[DELETE /api/admin/users/[id] Error]", error);
    return NextResponse.json({ error: error.message || "Failed to remove user" }, { status: 500 });
  }
}
