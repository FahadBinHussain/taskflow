import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Cannot run seed.");
  process.exit(1);
}

const sql = neon(connectionString);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("🌱 Starting TaskFlow database seeding...");

  const hash = await bcrypt.hash("taskflow123", 10);

  // 1. Clear existing records (optional, in order)
  console.log("Cleaning up old seed data...");
  try {
    await db.delete(schema.notifications);
    await db.delete(schema.flaggedContent);
    await db.delete(schema.tasks);
    await db.delete(schema.projectInvites);
    await db.delete(schema.projectMembers);
    await db.delete(schema.projects);
    await db.delete(schema.passwordResets);
    await db.delete(schema.users);
  } catch (e) {
    console.log("Tables might be freshly created, proceeding...");
  }

  // 2. Create users
  console.log("Creating users...");
  const adminId = uuidv4();
  const alexId = uuidv4();
  const samId = uuidv4();
  const morganId = uuidv4();
  const taylorId = uuidv4();

  await db.insert(schema.users).values([
    {
      id: adminId,
      name: "Admin User",
      email: "admin@taskflow.app",
      password: hash,
      role: "Admin",
    },
    {
      id: alexId,
      name: "Alex Rivera",
      email: "alex@taskflow.app",
      password: hash,
      role: "Member",
    },
    {
      id: samId,
      name: "Sam Chen",
      email: "sam@taskflow.app",
      password: hash,
      role: "Member",
    },
    {
      id: morganId,
      name: "Morgan Taylor",
      email: "morgan@taskflow.app",
      password: hash,
      role: "Member",
    },
    {
      id: taylorId,
      name: "Taylor Brooks",
      email: "taylor@taskflow.app",
      password: hash,
      role: "Member",
    },
  ]);

  // 3. Create projects
  console.log("Creating projects...");
  const p1Id = uuidv4();
  const p2Id = uuidv4();
  const p3Id = uuidv4();
  const p4Id = uuidv4();

  await db.insert(schema.projects).values([
    {
      id: p1Id,
      name: "Product Redesign",
      blurb: "Next-gen UI and design system overhaul with modern micro-interactions.",
      hue: "accent",
      createdBy: adminId,
    },
    {
      id: p2Id,
      name: "Core API Migration",
      blurb: "Migrate backend database layer to Neon Serverless Postgres and Drizzle ORM.",
      hue: "accent2",
      createdBy: alexId,
    },
    {
      id: p3Id,
      name: "Mobile App Launch",
      blurb: "iOS and Android client rollout for cross-platform team agility.",
      hue: "neutral",
      createdBy: samId,
    },
    {
      id: p4Id,
      name: "Marketing & Growth",
      blurb: "Q3 Acquisition funnel optimization and analytics tracking.",
      hue: "accent",
      createdBy: morganId,
    },
  ]);

  // 4. Create project members
  console.log("Adding project members...");
  const memberList = [
    { pId: p1Id, uId: adminId, role: "Admin" },
    { pId: p1Id, uId: alexId, role: "Member" },
    { pId: p1Id, uId: samId, role: "Member" },
    { pId: p2Id, uId: alexId, role: "Admin" },
    { pId: p2Id, uId: samId, role: "Member" },
    { pId: p2Id, uId: adminId, role: "Member" },
    { pId: p3Id, uId: samId, role: "Admin" },
    { pId: p3Id, uId: taylorId, role: "Member" },
    { pId: p3Id, uId: morganId, role: "Member" },
    { pId: p4Id, uId: morganId, role: "Admin" },
    { pId: p4Id, uId: taylorId, role: "Member" },
    { pId: p4Id, uId: adminId, role: "Member" },
  ];

  for (const m of memberList) {
    await db.insert(schema.projectMembers).values({
      id: uuidv4(),
      projectId: m.pId,
      userId: m.uId,
      role: m.role,
    });
  }

  // 5. Create tasks
  console.log("Seeding sample tasks...");
  const today = new Date();
  const addDays = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().split("T")[0];
  };

  const sampleTasks = [
    {
      title: "Audit color tokens and contrast ratios",
      description: "Ensure all dark mode palettes comply with WCAG AA accessibility standards.",
      projectId: p1Id,
      ownerId: alexId,
      dueDate: addDays(1),
      priority: "High",
      status: "doing",
    },
    {
      title: "Implement Drizzle ORM schema models",
      description: "Define relations, indexes, and type-safe schema definitions.",
      projectId: p2Id,
      ownerId: samId,
      dueDate: addDays(2),
      priority: "High",
      status: "todo",
    },
    {
      title: "Configure Neon database connection pooling",
      description: "Verify serverless websocket and http endpoints for edge compatibility.",
      projectId: p2Id,
      ownerId: alexId,
      dueDate: addDays(-1),
      priority: "Medium",
      status: "todo",
    },
    {
      title: "Design mobile bottom navigation sheet",
      description: "Create fluid swipe-to-dismiss gesture handling for task drawers.",
      projectId: p3Id,
      ownerId: taylorId,
      dueDate: addDays(3),
      priority: "Medium",
      status: "todo",
    },
    {
      title: "Publish release changelog for v2.0",
      description: "Highlight TypeScript migration, Neon DB speedups, and responsive UI.",
      projectId: p4Id,
      ownerId: morganId,
      dueDate: addDays(-2),
      priority: "Low",
      status: "done",
    },
    {
      title: "Set up Vercel CI/CD pipeline",
      description: "Ensure automated branch previews, linting, and database migration checks.",
      projectId: p1Id,
      ownerId: adminId,
      dueDate: addDays(0),
      priority: "High",
      status: "doing",
    },
  ];

  for (const t of sampleTasks) {
    await db.insert(schema.tasks).values({
      id: uuidv4(),
      title: t.title,
      description: t.description,
      projectId: t.projectId,
      ownerId: t.ownerId,
      dueDate: t.dueDate,
      priority: t.priority,
      status: t.status,
    });
  }

  // 6. Create sample notifications
  console.log("Seeding sample notifications...");
  await db.insert(schema.notifications).values([
    {
      id: uuidv4(),
      userId: adminId,
      type: "info",
      icon: "bell",
      message: "Welcome to TaskFlow! Your workspace is ready.",
      read: 0,
    },
    {
      id: uuidv4(),
      userId: adminId,
      type: "assignment",
      icon: "check-square",
      message: "Alex Rivera assigned you 'Set up Vercel CI/CD pipeline'",
      read: 0,
    },
  ]);

  console.log("✅ Seeding completed successfully!");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
