"use client";

import React, { useState, useEffect } from "react";
import { api, ProjectItem } from "@/lib/api";
import { ProjectModal } from "@/components/modals/ProjectModal";
import { Avatar } from "@/components/ui/Avatar";
import { useRouter } from "next/navigation";
import { FolderKanban, Plus, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await api.projects.list();
      setProjects(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Your projects</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Collaborative spaces for team goals and milestones
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New project</span>
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <span className="text-xs">Loading projects...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => {
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
                className="group bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={cn("w-3 h-3 rounded-full shadow-sm", dotColor)} />
                      <h3 className="font-bold text-base text-white group-hover:text-indigo-400 transition">
                        {p.name}
                      </h3>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] leading-relaxed">
                    {p.blurb || "No project description provided."}
                  </p>
                </div>

                <div className="space-y-4 pt-6 mt-4 border-t border-slate-800/60">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Progress</span>
                      <span className="font-medium text-slate-300">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center -space-x-1.5 overflow-hidden">
                      {p.members.slice(0, 4).map((m) => (
                        <Avatar
                          key={m.id}
                          name={m.name}
                          size="xs"
                          className="border-2 border-slate-900"
                        />
                      ))}
                      {p.members.length > 4 && (
                        <div className="w-5 h-5 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-300">
                          +{p.members.length - 4}
                        </div>
                      )}
                    </div>

                    <span className="text-xs font-semibold text-slate-400">
                      {p.openCount} open · {p.totalTasks} total
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* New Project Card CTA */}
          <div
            onClick={() => setIsModalOpen(true)}
            className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950/40 hover:bg-indigo-950/10 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition text-slate-400 hover:text-indigo-300 group min-h-[220px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 group-hover:border-indigo-500/30 flex items-center justify-center transition shadow-sm">
              <Plus className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition" />
            </div>
            <span className="text-sm font-semibold">Create new project</span>
            <span className="text-xs text-slate-400 text-center">
              Spin up a new initiative for your team
            </span>
          </div>
        </div>
      )}

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newP) => {
          loadProjects();
          if (newP) router.push(`/projects/${newP.id}`);
        }}
      />
    </div>
  );
}
