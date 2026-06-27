"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { TaskModal } from "@/components/modals/TaskModal";
import { ProjectModal } from "@/components/modals/ProjectModal";
import { api, ProjectItem, AuthUser, TaskItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [allUsers, setAllUsers] = useState<AuthUser[]>([]);
  const [openTasksCount, setOpenTasksCount] = useState(0);

  // Global modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const loadShellData = async () => {
    try {
      const [projList, userList, taskList] = await Promise.all([
        api.projects.list(),
        api.users.list(),
        api.tasks.list(),
      ]);
      setProjects(projList);
      setAllUsers(userList);
      setOpenTasksCount(taskList.filter((t) => t.status !== "done").length);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }
    if (user) {
      loadShellData();
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-sm font-medium">Loading TaskFlow...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        projects={projects}
        openTasksCount={openTasksCount}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenNewProject={() => setIsProjectModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onSearch={(query) => {
            if (query.trim()) {
              router.push(`/tasks?search=${encodeURIComponent(query)}`);
            }
          }}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Global Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        projects={projects}
        users={allUsers}
        onSuccess={() => {
          loadShellData();
          window.dispatchEvent(new CustomEvent("taskflow:refresh"));
        }}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSuccess={(newP) => {
          loadShellData();
          if (newP) router.push(`/projects/${newP.id}`);
        }}
      />
    </div>
  );
}
