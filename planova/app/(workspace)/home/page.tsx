"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore, useCurrentSession } from "@/stores/useSessionStore";
import { PERSONAS } from "@/lib/access/permissions";
import { ProjectHealthBadge } from "@/components/ui/ProjectHealthBadge";
import { StatusChip } from "@/components/ui/StatusChip";
import { PriorityPill } from "@/components/ui/PriorityPill";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/formatting/format";
import { DEMO_TODAY } from "@/lib/demo-data/clock";
import {
  Plus,
  ArrowRight,
  Pulse,
  Warning,
  CheckCircle,
  Flag,
  CalendarCheck,
  CheckSquareOffset,
  Sparkle,
  Clock,
  ArrowUpRight,
} from "@phosphor-icons/react";

export default function HomePage() {
  const router = useRouter();
  const session = useCurrentSession();
  const organisationId = useSessionStore((s) => s.organisationId);
  const toggleCopilot = useSessionStore((s) => s.toggleCopilot);

  const activePersona = PERSONAS.find((p) => p.id === session.personaId) || PERSONAS[0];

  // Fetch projects
  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  // Fetch tasks
  const { data: tasksData } = useQuery({
    queryKey: ["tasks", organisationId],
    queryFn: () => apiClient.getTasks(),
  });

  // Fetch RAID items
  const { data: raidData } = useQuery({
    queryKey: ["raid", organisationId],
    queryFn: () => apiClient.getRaidItems(),
  });

  // Fetch Approvals
  const { data: approvalsData } = useQuery({
    queryKey: ["approvals", organisationId],
    queryFn: () => apiClient.getApprovals(),
  });

  // Fetch Milestones
  const { data: milestonesData } = useQuery({
    queryKey: ["milestones", organisationId],
    queryFn: () => apiClient.getMilestones(),
  });

  // Fetch Activity
  const { data: activityData } = useQuery({
    queryKey: ["activity", organisationId],
    queryFn: () => apiClient.getActivityEvents(),
  });

  const projects = projectsData?.data || [];
  const tasks = tasksData?.data || [];
  const raidItems = raidData?.data || [];
  const approvals = approvalsData?.data || [];
  const milestones = milestonesData?.data || [];
  const activities = activityData?.data || [];

  const pendingApprovals = approvals.filter((a) => a.status === "Pending");
  const criticalRisks = raidItems.filter((r) => r.severity === "Critical" && r.status !== "Closed");
  const blockedTasks = tasks.filter((t) => t.status === "Blocked");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in-50 duration-200">
      {/* Greeting and Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-medium">
            <span>{formatDate(DEMO_TODAY, "EEEE, MMMM d, yyyy")}</span>
            <span>•</span>
            <span className="text-[var(--primary)] font-semibold">{activePersona.label}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-1">
            Good morning, {activePersona.label}
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            {activePersona.blurb}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCopilot}
            className="gap-1.5"
          >
            <Sparkle weight="fill" className="w-3.5 h-3.5 text-purple-600" />
            <span>Executive Briefing</span>
          </Button>

          <Link href="/projects/new">
            <Button size="sm" className="gap-1.5">
              <Plus weight="bold" className="w-3.5 h-3.5" />
              <span>Create Project</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Signature Component: Needs Your Attention Feed (Pulse) */}
      <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/5 via-transparent to-purple-500/5 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
              <Pulse weight="bold" className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <span>Needs Your Attention</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                  {criticalRisks.length + pendingApprovals.length + blockedTasks.length} Action Items
                </span>
              </h2>
              <p className="text-[11px] text-[var(--muted)]">
                Prioritized items requiring immediate decision, risk mitigation, or task unblocking.
              </p>
            </div>
          </div>

          <Link href="/pulse" className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1">
            <span>View All Signals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Action 1: Pending Decision */}
          {pendingApprovals.length > 0 && (
            <div className="p-3.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] space-y-2 hover:border-[var(--primary)]/40 transition-all flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <CheckSquareOffset className="w-3.5 h-3.5" />
                    Pending Decision
                  </span>
                  <span className="text-[10px] text-[var(--muted)]">Due in 2 days</span>
                </div>
                <div className="font-semibold text-xs text-[var(--foreground)] line-clamp-1">
                  {pendingApprovals[0].title}
                </div>
                <p className="text-[11px] text-[var(--muted)] line-clamp-2">
                  CR-AUR-001 requests biometric adaptive latency proxy to resolve critical RAID item.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[var(--surface-border)]">
                <span className="text-[10px] text-[var(--muted)]">Aurora Modernisation</span>
                <Link
                  href={`/approvals/${pendingApprovals[0].id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] hover:underline"
                >
                  <span>Review Evidence</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Action 2: Critical Risk Review */}
          {criticalRisks.length > 0 && (
            <div className="p-3.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] space-y-2 hover:border-[var(--primary)]/40 transition-all flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1">
                    <Warning className="w-3.5 h-3.5" />
                    Critical Risk
                  </span>
                  <span className="text-[10px] font-semibold text-red-600">Score: {criticalRisks[0].score}</span>
                </div>
                <div className="font-semibold text-xs text-[var(--foreground)] line-clamp-1">
                  {criticalRisks[0].code}: {criticalRisks[0].title}
                </div>
                <p className="text-[11px] text-[var(--muted)] line-clamp-2">
                  {criticalRisks[0].description}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[var(--surface-border)]">
                <span className="text-[10px] text-[var(--muted)]">Due for review</span>
                <Link
                  href={`/governance/raid/${criticalRisks[0].id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] hover:underline"
                >
                  <span>Review Risk</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Action 3: Blocked Work */}
          {blockedTasks.length > 0 && (
            <div className="p-3.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] space-y-2 hover:border-[var(--primary)]/40 transition-all flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Blocked Delivery Task
                  </span>
                  <PriorityPill priority={blockedTasks[0].priority} size="sm" />
                </div>
                <div className="font-semibold text-xs text-[var(--foreground)] line-clamp-1">
                  {blockedTasks[0].code}: {blockedTasks[0].title}
                </div>
                <p className="text-[11px] text-[var(--muted)] line-clamp-2">
                  {blockedTasks[0].blockedReason || "Blocked awaiting external technical dependency."}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[var(--surface-border)]">
                <span className="text-[10px] text-[var(--muted)]">Arjun Mehta</span>
                <Link
                  href={`/projects/${blockedTasks[0].projectId}/tasks/${blockedTasks[0].id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] hover:underline"
                >
                  <span>Inspect Task</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: My Projects & Activity Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Projects Status Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--foreground)]">My Active Projects</h2>
              <p className="text-xs text-[var(--muted)]">
                Showing {projects.length} delivery initiatives for {organisationId === "org-meridian" ? "Meridian" : "Northwind"}.
              </p>
            </div>

            <Link href="/projects" className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1">
              <span>View Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.slice(0, 6).map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/projects/${p.id}`)}
                className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--surface-border)] hover:border-[var(--primary)]/40 hover:shadow-md transition-all cursor-pointer space-y-3 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors">
                      {p.code}
                    </span>
                    <h3 className="font-semibold text-sm text-[var(--foreground)] line-clamp-1 mt-0.5">
                      {p.name}
                    </h3>
                  </div>
                  <ProjectHealthBadge health={p.health} size="sm" />
                </div>

                <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
                  {p.summary}
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--muted)]">Overall Progress</span>
                    <span className="font-semibold text-[var(--foreground)]">{p.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--primary)] transition-all"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--surface-border)] flex items-center justify-between text-[11px] text-[var(--muted)]">
                  <span>Target: {formatDate(p.targetDate, "MMM d, yyyy")}</span>
                  <span className="font-medium text-[var(--foreground)]">{p.method}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Milestones & Recent Activity */}
        <div className="space-y-6">
          {/* Next Milestones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Flag className="w-4 h-4 text-[var(--primary)]" />
                <span>Next Upcoming Milestones</span>
              </CardTitle>
              <Link href="/milestones" className="text-[11px] font-semibold text-[var(--primary)] hover:underline">
                View all
              </Link>
            </CardHeader>

            <div className="space-y-3 text-xs">
              {milestones
                .filter((m) => !m.achievedAt)
                .slice(0, 4)
                .map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-elevated)]/40 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[var(--foreground)] line-clamp-1">
                        {m.name}
                      </span>
                      {m.isKey && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600">
                          Key
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                      <span>Target: {formatDate(m.targetDate)}</span>
                      <span>Owner: {m.ownerId.replace("u-", "")}</span>
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          {/* Activity timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--primary)]" />
                <span>Recent Collaborative Activity</span>
              </CardTitle>
            </CardHeader>

            <div className="space-y-3 text-xs">
              {activities.slice(0, 5).map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 pb-2.5 border-b border-[var(--surface-border)] last:border-none last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-[var(--primary)] mt-1.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-[var(--foreground)] leading-snug">
                      <strong className="font-semibold capitalize">{act.actorId.replace("u-", "")} </strong>
                      {act.summary}
                    </p>
                    <span className="text-[10px] text-[var(--muted)]">
                      {formatDate(act.at, "MMM d, h:mm a")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
