import React from "react";
import { cn } from "@/lib/utils";
import type { Priority, Severity } from "@/lib/domain/types";
import { Warning, WarningCircle, ArrowUp, ArrowDown } from "@phosphor-icons/react";

interface PriorityPillProps {
  priority: Priority | Severity;
  size?: "sm" | "md";
  className?: string;
}

export function PriorityPill({ priority, size = "md", className }: PriorityPillProps) {
  const getStyles = (p: Priority | Severity) => {
    switch (p) {
      case "Critical":
        return {
          bg: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/25",
          icon: <WarningCircle weight="fill" className="text-red-600 dark:text-red-400" />,
        };
      case "High":
        return {
          bg: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/25",
          icon: <ArrowUp weight="bold" className="text-orange-600 dark:text-orange-400" />,
        };
      case "Medium":
        return {
          bg: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25",
          icon: <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />,
        };
      case "Low":
      default:
        return {
          bg: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
          icon: <ArrowDown weight="bold" className="text-slate-500" />,
        };
    }
  };

  const { bg, icon } = getStyles(priority);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-medium",
        size === "sm" ? "px-1.5 py-0.5 text-[11px] gap-1" : "px-2 py-0.5 text-xs gap-1.5",
        bg,
        className
      )}
    >
      <span className="text-xs shrink-0">{icon}</span>
      <span>{priority}</span>
    </span>
  );
}
