import {
  pgTable,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

// ── Users ────────────────────────────────────────────────
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("Member"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  lastSeen: timestamp("last_seen", { mode: "string" }).notNull().defaultNow(),
});

// ── Password Resets ──────────────────────────────────────
export const passwordResets = pgTable("password_resets", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
  used: integer("used").notNull().default(0),
});

// ── Projects ─────────────────────────────────────────────
export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  blurb: text("blurb").notNull().default(""),
  hue: text("hue").notNull().default("accent"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
});

// ── Project Members ──────────────────────────────────────
export const projectMembers = pgTable("project_members", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  userId: text("user_id").notNull(),
  role: text("role").notNull().default("Member"),
  joinedAt: timestamp("joined_at", { mode: "string" }).notNull().defaultNow(),
});

// ── Project Invites ──────────────────────────────────────
export const projectInvites = pgTable("project_invites", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  email: text("email").notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
  accepted: integer("accepted").notNull().default(0),
});

// ── Tasks ────────────────────────────────────────────────
export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  projectId: text("project_id").notNull(),
  ownerId: text("owner_id").notNull(),
  dueDate: text("due_date").notNull(),
  priority: text("priority").notNull().default("Medium"),
  status: text("status").notNull().default("todo"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

// ── Notifications ────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull().default("info"),
  icon: text("icon").notNull().default("bell"),
  message: text("message").notNull(),
  read: integer("read").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
});

// ── Flagged Content ──────────────────────────────────────
export const flaggedContent = pgTable("flagged_content", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  taskId: text("task_id"),
  reporter: text("reporter").notNull().default("system"),
  confidence: integer("confidence").notNull().default(0),
  resolved: integer("resolved").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type FlaggedItem = typeof flaggedContent.$inferSelect;
