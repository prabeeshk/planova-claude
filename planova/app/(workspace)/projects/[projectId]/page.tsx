"use client";

import React, { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectHealthBadge } from "@/components/ui/ProjectHealthBadge";
import { StatusChip } from "@/components/ui/StatusChip";
import { PriorityPill } from "@/components/ui/PriorityPill";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/formatting/format";
import {
  Warning,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  Flag,
  Plus,
} from "@phosphor-icons/react";

export default function ProjectCommandCentrePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const router = useRouter();
  const { projectId } = use(params);
  const organisationId = useSessionStore((s) => s.organisationId);

  // Fetch project
  const { data: projectData, isLoading: loadingProject } = useQuery({
    queryKey: ["project", projectId, organisationId],
    queryFn: () => apiClient.getProject(projectId),
  });

  // Fetch tasks
  const { data: tasksData } = useQuery({
    queryKey: ["tasks", projectId, organisationId],
    queryFn: () => apiClient.getTasks({ projectId }),
  });

  // Fetch RAID
  const { data: raidData } = useQuery({
    queryKey: ["raid", projectId, organisationId],
    queryFn: () => apiClient.getRaidItems({ projectId }),
  });

  // Fetch Milestones
  const { data: milestonesData } = useQuery({
    queryKey: ["milestones", projectId, organisationId],
    queryFn: () => apiClient.getMilestones(projectId),
  });

  // Fetch Changes
  const { data: changesData } = useQuery({
    queryKey: ["changes", projectId, organisationId],
    queryFn: () => apiClient.getChanges({ projectId }),
  });

  const project = projectData?.data;
  const tasks = tasksData?.data || [];
  const raidItems = raidData?.data || [];
  const milestones = milestonesData?.data || [];
  const changes = changesData?.data || [];

  if (loadingProject) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-[var(--muted)]">
        Loading project command centre...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <h2 className="text-base font-bold text-[var(--foreground)]">Project Not Found</h2>
        <p className="text-xs text-[var(--muted)]">
          The requested project does not exist in the current organisation context.
        </p>
        <Link href="/projects">
          <Button size="sm">Back to Directory</Button>
        </Link>
      </div>
    );
  }

  const criticalRisks = raidItems.filter((r) => r.severity === "Critical" || r.severity === "High");

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <ProjectHeader project={project} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* 4 Health Dimension Rationale Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(["schedule", "cost", "scope", "resource"] as const).map((dimKey) => {
            const dim = project.dimensions[dimKey];
            return (
              <div
                key={dimKey}
                className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--surface-border)] space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold capitalize text-[var(--foreground)]">
                      {dimKey} Dimension
                    </span>
                    <ProjectHealthBadge health={dim.health} size="sm" showIcon={false} />
                  </div>
                  <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                    {dim.rationale}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2-Column Command Centre Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Top RAID and Next Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top Critical Risks & RAID Items */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
                    <span>Top RAID Items & Critical Exposures</span>
                  </CardTitle>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    {criticalRisks.length} high/critical items monitored under delivery governance.
                  </p>
                </div>

                <Link href={`/projects/${project.id}/raid`}>
                  <Button variant="outline" size="xs">
                    View Full RAID
                  </Button>
                </Link>
              </CardHeader>

              <div className="space-y-3">
                {raidItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => router.push(`/governance/raid/${item.id}`)}
                    className="p-3.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-elevated)]/40 hover:border-[var(--primary)]/50 transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-[var(--primary)]">
                          {item.code}
                        </span>
                        <PriorityPill priority={item.severity} size="sm" />
                        <span className="text-xs font-semibold text-[var(--foreground)] truncate max-w-sm">
                          {item.title}
                        </span>
                      </div>
                      <StatusChip status={item.status} size="sm" />
                    </div>

                    <p className="text-xs text-[var(--muted)] line-clamp-1">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-[var(--muted)] pt-1 border-t border-[var(--surface-border)]">
                      <span>Response: {item.response}</span>
                      <span>Review: {formatDate(item.reviewDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Change Requests & Scope Evolution */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[var(--primary)]" />
                    <span>Change Requests & Baselines</span>
                  </CardTitle>
                </div>
                <Link href={`/projects/${project.id}/changes`}>
                  <Button variant="outline" size="xs">
                    All Changes
                  </Button>
                </Link>
              </CardHeader>

              <div className="space-y-3">
                {changes.slice(0, 3).map((chg) => (
                  <div
                    key={chg.id}
                    onClick={() => router.push(`/changes/${chg.id}`)}
                    className="p-3.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-elevated)]/40 hover:border-[var(--primary)]/50 transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-[var(--primary)]">
                          {chg.code}
                        </span>
                        <span className="font-semibold text-xs text-[var(--foreground)]">
                          {chg.title}
                        </span>
                      </div>
                      <StatusChip status={chg.status} size="sm" />
                    </div>
                    <p className="text-xs text-[var(--muted)] line-clamp-1">{chg.reason}</p>
                    <div className="text-[11px] text-[var(--muted)] flex items-center justify-between pt-1">
                      <span>Impact: {chg.impact.cost.currencyCode} {chg.impact.cost.amount}</span>
                      <span>Version: v{chg.currentVersion}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Col: Milestones & Quick Work summary */}
          <div className="space-y-6">
            {/* Key Milestones */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Flag className="w-4 h-4 text-[var(--primary)]" />
                  <span>Key Milestones</span>
                </CardTitle>
                <Link href={`/projects/${project.id}/milestones`} className="text-[11px] font-semibold text-[var(--primary)] hover:underline">
                  View all
                </Link>
              </CardHeader>

              <div className="space-y-2.5 text-xs">
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-elevated)]/40 flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                        {m.achievedAt ? (
                          <CheckCircle weight="fill" className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0" />
                        )}
                        <span className="line-clamp-1">{m.name}</span>
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">
                        Target: {formatDate(m.targetDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Actions Card */}
            <Card className="p-5 space-y-3 bg-gradient-to-br from-[var(--surface)] to-[var(--surface-elevated)]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Delivery Quick Actions
              </h3>
              <div className="flex flex-col gap-2">
                <Link href={`/projects/${project.id}/board`}>
                  <Button variant="outline" size="sm" className="w-full justify-between">
                    <span>Open Work Board</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
                <Link href={`/projects/${project.id}/timeline`}>
                  <Button variant="outline" size="sm" className="w-full justify-between">
                    <span>View Gantt Timeline</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
                <Link href={`/projects/${project.id}/team`}>
                  <Button variant="outline" size="sm" className="w-full justify-between">
                    <span>Manage Squad Allocations</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
