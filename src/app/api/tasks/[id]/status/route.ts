import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, projectMembers, notifications, users, projects } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * PATCH /api/tasks/[id]/status
 * Sets an explicit status when `body.status` is valid, otherwise toggles
 * between done and doing. Completing a task notifies other project members.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const body = await req.json().catch(() => ({}));
    const validStatuses = ["todo", "doing", "done"];
    const requestedStatus = body.status;

    // Reject unknown status values instead of writing them to the db.
    if (requestedStatus !== undefined && !validStatuses.includes(requestedStatus)) {
      return NextResponse.json({ error: "Invalid task status." }, { status: 400 });
    }

    const newStatus = requestedStatus || (task.status === "done" ? "doing" : "done");

    const [updated] = await db
      .update(tasks)
      .set({
        status: newStatus,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tasks.id, id))
      .returning();

    // If marked done, notify other project members
    if (newStatus === "done") {
      const otherMembers = await db
        .select({ userId: projectMembers.userId })
        .from(projectMembers)
        .where(and(eq(projectMembers.projectId, task.projectId), ne(projectMembers.userId, user.id)));

      for (const m of otherMembers) {
        await db.insert(notifications).values({
          id: uuidv4(),
          userId: m.userId,
          type: "completion",
          icon: "check-circle",
          message: `${user.name} completed "${task.title}"`,
        });
      }
    }

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
    console.error("[PATCH /api/tasks/[id]/status Error]", error);
    return NextResponse.json({ error: error.message || "Failed to update task status" }, { status: 500 });
  }
}
