import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        lastSeen: users.lastSeen,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("[GET /api/users/[id] Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch user" }, { status: 500 });
  }
}
