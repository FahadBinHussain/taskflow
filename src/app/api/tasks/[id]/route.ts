import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, projectMembers, users, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });

    const [membership] = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, task.projectId), eq(projectMembers.userId, user.id)))
      .limit(1);

    if (!membership && user.role !== "Admin") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const body = await req.json();
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    // Only accept known fields; reject empty titles and invalid enums.
    if (body.title !== undefined) {
      if (!body.title.trim()) {
        return NextResponse.json({ error: "Task title cannot be empty." }, { status: 400 });
      }
      updateData.title = body.title.trim();
    }
    if (body.description !== undefined) updateData.description = body.description;
    if (body.project_id !== undefined) updateData.projectId = body.project_id;
    if (body.owner_id !== undefined) updateData.ownerId = body.owner_id;
    if (body.due_date !== undefined) updateData.dueDate = body.due_date;
    if (body.priority !== undefined) {
      const validPriorities = ["Low", "Medium", "High", "Urgent"];
      if (!validPriorities.includes(body.priority)) {
        return NextResponse.json({ error: "Invalid priority level." }, { status: 400 });
      }
      updateData.priority = body.priority;
    }
    if (body.status !== undefined) {
      const validStatuses = ["todo", "doing", "done"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: "Invalid task status." }, { status: 400 });
      }
      updateData.status = body.status;
    }

    const [updated] = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning();

    const [owner] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, updated.ownerId));

    const [project] = await db
      .select({ id: projects.id, name: projects.name, hue: projects.hue })
      .from(projects)
      .where(eq(projects.id, updated.projectId));

    return NextResponse.json({
      ...updated,
      owner: owner || { id: updated.ownerId, name: "Unknown", email: "" },
      project: project || { id: updated.projectId, name: "General", hue: "neutral" },
    });
  } catch (error: any) {
    console.error("[PUT /api/tasks/[id] Error]", error);
    return NextResponse.json({ error: error.message || "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });

    const [membership] = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, task.projectId), eq(projectMembers.userId, user.id)))
      .limit(1);

    if (!membership && user.role !== "Admin") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    await db.delete(tasks).where(eq(tasks.id, id));

    return NextResponse.json({ message: "Task deleted permanently.", id });
  } catch (error: any) {
    console.error("[DELETE /api/tasks/[id] Error]", error);
    return NextResponse.json({ error: error.message || "Failed to delete task" }, { status: 500 });
  }
}
