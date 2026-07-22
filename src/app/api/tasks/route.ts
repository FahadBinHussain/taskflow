import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, projectMembers, users, projects, notifications, flaggedContent } from "@/db/schema";
import { eq, and, inArray, ilike, lt, ne, desc, asc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getAuthenticatedUser } from "@/lib/auth";
import { checkSpam } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const priority = searchParams.get("priority");
    const status = searchParams.get("status");
    const projectId = searchParams.get("project_id");
    const search = searchParams.get("search");
    const overdue = searchParams.get("overdue");

    // Fetch projects user is a member of
    const memberships = await db
      .select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(eq(projectMembers.userId, user.id));

    const memberProjectIds = memberships.map((m) => m.projectId);
    if (memberProjectIds.length === 0) {
      return NextResponse.json([]);
    }

    const conditions: any[] = [inArray(tasks.projectId, memberProjectIds)];

    if (priority) {
      conditions.push(eq(tasks.priority, priority));
    }
    if (status && status !== "overdue") {
      conditions.push(eq(tasks.status, status));
    }
    if (projectId) {
      conditions.push(eq(tasks.projectId, projectId));
    }
    if (search) {
      conditions.push(ilike(tasks.title, `%${search}%`));
    }
    if (overdue === "true") {
      const today = new Date().toISOString().split("T")[0];
      conditions.push(ne(tasks.status, "done"));
      conditions.push(lt(tasks.dueDate, today));
    }

    const rawTasks = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(asc(tasks.dueDate), desc(tasks.createdAt));

    if (rawTasks.length === 0) return NextResponse.json([]);

    // Enrich with owner and project
    const allUsers = await db.select({ id: users.id, name: users.name, email: users.email }).from(users);
    const allProjects = await db.select({ id: projects.id, name: projects.name, hue: projects.hue }).from(projects);

    const userMap = new Map(allUsers.map((u) => [u.id, u]));
    const projectMap = new Map(allProjects.map((p) => [p.id, p]));

    const enriched = rawTasks.map((t) => ({
      ...t,
      owner: userMap.get(t.ownerId) || { id: t.ownerId, name: "Unknown", email: "" },
      project: projectMap.get(t.projectId) || { id: t.projectId, name: "General", hue: "neutral" },
    }));

    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error("[GET /api/tasks Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, description, project_id, owner_id, due_date, priority, status } = body;

    if (!title || !title.trim() || !project_id || !due_date) {
      return NextResponse.json({ error: "title, project_id and due_date are required." }, { status: 400 });
    }

    // Guard against unsupported priority/status values slipping into the db.
    const validPriorities = ["Low", "Medium", "High", "Urgent"];
    const validStatuses = ["todo", "doing", "done"];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: "Invalid priority level." }, { status: 400 });
    }
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid task status." }, { status: 400 });
    }

    // Verify membership
    const [membership] = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, project_id), eq(projectMembers.userId, user.id)))
      .limit(1);

    if (!membership && user.role !== "Admin") {
      return NextResponse.json({ error: "Not a member of this project." }, { status: 403 });
    }

    const spamCheck = checkSpam(`${title} ${description || ""}`);
    const id = uuidv4();
    const assignee = owner_id || user.id;

    const [newTask] = await db
      .insert(tasks)
      .values({
        id,
        title: title.trim(),
        description: description || "",
        projectId: project_id,
        ownerId: assignee,
        dueDate: due_date,
        priority: priority || "Medium",
        status: status || "todo",
      })
      .returning();

    // Spam flagging
    if (spamCheck.isSpam) {
      await db.insert(flaggedContent).values({
        id: uuidv4(),
        content: `Task "${title}" flagged (${spamCheck.matches.join(", ")})`,
        taskId: id,
        confidence: spamCheck.confidence,
        resolved: 0,
      });
    }

    // Notification to assignee
    if (assignee !== user.id) {
      await db.insert(notifications).values({
        id: uuidv4(),
        userId: assignee,
        type: "assignment",
        icon: "check-square",
        message: `${user.name} assigned you "${title}"`,
      });
    }

    // Fetch relations
    const [owner] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, newTask.ownerId));

    const [project] = await db
      .select({ id: projects.id, name: projects.name, hue: projects.hue })
      .from(projects)
      .where(eq(projects.id, newTask.projectId));

    return NextResponse.json(
      {
        ...newTask,
        owner: owner || { id: newTask.ownerId, name: "Unknown", email: "" },
        project: project || { id: newTask.projectId, name: "General", hue: "neutral" },
        flagged: spamCheck.isSpam,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[POST /api/tasks Error]", error);
    return NextResponse.json({ error: error.message || "Failed to create task" }, { status: 500 });
  }
}
