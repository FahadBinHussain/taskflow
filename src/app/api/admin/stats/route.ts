import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, projects, tasks, flaggedContent } from "@/db/schema";
import { eq, ne } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const allUsers = await db.select().from(users);
    const allProjects = await db.select().from(projects);
    const allTasks = await db.select().from(tasks);
    const flagged = await db.select().from(flaggedContent).where(eq(flaggedContent.resolved, 0));

    const totalUsers = allUsers.length;
    const adminCount = allUsers.filter((u) => u.role === "Admin").length;
    const memberCount = totalUsers - adminCount;
    const totalProjects = allProjects.length;
    const totalTasks = allTasks.length;
    const openTasks = allTasks.filter((t) => t.status !== "done").length;
    const doneTasks = totalTasks - openTasks;
    const completionRate = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

    return NextResponse.json({
      totalUsers,
      adminCount,
      memberCount,
      totalProjects,
      totalTasks,
      openTasks,
      doneTasks,
      completionRate,
      flagged: flagged.length,
    });
  } catch (error: any) {
    console.error("[GET /api/admin/stats Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch stats" }, { status: 500 });
  }
}
