import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { id } = await params;
    if (id === user.id) {
      return NextResponse.json({ error: "Cannot change your own role." }, { status: 400 });
    }

    const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

    const newRole = target.role === "Admin" ? "Member" : "Admin";
    const [updated] = await db
      .update(users)
      .set({ role: newRole })
      .where(eq(users.id, id))
      .returning({ id: users.id, name: users.name, role: users.role });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[PATCH /api/admin/users/[id]/role Error]", error);
    return NextResponse.json({ error: error.message || "Failed to update role" }, { status: 500 });
  }
}
