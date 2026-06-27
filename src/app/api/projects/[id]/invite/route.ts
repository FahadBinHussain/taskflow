import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, projectMembers, users, projectInvites } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getAuthenticatedUser } from "@/lib/auth";
import { sendProjectInviteEmail } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    const [membership] = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, id), eq(projectMembers.userId, user.id)))
      .limit(1);

    if (!membership && user.role !== "Admin") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user is already a member
    const [existingUser] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (existingUser) {
      const [alreadyMember] = await db
        .select()
        .from(projectMembers)
        .where(and(eq(projectMembers.projectId, id), eq(projectMembers.userId, existingUser.id)))
        .limit(1);

      if (alreadyMember) {
        return NextResponse.json({ error: "User is already a project member." }, { status: 409 });
      }
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

    await db.insert(projectInvites).values({
      id: uuidv4(),
      projectId: id,
      email: normalizedEmail,
      token,
      expiresAt,
      accepted: 0,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${appUrl}/join?token=${token}`;
    await sendProjectInviteEmail(normalizedEmail, user.name, project.name, inviteLink);

    return NextResponse.json({ message: "Invite sent successfully." });
  } catch (error: any) {
    console.error("[POST /api/projects/[id]/invite Error]", error);
    return NextResponse.json({ error: error.message || "Failed to send invite" }, { status: 500 });
  }
}
