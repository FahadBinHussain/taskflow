"use client";

import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { api, ProjectItem } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProject?: ProjectItem) => void;
}

export function ProjectModal({ isOpen, onClose, onSuccess }: ProjectModalProps) {
  const [name, setName] = useState("");
  const [blurb, setBlurb] = useState("");
  const [hue, setHue] = useState<"accent" | "accent2" | "neutral">("accent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const created = await api.projects.create({ name: name.trim(), blurb: blurb.trim(), hue });
      toast("Project created successfully.");
      setName("");
      setBlurb("");
      setHue("accent");
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-white text-base">New Project</h3>
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
              Project Name
            </label>
            <input
              type="text"
              placeholder="e.g. Q4 Sprint, Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              placeholder="What is the goal of this project?"
              value={blurb}
              onChange={(e) => setBlurb(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Theme Color
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "accent", label: "Indigo", dot: "bg-indigo-500" },
                { id: "accent2", label: "Sky", dot: "bg-sky-500" },
                { id: "neutral", label: "Emerald", dot: "bg-emerald-500" },
              ].map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setHue(h.id as any)}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition",
                    hue === h.id
                      ? "bg-slate-800 text-white border-slate-600 shadow-sm"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                  )}
                >
                  <span className={cn("w-2.5 h-2.5 rounded-full", h.dot)} />
                  <span>{h.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
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
              Create project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
