import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, tasks } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getAuthenticatedUser, hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        lastSeen: users.lastSeen,
      })
      .from(users)
      .orderBy(asc(users.createdAt));

    const allTasks = await db.select({ ownerId: tasks.ownerId }).from(tasks);
    const countMap: Record<string, number> = {};
    for (const t of allTasks) {
      countMap[t.ownerId] = (countMap[t.ownerId] || 0) + 1;
    }

    const withCounts = allUsers.map((u) => ({
      ...u,
      taskCount: countMap[u.id] || 0,
    }));

    return NextResponse.json(withCounts);
  } catch (error: any) {
    console.error("[GET /api/admin/users Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { name, email, password, role } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "name, email and password are required." }, { status: 400 });
    }
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const id = uuidv4();

    const [newUser] = await db
      .insert(users)
      .values({
        id,
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: role === "Admin" ? "Admin" : "Member",
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/admin/users Error]", error);
    return NextResponse.json({ error: error.message || "Failed to add user" }, { status: 500 });
  }
}
