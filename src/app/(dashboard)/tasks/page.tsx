"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api, TaskItem, ProjectItem, AuthUser } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { TaskModal } from "@/components/modals/TaskModal";
import { formatDueDate, isOverdue, cn } from "@/lib/utils";
import {
  List,
  Columns,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Pencil,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

function TasksContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<"list" | "board">("list");
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const { toast, toastError } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const params: string[] = [];
      if (priorityFilter) params.push(`priority=${priorityFilter}`);
      if (statusFilter && statusFilter !== "overdue") params.push(`status=${statusFilter}`);
      if (statusFilter === "overdue") params.push("overdue=true");
      if (searchQuery.trim()) params.push(`search=${encodeURIComponent(searchQuery.trim())}`);

      const [tList, pList, uList] = await Promise.all([
        api.tasks.list(params.join("&")),
        api.projects.list(),
        api.users.list(),
      ]);
      setTasks(tList);
      setProjects(pList);
      setUsers(uList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [priorityFilter, statusFilter, searchQuery]);

  const handleToggleStatus = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await api.tasks.toggleStatus(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err: any) {
      toastError(err.message || "Failed to update status");
    }
  };

  const handleDeleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.tasks.delete(id);
      toast("Task deleted.");
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      toastError(err.message || "Failed to delete task");
    }
  };

  const openCount = tasks.filter((t) => t.status !== "done").length;
  const hasActiveFilters = Boolean(priorityFilter || statusFilter || searchQuery);

  const resetFilters = () => {
    setPriorityFilter(null);
    setStatusFilter(null);
    setSearchQuery("");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">My tasks</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {openCount} open
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Organize, filter, and track all your team deliverables
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle switcher */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              title="Show tasks as a list"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition",
                view === "list" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setView("board")}
              aria-pressed={view === "board"}
              title="Show tasks as a kanban board"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition",
                view === "board" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New task</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
        <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>

        {/* Priority Chips */}
        {(["High", "Medium", "Low"] as const).map((p) => {
          const active = priorityFilter === p;
          return (
            <button
              key={p}
              onClick={() => setPriorityFilter(active ? null : p)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition",
                active
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm"
                  : "bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700"
              )}
            >
              {p} Priority
            </button>
          );
        })}

        <span className="text-slate-700 mx-1">|</span>

        {/* Status Chips */}
        {[
          { key: "todo", label: "To Do" },
          { key: "doing", label: "In Progress" },
          { key: "done", label: "Completed" },
          { key: "overdue", label: "Overdue" },
        ].map((s) => {
          const active = statusFilter === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setStatusFilter(active ? null : s.key)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition",
                active
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm"
                  : "bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700"
              )}
            >
              {s.label}
            </button>
          );
        })}

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 ml-2 transition"
          >
            <X className="w-3.5 h-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {/* Main View Area */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <span className="text-xs">Fetching tasks...</span>
        </div>
      ) : view === "list" ? (
        /* List / Table View */
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          {tasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Task</th>
                    <th className="py-3.5 px-4">Project</th>
                    <th className="py-3.5 px-4">Owner</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Due</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {tasks.map((t) => {
                    const isDone = t.status === "done";
                    const dueInfo = formatDueDate(t.dueDate, t.status);

                    return (
                      <tr
                        key={t.id}
                        onClick={() => {
                          setEditingTask(t);
                          setIsModalOpen(true);
                        }}
                        className={cn(
                          "hover:bg-slate-800/40 cursor-pointer transition group",
                          isDone && "opacity-60 bg-slate-950/20"
                        )}
                      >
                        {/* Task checkbox & title */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => handleToggleStatus(t.id, e)}
                              className={cn(
                                "w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0",
                                isDone
                                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                  : "border-slate-700 hover:border-indigo-500 text-transparent hover:text-indigo-400/40"
                              )}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <span
                              className={cn(
                                "font-medium text-slate-200 group-hover:text-white transition",
                                isDone && "line-through text-slate-500"
                              )}
                            >
                              {t.title}
                            </span>
                          </div>
                        </td>

                        {/* Project name */}
                        <td className="py-3.5 px-4 text-slate-400 text-xs font-medium">
                          {t.project?.name || "General"}
                        </td>

                        {/* Assignee Avatar & name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <Avatar name={t.owner?.name} size="xs" />
                            <span className="text-xs text-slate-300">
                              {t.owner?.name || "Unassigned"}
                            </span>
                          </div>
                        </td>

                        {/* Priority Badge */}
                        <td className="py-3.5 px-4">
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
                        </td>

                        {/* Due Date Tag */}
                        <td className="py-3.5 px-4">
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
                        </td>

                        {/* Row Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTask(t);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteTask(t.id, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-slate-400 space-y-3">
              <CheckCircle2 className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              {hasActiveFilters ? (
                <>
                  <p>No tasks found matching your filter criteria.</p>
                  <button
                    onClick={resetFilters}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition"
                  >
                    Clear all filters
                  </button>
                </>
              ) : (
                <p>No tasks yet. Create your first task to get started.</p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { key: "todo", label: "To Do", dot: "bg-amber-400" },
            { key: "doing", label: "In Progress", dot: "bg-sky-400" },
            { key: "done", label: "Completed", dot: "bg-emerald-400" },
          ].map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);

            return (
              <div
                key={col.key}
                className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 flex flex-col h-full space-y-3"
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", col.dot)} />
                    <span className="font-semibold text-sm text-white">{col.label}</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                  {colTasks.map((t) => {
                    const dueInfo = formatDueDate(t.dueDate, t.status);

                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setEditingTask(t);
                          setIsModalOpen(true);
                        }}
                        className="p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition shadow-sm space-y-3 group"
                      >
                        <h4 className="text-sm font-medium text-slate-200 group-hover:text-white leading-snug">
                          {t.title}
                        </h4>

                        <div className="flex items-center gap-2 flex-wrap">
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
                        </div>

                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                          <span className="truncate max-w-[140px] font-medium">
                            {t.project?.name || "General"}
                          </span>
                          <Avatar name={t.owner?.name} size="xs" />
                        </div>
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl">
                      Empty column
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setEditingTask({ status: col.key as any } as any);
                    setIsModalOpen(true);
                  }}
                  className="w-full py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-indigo-300 hover:bg-slate-800/60 transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add task</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        projects={projects}
        users={users}
        onSuccess={loadData}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading tasks...</div>}>
      <TasksContent />
    </Suspense>
  );
}
