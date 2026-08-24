import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projectMembers, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, userId } = await params;

    const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    const [requesterMembership] = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, id), eq(projectMembers.userId, user.id)))
      .limit(1);

    if (!requesterMembership && user.role !== "Admin") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    // Creators can't be removed by others; they must delete the project instead.
    if (project.createdBy === userId && project.createdBy !== user.id && user.role !== "Admin") {
      return NextResponse.json({ error: "The project creator cannot be removed." }, { status: 403 });
    }

    await db
      .delete(projectMembers)
      .where(and(eq(projectMembers.projectId, id), eq(projectMembers.userId, userId)));

    return NextResponse.json({ message: "Member removed from project.", userId });
  } catch (error: any) {
    console.error("[DELETE Member Error]", error);
    return NextResponse.json({ error: error.message || "Failed to remove member" }, { status: 500 });
  }
}
