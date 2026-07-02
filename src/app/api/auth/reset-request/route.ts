import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { sendPasswordResetEmail, normalizeEmail } from "@/lib/email";

// Reset tokens stay valid for 30 minutes after issue.
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);
    const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

    // Prevent email enumeration: always return success message
    if (user) {
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

      await db.insert(passwordResets).values({
        id: uuidv4(),
        userId: user.id,
        token,
        expiresAt,
        used: 0,
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const link = `${appUrl}/reset?token=${token}`;
      await sendPasswordResetEmail(user.email, user.name, link);
    }

    return NextResponse.json({ message: "If that email exists, a password reset link has been sent." });
  } catch (error: any) {
    console.error("[Reset Request Error]", error);
    return NextResponse.json({ error: error.message || "Failed to process reset request" }, { status: 500 });
  }
}
