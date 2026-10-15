"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Project } from "@/lib/domain/types";
import { ProjectHealthBadge } from "@/components/ui/ProjectHealthBadge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/formatting/format";
import { cn } from "@/lib/utils";
import {
  Kanban,
  ListBullets,
  ChartBarHorizontal,
  Flag,
  ShieldCheck,
  FileText,
  Users,
  Pulse,
  GearSix,
  Sparkle,
} from "@phosphor-icons/react";

interface ProjectHeaderProps {
  project: Project;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const pathname = usePathname();
  const basePath = `/projects/${project.id}`;

  const tabs = [
    { label: "Overview", href: basePath, icon: <Pulse className="w-4 h-4" /> },
    { label: "Board", href: `${basePath}/board`, icon: <Kanban className="w-4 h-4" /> },
    { label: "Tasks", href: `${basePath}/tasks`, icon: <ListBullets className="w-4 h-4" /> },
    { label: "Timeline", href: `${basePath}/timeline`, icon: <ChartBarHorizontal className="w-4 h-4" /> },
    { label: "Milestones", href: `${basePath}/milestones`, icon: <Flag className="w-4 h-4" /> },
    { label: "RAID", href: `${basePath}/raid`, icon: <ShieldCheck className="w-4 h-4" /> },
    { label: "Changes", href: `${basePath}/changes`, icon: <FileText className="w-4 h-4" /> },
    { label: "Team", href: `${basePath}/team`, icon: <Users className="w-4 h-4" /> },
    { label: "Briefing", href: `${basePath}/briefing`, icon: <Sparkle className="w-4 h-4" /> },
    { label: "Settings", href: `${basePath}/settings`, icon: <GearSix className="w-4 h-4" /> },
  ];

  return (
    <div className="border-b border-[var(--surface-border)] bg-[var(--surface)]">
      {/* Top Banner & Hero info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[var(--primary)] px-2 py-0.5 rounded-md bg-[var(--primary-soft)]">
                {project.code}
              </span>
              <ProjectHealthBadge health={project.health} size="sm" />
              <span className="text-xs text-[var(--muted)] font-medium">
                {project.method} Delivery
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
              {project.name}
            </h1>
            <p className="text-xs text-[var(--muted)] max-w-3xl leading-relaxed">
              {project.summary}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href={`${basePath}/briefing`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Sparkle weight="fill" className="w-3.5 h-3.5 text-purple-600" />
                <span>Executive Briefing</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 text-xs border-t border-[var(--surface-border)]">
          <div>
            <span className="text-[var(--muted)]">Target Completion:</span>
            <div className="font-semibold text-[var(--foreground)]">
              {formatDate(project.targetDate)}
            </div>
          </div>
          <div>
            <span className="text-[var(--muted)]">Overall Progress:</span>
            <div className="font-semibold text-[var(--foreground)]">
              {project.progress}% Complete
            </div>
          </div>
          <div>
            <span className="text-[var(--muted)]">Schedule Health:</span>
            <div className="font-semibold text-[var(--foreground)]">
              {project.dimensions.schedule.health}
            </div>
          </div>
          <div>
            <span className="text-[var(--muted)]">Cost Health:</span>
            <div className="font-semibold text-[var(--foreground)]">
              {project.dimensions.cost.health}
            </div>
          </div>
        </div>
      </div>

      {/* Domain Subnavigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap",
                isActive
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:border-gray-300"
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
