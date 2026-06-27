import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, projectMembers, users, tasks, projectInvites } from "@/db/schema";
import { eq, desc, inArray, and, gt } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getAuthenticatedUser } from "@/lib/auth";

export async function enrichProject(project: any) {
  // Members
  const memberList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      projectRole: projectMembers.role,
      lastSeen: users.lastSeen,
    })
    .from(projectMembers)
    .innerJoin(users, eq(users.id, projectMembers.userId))
    .where(eq(projectMembers.projectId, project.id));

  // Tasks
  const taskList = await db.select().from(tasks).where(eq(tasks.projectId, project.id));

  // Pending invites
  const invites = await db
    .select({ email: projectInvites.email })
    .from(projectInvites)
    .where(
      and(
        eq(projectInvites.projectId, project.id),
        eq(projectInvites.accepted, 0),
        gt(projectInvites.expiresAt, new Date().toISOString())
      )
    );

  const openCount = taskList.filter((t) => t.status !== "done").length;

  return {
    ...project,
    members: memberList,
    tasks: taskList,
    pendingInvites: invites.map((i) => i.email),
    openCount,
    totalTasks: taskList.length,
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let userProjects: any[] = [];
    if (user.role === "Admin") {
      userProjects = await db.select().from(projects).orderBy(desc(projects.createdAt));
    } else {
      const memberships = await db
        .select({ projectId: projectMembers.projectId })
        .from(projectMembers)
        .where(eq(projectMembers.userId, user.id));

      const pIds = memberships.map((m) => m.projectId);
      if (pIds.length === 0) return NextResponse.json([]);

      userProjects = await db
        .select()
        .from(projects)
        .where(inArray(projects.id, pIds))
        .orderBy(desc(projects.createdAt));
    }

    const enriched = await Promise.all(userProjects.map((p) => enrichProject(p)));
    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error("[GET /api/projects Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, blurb, hue } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Project name is required." }, { status: 400 });
    }

    const id = uuidv4();
    const [newProject] = await db
      .insert(projects)
      .values({
        id,
        name: name.trim(),
        blurb: blurb || "",
        hue: hue || "accent",
        createdBy: user.id,
      })
      .returning();

    // Add creator as Admin in project_members
    await db.insert(projectMembers).values({
      id: uuidv4(),
      projectId: id,
      userId: user.id,
      role: "Admin",
    });

    const enriched = await enrichProject(newProject);
    return NextResponse.json(enriched, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/projects Error]", error);
    return NextResponse.json({ error: error.message || "Failed to create project" }, { status: 500 });
  }
}
