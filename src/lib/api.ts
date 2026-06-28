export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  lastSeen?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  projectId: string;
  ownerId: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  status: "todo" | "doing" | "done";
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; name: string; email: string };
  project?: { id: string; name: string; hue: string };
  flagged?: boolean;
}

export interface ProjectItem {
  id: string;
  name: string;
  blurb: string;
  hue: string;
  createdBy: string;
  createdAt: string;
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    projectRole: string;
    lastSeen: string;
  }>;
  tasks: TaskItem[];
  pendingInvites: string[];
  openCount: number;
  totalTasks: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  icon: string;
  message: string;
  read: number;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  adminCount: number;
  totalProjects: number;
  totalTasks: number;
  openTasks: number;
  doneTasks: number;
  flagged: number;
}

export interface AdminUserItem extends AuthUser {
  createdAt: string;
  taskCount: number;
}

export interface FlaggedContentItem {
  id: string;
  content: string;
  taskId?: string;
  reporter: string;
  confidence: number;
  resolved: number;
  createdAt: string;
}

const BASE = "/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tf_token");
}

export function setToken(t: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("tf_token", t);
  }
}

export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("tf_token");
  }
}

async function request<T = any>(method: string, path: string, body: any = null): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;

  const opts: RequestInit = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(BASE + path, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }
  return data as T;
}

export const api = {
  getToken,
  setToken,
  clearToken,

  auth: {
    register: (body: any) => request<{ token: string; user: AuthUser }>("POST", "/auth/register", body),
    login: (body: any) => request<{ token: string; user: AuthUser }>("POST", "/auth/login", body),
    me: () => request<{ user: AuthUser }>("GET", "/auth/me"),
    resetRequest: (body: { email: string }) => request<{ message: string }>("POST", "/auth/reset-request", body),
    resetConfirm: (body: any) => request<{ message: string }>("POST", "/auth/reset-confirm", body),
  },

  tasks: {
    list: (query = "") => request<TaskItem[]>("GET", `/tasks${query ? "?" + query : ""}`),
    create: (body: any) => request<TaskItem>("POST", "/tasks", body),
    update: (id: string, body: any) => request<TaskItem>("PUT", `/tasks/${id}`, body),
    toggleStatus: (id: string, status?: string) => request<TaskItem>("PATCH", `/tasks/${id}/status`, { status }),
    delete: (id: string) => request<{ message: string }>("DELETE", `/tasks/${id}`),
  },

  projects: {
    list: () => request<ProjectItem[]>("GET", "/projects"),
    get: (id: string) => request<ProjectItem>("GET", `/projects/${id}`),
    create: (body: any) => request<ProjectItem>("POST", "/projects", body),
    update: (id: string, body: any) => request<ProjectItem>("PUT", `/projects/${id}`, body),
    delete: (id: string) => request<{ message: string }>("DELETE", `/projects/${id}`),
    invite: (id: string, body: { email: string }) => request<{ message: string }>("POST", `/projects/${id}/invite`, body),
    removeMember: (id: string, userId: string) => request<{ message: string }>("DELETE", `/projects/${id}/members/${userId}`),
    leave: (id: string) => request<{ message: string }>("DELETE", `/projects/${id}/leave`),
    acceptInvite: (body: { token: string }) => request<{ message: string; project: { id: string; name: string } }>("POST", "/invites/accept", body),
  },

  users: {
    list: () => request<AuthUser[]>("GET", "/users"),
    get: (id: string) => request<AuthUser>("GET", `/users/${id}`),
  },

  notifications: {
    list: () => request<NotificationItem[]>("GET", "/notifications"),
    readAll: () => request<{ message: string }>("PATCH", "/notifications/read-all"),
    dismiss: (id: string) => request<{ message: string }>("DELETE", `/notifications/${id}`),
  },

  admin: {
    stats: () => request<AdminStats>("GET", "/admin/stats"),
    users: () => request<AdminUserItem[]>("GET", "/admin/users"),
    addUser: (body: any) => request<AuthUser>("POST", "/admin/users", body),
    toggleRole: (id: string) => request<{ id: string; name: string; role: string }>("PATCH", `/admin/users/${id}/role`),
    removeUser: (id: string) => request<{ message: string }>("DELETE", `/admin/users/${id}`),
    flagged: () => request<FlaggedContentItem[]>("GET", "/admin/flagged"),
    approveFlag: (id: string) => request<{ message: string }>("PATCH", `/admin/flagged/${id}/approve`),
    removeFlag: (id: string) => request<{ message: string }>("DELETE", `/admin/flagged/${id}`),
  },
};
