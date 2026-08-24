import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projectMembers, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Project creators must delete the project instead of leaving it memberless.
    const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (project && project.createdBy === user.id) {
      return NextResponse.json(
        { error: "As the creator, delete the project instead of leaving it." },
        { status: 400 }
      );
    }

    await db
      .delete(projectMembers)
      .where(and(eq(projectMembers.projectId, id), eq(projectMembers.userId, user.id)));

    return NextResponse.json({ message: "Left project." });
  } catch (error: any) {
    console.error("[Leave Project Error]", error);
    return NextResponse.json({ error: error.message || "Failed to leave project" }, { status: 500 });
  }
}
