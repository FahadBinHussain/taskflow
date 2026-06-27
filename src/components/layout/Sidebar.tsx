"use client";

import React from "react";
import Link from "next/navigation";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  ShieldCheck,
  Plus,
  X,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ProjectItem } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SidebarProps {
  projects: ProjectItem[];
  openTasksCount: number;
  isOpen: boolean;
  onClose: () => void;
  onOpenNewProject: () => void;
}

export function Sidebar({
  projects,
  openTasksCount,
  isOpen,
  onClose,
  onOpenNewProject,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      name: "My tasks",
      href: "/tasks",
      icon: CheckSquare,
      active: pathname === "/tasks",
      badge: openTasksCount > 0 ? openTasksCount : undefined,
    },
    {
      name: "Projects",
      href: "/projects",
      icon: FolderKanban,
      active: pathname === "/projects",
    },
    ...(isAdmin
      ? [
          {
            name: "Admin",
            href: "/admin",
            icon: ShieldCheck,
            active: pathname === "/admin",
          },
        ]
      : []),
  ];

  const handleNav = (href: string) => {
    router.push(href);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
          <div
            onClick={() => handleNav("/dashboard")}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition">
              <CheckSquare className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                TaskFlow
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  v2
                </span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNav(item.href)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                    item.active
                      ? "bg-indigo-600/15 text-indigo-400 font-semibold border border-indigo-500/30 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "w-4 h-4 transition-transform group-hover:scale-110",
                        item.active ? "text-indigo-400" : "text-slate-400"
                      )}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 group-hover:bg-slate-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Projects section */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Projects
              </span>
              <button
                onClick={onOpenNewProject}
                className="text-slate-400 hover:text-indigo-400 transition"
                title="New Project"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-0.5">
              {projects.map((p) => {
                const isCurrent = pathname === `/projects/${p.id}`;
                const hueDot =
                  p.hue === "accent2"
                    ? "bg-sky-400 shadow-sky-500/50"
                    : p.hue === "neutral"
                    ? "bg-emerald-400 shadow-emerald-500/50"
                    : "bg-indigo-400 shadow-indigo-500/50";

                return (
                  <button
                    key={p.id}
                    onClick={() => handleNav(`/projects/${p.id}`)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all group text-left",
                      isCurrent
                        ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={cn("w-2 h-2 rounded-full shadow-sm shrink-0", hueDot)} />
                      <span className="truncate">{p.name}</span>
                    </div>
                    {p.openCount > 0 && (
                      <span className="text-[11px] font-medium text-slate-400 ml-2">
                        {p.openCount}
                      </span>
                    )}
                  </button>
                );
              })}

              {projects.length === 0 && (
                <div className="px-3 py-2 text-xs text-slate-400">No projects yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            onClick={onOpenNewProject}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 transition"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>New project</span>
          </button>
        </div>
      </aside>
    </>
  );
}
