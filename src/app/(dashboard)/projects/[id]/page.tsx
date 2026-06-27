"use client";

import React, { useState, useEffect, use } from "react";
import { api, ProjectItem, TaskItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { TaskModal } from "@/components/modals/TaskModal";
import { InviteModal } from "@/components/modals/InviteModal";
import { formatDueDate, isOverdue, cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  UserPlus,
  LogOut,
  Plus,
  CheckCircle2,
  Calendar,
  Pencil,
  Trash2,
  Clock,
  X,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { toast, toastError } = useToast();

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await api.projects.get(id);
      setProject(data);
    } catch (err: any) {
      toastError(err.message || "Failed to load project");
      router.push("/projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  const handleToggleTaskStatus = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await api.tasks.toggleStatus(taskId);
      setProject((prev) => {
        if (!prev) return prev;
        const newTasks = prev.tasks.map((t) => (t.id === taskId ? updated : t));
        const openCount = newTasks.filter((t) => t.status !== "done").length;
        return { ...prev, tasks: newTasks, openCount };
      });
    } catch (err: any) {
      toastError(err.message || "Failed to toggle status");
    }
  };

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.tasks.delete(taskId);
      toast("Task deleted.");
      loadProject();
    } catch (err: any) {
      toastError(err.message || "Failed to delete task");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Remove this teammate from the project?")) return;
    try {
      await api.projects.removeMember(id, userId);
      toast("Member removed.");
      loadProject();
    } catch (err: any) {
      toastError(err.message || "Failed to remove member");
    }
  };

  const handleLeaveProject = async () => {
    if (!confirm("Are you sure you want to leave this project?")) return;
    try {
      await api.projects.leave(id);
      toast("You left the project.");
      router.push("/projects");
    } catch (err: any) {
      toastError(err.message || "Failed to leave project");
    }
  };

  if (loading || !project) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-2 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-sm">Loading project workspace...</span>
      </div>
    );
  }

  const doneCount = project.tasks.filter((t) => t.status === "done").length;
  const pct = project.totalTasks ? Math.round((doneCount / project.totalTasks) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
            <FolderKanban className="w-4 h-4" />
            <span>Project Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{project.name}</h1>
          <p className="text-sm text-slate-400 max-w-2xl">{project.blurb || "No description provided."}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLeaveProject}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 hover:border-rose-900/50 transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Tasks List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Tasks</h2>
            <span className="text-xs text-slate-400 font-medium">
              {project.openCount} open · {project.totalTasks} total
            </span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm space-y-3">
            {project.tasks.length > 0 ? (
              project.tasks.map((t) => {
                const isDone = t.status === "done";
                const dueInfo = formatDueDate(t.dueDate, t.status);
                const owner = project.members.find((m) => m.id === t.ownerId);

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setEditingTask(t);
                      setIsTaskModalOpen(true);
                    }}
                    className={cn(
                      "group p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700/80 flex items-center justify-between gap-3 cursor-pointer transition shadow-sm",
                      isDone && "opacity-60 bg-slate-950/20"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={(e) => handleToggleTaskStatus(t.id, e)}
                        className={cn(
                          "w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0",
                          isDone
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                            : "border-slate-700 hover:border-indigo-500 text-transparent hover:text-indigo-400/40"
                        )}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="min-w-0">
                        <h4
                          className={cn(
                            "text-sm font-medium text-slate-200 group-hover:text-white truncate transition",
                            isDone && "line-through text-slate-500"
                          )}
                        >
                          {t.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 truncate">
                          <span>{owner?.name || "Unassigned"}</span>
                          <span>•</span>
                          <span>{t.dueDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          t.priority === "High"
                            ? "danger"
                            : t.priority === "Medium"
                            ? "warning"
                            : "neutral"
                        }
                      >
                        {t.priority}
                      </Badge>
                      <Badge
                        variant={
                          dueInfo.tone === "danger"
                            ? "danger"
                            : dueInfo.tone === "warning"
                            ? "warning"
                            : dueInfo.tone === "accent"
                            ? "accent"
                            : "neutral"
                        }
                      >
                        <Calendar className="w-3 h-3" />
                        {dueInfo.label}
                      </Badge>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition ml-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTask(t);
                            setIsTaskModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteTask(t.id, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No tasks created for this project yet.
              </div>
            )}

            <button
              onClick={() => {
                setEditingTask({ projectId: project.id } as any);
                setIsTaskModalOpen(true);
              }}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/10 text-xs font-semibold text-slate-400 hover:text-indigo-300 transition flex items-center justify-center gap-2 mt-3"
            >
              <Plus className="w-4 h-4" />
              <span>Add task to project</span>
            </button>
          </div>
        </div>

        {/* Right Column: Members & Progress */}
        <div className="lg:col-span-4 space-y-6">
          {/* Progress Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-semibold text-sm text-white">Project Velocity</h3>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                {doneCount} of {project.tasks.length} done
              </span>
              <span className="font-semibold text-indigo-400">{pct}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Members Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-white">Team Members</h3>
              <span className="text-xs text-slate-400 font-medium">{project.members.length}</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {project.members.map((m) => (
                <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={m.name} size="sm" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{m.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{m.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={m.projectRole === "Admin" ? "admin" : "member"}>
                      {m.projectRole}
                    </Badge>
                    {m.id !== user?.id && (
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Remove member"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {project.pendingInvites && project.pendingInvites.length > 0 && (
              <div className="pt-3 border-t border-slate-800/60 space-y-2">
                <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {project.pendingInvites.length} pending invite
                  {project.pendingInvites.length > 1 ? "s" : ""}
                </span>
                <div className="text-xs text-slate-400 truncate">
                  {project.pendingInvites.join(", ")}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task and Invite Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        projects={[project]}
        users={project.members}
        onSuccess={loadProject}
      />

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
        onSuccess={loadProject}
      />
    </div>
  );
}
