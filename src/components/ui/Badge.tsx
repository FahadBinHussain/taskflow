import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "accent" | "warning" | "danger" | "success" | "neutral" | "admin" | "member";
  className?: string;
}

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  const variantStyles = {
    accent: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    neutral: "bg-slate-800/60 text-slate-300 border-slate-700/60",
    admin: "bg-purple-500/15 text-purple-300 border-purple-500/40",
    member: "bg-sky-500/15 text-sky-300 border-sky-500/40",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
