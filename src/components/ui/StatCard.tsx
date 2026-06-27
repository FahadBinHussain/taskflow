import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  hint: string;
  pct?: number;
  barColor?: "indigo" | "sky" | "emerald" | "rose" | "purple";
  icon?: React.ReactNode;
}

export function StatCard({ label, value, hint, pct = 0, barColor = "indigo", icon }: StatCardProps) {
  const barStyles = {
    indigo: "bg-indigo-500",
    sky: "bg-sky-500",
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="relative overflow-hidden bg-slate-900/70 dark:bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div className="text-3xl font-bold tracking-tight text-white mb-3">{value}</div>
      <div className="w-full bg-slate-800/80 rounded-full h-1.5 mb-2 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barStyles[barColor])}
          style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
        />
      </div>
      <div className="text-xs text-slate-400">{hint}</div>
    </div>
  );
}
