import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projectInvites, projectMembers, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Token is required." }, { status: 400 });
    }

    const [invite] = await db
      .select()
      .from(projectInvites)
      .where(eq(projectInvites.token, token))
      .limit(1);

    if (!invite) {
      return NextResponse.json({ error: "Invite not found." }, { status: 404 });
    }

    if (invite.accepted) {
      return NextResponse.json({ error: "Invite already accepted." }, { status: 409 });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Invite has expired." }, { status: 410 });
    }

    if (invite.email !== user.email) {
      return NextResponse.json({ error: "This invite was sent to a different email address." }, { status: 403 });
    }

    const [existing] = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, invite.projectId), eq(projectMembers.userId, user.id)))
      .limit(1);

    if (!existing) {
      await db.insert(projectMembers).values({
        id: uuidv4(),
        projectId: invite.projectId,
        userId: user.id,
        role: "Member",
      });
    }

    await db
      .update(projectInvites)
      .set({ accepted: 1 })
      .where(eq(projectInvites.id, invite.id));

    const [project] = await db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(eq(projects.id, invite.projectId))
      .limit(1);

    return NextResponse.json({
      message: "You have joined the project!",
      project: project || { id: invite.projectId, name: "Project" },
    });
  } catch (error: any) {
    console.error("[POST /api/invites/accept Error]", error);
    return NextResponse.json({ error: error.message || "Failed to accept invite" }, { status: 500 });
  }
}