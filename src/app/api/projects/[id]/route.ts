import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, projectMembers, tasks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { enrichProject } from "../route";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const enriched = await enrichProject(project);
    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error("[GET /api/projects/[id] Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch project" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    if (project.createdBy !== user.id && user.role !== "Admin") {
      return NextResponse.json({ error: "Only the creator or workspace admin can edit this project." }, { status: 403 });
    }

    const body = await req.json();
    const updateData: any = {};
    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json({ error: "Project name cannot be empty." }, { status: 400 });
      }
      updateData.name = body.name.trim().slice(0, 80);
    }
    if (body.blurb !== undefined) updateData.blurb = body.blurb.trim().slice(0, 200);
    if (body.hue !== undefined) updateData.hue = body.hue;

    const [updated] = await db.update(projects).set(updateData).where(eq(projects.id, id)).returning();
    const enriched = await enrichProject(updated);
    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error("[PUT /api/projects/[id] Error]", error);
    return NextResponse.json({ error: error.message || "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    if (project.createdBy !== user.id && user.role !== "Admin") {
      return NextResponse.json({ error: "Only the creator or workspace admin can delete this project." }, { status: 403 });
    }

    await db.delete(tasks).where(eq(tasks.projectId, id));
    await db.delete(projectMembers).where(eq(projectMembers.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));

    return NextResponse.json({ message: "Project deleted." });
  } catch (error: any) {
    console.error("[DELETE /api/projects/[id] Error]", error);
    return NextResponse.json({ error: error.message || "Failed to delete project" }, { status: 500 });
  }
}
