import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const id = uuidv4();

    // Check if first user, make admin if none exists
    const allUsers = await db.select({ id: users.id }).from(users).limit(2);
    const role = allUsers.length === 0 ? "Admin" : "Member";

    const [newUser] = await db
      .insert(users)
      .values({
        id,
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      });

    const token = signToken({ id: newUser.id, role: newUser.role });

    return NextResponse.json({ token, user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error("[Register Error]", error);
    return NextResponse.json({ error: error.message || "Failed to register" }, { status: 500 });
  }
}
