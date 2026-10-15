import React from "react";
import { cn } from "@/lib/utils";
import type { Health } from "@/lib/domain/types";
import { CheckCircle, Warning, WarningCircle, Question } from "@phosphor-icons/react";

interface HealthBadgeProps {
  health: Health;
  size?: "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
}

export function ProjectHealthBadge({
  health,
  size = "md",
  className,
  showIcon = true,
}: HealthBadgeProps) {
  const configs: Record<
    Health,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    "On Track": {
      label: "On Track",
      bg: "bg-[var(--success-soft)]",
      text: "text-[var(--success)]",
      border: "border-[var(--success)]/20",
      icon: <CheckCircle weight="fill" className="text-[var(--success)]" />,
    },
    "At Risk": {
      label: "At Risk",
      bg: "bg-[var(--warning-soft)]",
      text: "text-[var(--warning)]",
      border: "border-[var(--warning)]/20",
      icon: <Warning weight="fill" className="text-[var(--warning)]" />,
    },
    Critical: {
      label: "Critical",
      bg: "bg-[var(--critical-soft)]",
      text: "text-[var(--critical)]",
      border: "border-[var(--critical)]/20",
      icon: <WarningCircle weight="fill" className="text-[var(--critical)]" />,
    },
    "No Data": {
      label: "No Data",
      bg: "bg-[var(--muted-bg)]",
      text: "text-[var(--muted)]",
      border: "border-[var(--surface-border)]",
      icon: <Question weight="bold" className="text-[var(--muted)]" />,
    },
  };

  const cfg = configs[health] || configs["No Data"];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs font-medium gap-1.5",
    lg: "px-3 py-1.5 text-sm font-semibold gap-2",
  };

  const iconSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border transition-colors",
        cfg.bg,
        cfg.text,
        cfg.border,
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label={`Project Health: ${cfg.label}`}
    >
      {showIcon && <span className={iconSizes[size]}>{cfg.icon}</span>}
      <span>{cfg.label}</span>
    </span>
  );
}
