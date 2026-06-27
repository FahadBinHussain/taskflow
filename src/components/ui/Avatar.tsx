import React from "react";
import { getInitials, cn } from "@/lib/utils";

interface AvatarProps {
  name?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const colorMap = [
  "from-indigo-600 to-violet-600",
  "from-sky-600 to-cyan-600",
  "from-emerald-600 to-teal-600",
  "from-amber-600 to-orange-600",
  "from-rose-600 to-pink-600",
  "from-purple-600 to-fuchsia-600",
];

function getGradient(name: string = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorMap.length;
  return colorMap[index];
}

export function Avatar({ name = "?", size = "md", className }: AvatarProps) {
  const sizeClasses = {
    xs: "w-5 h-5 text-[10px]",
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-11 h-11 text-base",
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold text-white uppercase select-none shadow-sm bg-gradient-to-tr",
        sizeClasses[size],
        getGradient(name),
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
