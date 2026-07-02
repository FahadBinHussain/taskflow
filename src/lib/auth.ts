import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_taskflow_app_key_2026";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"];

export interface JWTPayload {
  id: string;
  role: string;
}

/** Sign a session JWT for the given user id and role. */
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a session JWT. Returns the payload, or null when
 * the token is missing, malformed, or expired.
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/** Hash a plaintext password with bcrypt (cost 10). */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/** Compare a plaintext password against a stored bcrypt hash. */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload || !payload.id) {
    return null;
  }

  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        lastSeen: users.lastSeen,
      })
      .from(users)
      .where(eq(users.id, payload.id))
      .limit(1);

    if (user) {
      // Update last seen
      await db
        .update(users)
        .set({ lastSeen: new Date().toISOString() })
        .where(eq(users.id, user.id))
        .catch(() => {});
    }

    return user || null;
  } catch (err) {
    console.error("[Auth] Error fetching user:", err);
    return null;
  }
}
