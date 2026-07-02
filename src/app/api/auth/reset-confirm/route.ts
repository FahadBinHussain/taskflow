import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResets } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";

// Minimum accepted length for a new password chosen via reset link.
const MIN_PASSWORD_LENGTH = 6;

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: "Valid token and password (6+ characters) required." }, { status: 400 });
    }

    const [reset] = await db
      .select()
      .from(passwordResets)
      .where(
        and(
          eq(passwordResets.token, token),
          eq(passwordResets.used, 0),
          gt(passwordResets.expiresAt, new Date().toISOString())
        )
      )
      .limit(1);

    if (!reset) {
      return NextResponse.json({ error: "Reset link is invalid or has expired." }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, reset.userId));
    await db.update(passwordResets).set({ used: 1 }).where(eq(passwordResets.id, reset.id));

    return NextResponse.json({ message: "Password updated successfully. You can now sign in." });
  } catch (error: any) {
    console.error("[Reset Confirm Error]", error);
    return NextResponse.json({ error: error.message || "Failed to reset password" }, { status: 500 });
  }
}
