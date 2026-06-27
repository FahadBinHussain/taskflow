"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, TaskItem, ProjectItem } from "@/lib/api";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { TaskModal } from "@/components/modals/TaskModal";
import { ProjectModal } from "@/components/modals/ProjectModal";
import { formatDueDate, isOverdue, cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  Clock,
  Plus,
  ArrowRight,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Task modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tList, pList] = await Promise.all([api.tasks.list(), api.projects.list()]);
      setTasks(tList);
      setProjects(pList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleRefresh = () => loadData();
    window.addEventListener("taskflow:refresh", handleRefresh);
    return () => window.removeEventListener("taskflow:refresh", handleRefresh);
  }, []);

  const handleToggleTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await api.tasks.toggleStatus(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (e) {
      console.error(e);
    }
  };

  const doneTasks = tasks.filter((t) => t.status === "done");
  const openTasks = tasks.filter((t) => t.status !== "done");
  const overdueTasks = tasks.filter((t) => isOverdue(t.dueDate, t.status));
  const completionPct = tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] || "there";

  const dueSoonTasks = [...openTasks]
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 6);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-sm">Loading dashboard metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {overdueTasks.length > 0
              ? `${overdueTasks.length} task${overdueTasks.length > 1 ? "s" : ""} need attention. ${openTasks.length} total open tasks.`
              : `All deadlines are on track! You have ${openTasks.length} open task${openTasks.length === 1 ? "" : "s"}.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New task</span>
          </button>
        </div>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tasks"
          value={tasks.length}
          hint={`Across ${projects.length} project${projects.length === 1 ? "" : "s"}`}
          pct={100}
          barColor="indigo"
          icon={<CheckSquare className="w-4 h-4" />}
        />
        <StatCard
          label="Completed"
          value={doneTasks.length}
          hint={`${completionPct}% workspace velocity`}
          pct={completionPct}
          barColor="emerald"
          icon={<CheckCircle2 className="w-4 h-4" />}
        />
        <StatCard
          label="In Flight"
          value={openTasks.length}
          hint="Active sprint tasks"
          pct={openTasks.length ? 100 - completionPct : 0}
          barColor="sky"
          icon={<Clock className="w-4 h-4" />}
        />
        <StatCard
          label="Overdue"
          value={overdueTasks.length}
          hint={overdueTasks.length > 0 ? "Requires attention" : "Everything clear"}
          pct={overdueTasks.length ? Math.min(100, (overdueTasks.length / Math.max(tasks.length, 1)) * 300) : 0}
          barColor="rose"
          icon={<AlertTriangle className="w-4 h-4" />}
        />
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Due Soon Task List */}
        <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-white">Due soon</h2>
              <p className="text-xs text-slate-400 mt-0.5">Tasks scheduled for upcoming dates</p>
            </div>
            <button
              onClick={() => router.push("/tasks")}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
            >
              <span>All tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {dueSoonTasks.length > 0 ? (
              dueSoonTasks.map((t) => {
                const isDone = t.status === "done";
                const dueInfo = formatDueDate(t.dueDate, t.status);

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setEditingTask(t);
                      setIsTaskModalOpen(true);
                    }}
                    className={cn(
                      "group p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700/80 flex items-center justify-between gap-3 cursor-pointer transition-all duration-150",
                      isDone && "opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={(e) => handleToggleTask(t.id, e)}
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
                            "text-sm font-medium text-slate-200 truncate group-hover:text-white transition",
                            isDone && "line-through text-slate-500"
                          )}
                        >
                          {t.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 truncate">
                          <span>{t.project?.name || "General"}</span>
                          <span>•</span>
                          <span>{t.owner?.name || "Unassigned"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
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
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                All tasks are up to date! Enjoy the calm.
              </div>
            )}
          </div>
        </div>

        {/* Projects Overview */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-white">Projects overview</h2>
                <p className="text-xs text-slate-400 mt-0.5">Progress across active initiatives</p>
              </div>
              <button
                onClick={() => router.push("/projects")}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {projects.slice(0, 5).map((p) => {
                const pct = p.totalTasks
                  ? Math.round(((p.totalTasks - p.openCount) / p.totalTasks) * 100)
                  : 0;

                const dotColor =
                  p.hue === "accent2"
                    ? "bg-sky-400"
                    : p.hue === "neutral"
                    ? "bg-emerald-400"
                    : "bg-indigo-400";

                return (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/projects/${p.id}`)}
                    className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700/80 cursor-pointer transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", dotColor)} />
                        <span className="text-sm font-semibold text-slate-200 truncate">{p.name}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium shrink-0">
                        {p.openCount} open / {p.totalTasks} total
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {projects.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-400">
                  <FolderKanban className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  No projects created yet.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="w-full mt-4 py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-950/10 text-xs font-medium text-slate-400 hover:text-indigo-300 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create new project</span>
          </button>
        </div>
      </div>

      {/* Task & Project Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        projects={projects}
        users={[]}
        onSuccess={loadData}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
