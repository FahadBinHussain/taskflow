"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, User, Folder, Trash2, CheckCircle, Loader2 } from "lucide-react";
import { api, TaskItem, ProjectItem, AuthUser } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { daysFromToday, cn } from "@/lib/utils";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: TaskItem | null;
  projects: ProjectItem[];
  users: AuthUser[];
  onSuccess: () => void;
}

export function TaskModal({
  isOpen,
  onClose,
  task,
  projects,
  users,
  onSuccess,
}: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [dueDate, setDueDate] = useState(daysFromToday(1));
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [status, setStatus] = useState<"todo" | "doing" | "done">("todo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast, toastError } = useToast();

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setProjectId(task.projectId || (projects[0]?.id || ""));
      setOwnerId(task.ownerId || (users[0]?.id || ""));
      setDueDate(task.dueDate || daysFromToday(1));
      setPriority(task.priority || "Medium");
      setStatus(task.status || "todo");
    } else {
      setTitle("");
      setDescription("");
      setProjectId(projects[0]?.id || "");
      setOwnerId(users[0]?.id || "");
      setDueDate(daysFromToday(1));
      setPriority("Medium");
      setStatus("todo");
    }
    setError("");
  }, [task, projects, users, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }
    if (!projectId) {
      setError("Please select a project.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (task) {
        await api.tasks.update(task.id, {
          title,
          description,
          project_id: projectId,
          owner_id: ownerId,
          due_date: dueDate,
          priority,
          status,
        });
        toast("Task updated successfully.");
      } else {
        await api.tasks.create({
          title,
          description,
          project_id: projectId,
          owner_id: ownerId,
          due_date: dueDate,
          priority,
          status,
        });
        toast("Task created successfully.");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save task.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm("Are you sure you want to delete this task?")) return;

    setLoading(true);
    try {
      await api.tasks.delete(task.id);
      toast("Task deleted.");
      onSuccess();
      onClose();
    } catch (err: any) {
      toastError(err.message || "Failed to delete task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-white text-base">
            {task ? "Edit Task" : "Create New Task"}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-3.5 py-2.5 rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Add details, requirements, links..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Project
              </label>
              <div className="relative">
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <Folder className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Assignee
              </label>
              <div className="relative">
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {task && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="todo">To Do</option>
                  <option value="doing">In Progress</option>
                  <option value="done">Completed</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Low", "Medium", "High"] as const).map((p) => {
                const isActive = priority === p;
                const colors = {
                  Low: isActive
                    ? "bg-slate-700 text-slate-200 border-slate-600 shadow-sm"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700",
                  Medium: isActive
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700",
                  High: isActive
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700",
                };
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "py-2 rounded-xl text-xs font-semibold border transition-all text-center",
                      colors[p]
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            {task ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/40 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {task ? "Save changes" : "Create task"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
