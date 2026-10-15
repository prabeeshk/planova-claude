import React from "react";
import { cn } from "@/lib/utils";
import type { TaskStatus, RaidStatus, ChangeStatus, ApprovalStatus } from "@/lib/domain/types";
import { Circle, CheckCircle, WarningOctagon, Clock, ShieldCheck, XCircle } from "@phosphor-icons/react";

type GenericStatus = TaskStatus | RaidStatus | ChangeStatus | ApprovalStatus | string;

interface StatusChipProps {
  status: GenericStatus;
  size?: "sm" | "md";
  className?: string;
}

export function StatusChip({ status, size = "md", className }: StatusChipProps) {
  const getStyles = (s: GenericStatus) => {
    switch (s) {
      case "Completed":
      case "Approved":
      case "Resolved":
      case "Implemented":
        return {
          bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
          icon: <CheckCircle weight="fill" className="text-emerald-600 dark:text-emerald-400" />,
        };
      case "In Progress":
      case "Active":
      case "Monitoring":
      case "Ready for Approval":
      case "Planned":
        return {
          bg: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
          icon: <Circle weight="fill" className="text-blue-500 animate-pulse" />,
        };
      case "Blocked":
      case "Escalated":
      case "Rejected":
      case "Failed":
        return {
          bg: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
          icon: <WarningOctagon weight="fill" className="text-rose-600 dark:text-rose-400" />,
        };
      case "Pending":
      case "In Approval":
      case "Assessing":
      case "On Hold":
        return {
          bg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
          icon: <Clock weight="fill" className="text-amber-600 dark:text-amber-400" />,
        };
      case "Cancelled":
      case "Withdrawn":
      case "Closed":
      case "Archived":
        return {
          bg: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
          icon: <XCircle weight="fill" className="text-slate-500" />,
        };
      default: // Not Started, Draft, etc.
        return {
          bg: "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20",
          icon: <Circle weight="regular" className="text-gray-400" />,
        };
    }
  };

  const { bg, icon } = getStyles(status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium transition-colors",
        size === "sm" ? "px-2 py-0.5 text-xs gap-1" : "px-2.5 py-1 text-xs gap-1.5",
        bg,
        className
      )}
    >
      <span className="text-xs">{icon}</span>
      <span>{status}</span>
    </span>
  );
}
