"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { ProjectHealthBadge } from "@/components/ui/ProjectHealthBadge";
import { PriorityPill } from "@/components/ui/PriorityPill";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/formatting/format";
import {
  Pulse,
  Warning,
  CheckSquareOffset,
  Clock,
  ArrowRight,
  ShieldWarning,
  Coins,
  Sparkle,
  CheckCircle,
} from "@phosphor-icons/react";

export default function PulsePage() {
  const organisationId = useSessionStore((s) => s.organisationId);
  const [selectedProject, setSelectedProject] = useState<string>("all");

  const { data: projectsData } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const { data: raidData } = useQuery({
    queryKey: ["raid", organisationId],
    queryFn: () => apiClient.getRaidItems(),
  });

  const { data: approvalsData } = useQuery({
    queryKey: ["approvals", organisationId],
    queryFn: () => apiClient.getApprovals(),
  });

  const { data: tasksData } = useQuery({
    queryKey: ["tasks", organisationId],
    queryFn: () => apiClient.getTasks(),
  });

  const projects = projectsData?.data || [];
  const allRaid = raidData?.data || [];
  const allApprovals = approvalsData?.data || [];
  const allTasks = tasksData?.data || [];

  // Filter based on selected project
  const filteredRaid =
    selectedProject === "all"
      ? allRaid
      : allRaid.filter((r) => r.projectId === selectedProject);

  const filteredApprovals =
    selectedProject === "all"
      ? allApprovals
      : allApprovals.filter((a) => a.projectId === selectedProject);

  const filteredTasks =
    selectedProject === "all"
      ? allTasks
      : allTasks.filter((t) => t.projectId === selectedProject);

  const criticalRisks = filteredRaid.filter(
    (r) => (r.severity === "Critical" || r.severity === "High") && r.status !== "Closed"
  );
  const pendingApprovals = filteredApprovals.filter((a) => a.status === "Pending");
  const blockedTasks = filteredTasks.filter((t) => t.status === "Blocked");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in-50 duration-200">
      {/* Header and Project filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold">
            <Pulse weight="bold" className="w-3.5 h-3.5" />
            <span>Project Command Centre</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-1.5">
            PLANOVA Pulse
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1 max-w-2xl">
            Ranked attention feed prioritizing items by severity, upcoming deadlines, and delivery impact.
            Every signal links directly to evidence and a safe resolution path.
          </p>
        </div>

        {/* Project selector filter */}
        <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--surface-border)] px-3 py-1.5 rounded-xl shadow-2xs">
          <span className="text-xs text-[var(--muted)] font-medium">Filter Lens:</span>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-transparent text-xs font-semibold text-[var(--foreground)] border-none focus:outline-none cursor-pointer"
            aria-label="Filter Pulse by Project"
          >
            <option value="all">All Accessible Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Cards with Actionability */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--surface-border)] space-y-1">
          <span className="text-xs text-[var(--muted)] font-medium">Projects At Risk</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">
              {projects.filter((p) => p.health === "At Risk" || p.health === "Critical").length}
            </span>
            <span className="text-xs text-[var(--muted)]">of {projects.length} total</span>
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium pt-1">
            Aurora & Atlas require review
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--surface-border)] space-y-1">
          <span className="text-xs text-[var(--muted)] font-medium">Critical RAID Items</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-600">{criticalRisks.length}</span>
            <span className="text-xs text-[var(--muted)]">open/escalated</span>
          </div>
          <div className="text-[11px] text-red-700 dark:text-red-300 font-medium pt-1">
            Top exposure: AED 380,000
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--surface-border)] space-y-1">
          <span className="text-xs text-[var(--muted)] font-medium">Awaiting Decision</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--primary)]">{pendingApprovals.length}</span>
            <span className="text-xs text-[var(--muted)]">change requests</span>
          </div>
          <div className="text-[11px] text-[var(--primary)] font-medium pt-1">
            SLA target: 48h remaining
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--surface-border)] space-y-1">
          <span className="text-xs text-[var(--muted)] font-medium">Blocked Delivery Tasks</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">{blockedTasks.length}</span>
            <span className="text-xs text-[var(--muted)]">impediments</span>
          </div>
          <div className="text-[11px] text-rose-700 dark:text-rose-300 font-medium pt-1">
            Pending external dependencies
          </div>
        </div>
      </div>

      {/* Attention Feed (Ranked by severity and deadline) */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[var(--foreground)]">
          Ranked Priority Action Queue
        </h2>

        <div className="space-y-3">
          {/* Signal 1: CR-AUR-001 Approval */}
          {pendingApprovals.map((appr) => (
            <div
              key={appr.id}
              className="p-5 rounded-2xl border border-amber-500/30 bg-[var(--surface)] shadow-xs space-y-3 hover:border-[var(--primary)]/50 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    Decision Required
                  </span>
                  <span className="text-xs font-semibold text-[var(--muted)]">SLA: 48 hours</span>
                </div>
                <div className="text-xs text-[var(--muted)]">Target Project: Aurora CX Modernisation</div>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[var(--foreground)]">
                  {appr.title}
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Requires Governance Approver review of the submitted immutable version snapshot (Ref: {appr.versionHash}).
                  Approving unlocks the adaptive timeout proxy and resolves RAID-AUR-01.
                </p>
              </div>

              <div className="pt-2 border-t border-[var(--surface-border)] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Submitted by Layla Al-Mansoor (Project Lead)</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/changes/${appr.entityId}`}>
                    <Button variant="outline" size="sm">
                      Inspect Change
                    </Button>
                  </Link>
                  <Link href={`/approvals/${appr.id}`}>
                    <Button size="sm" className="gap-1.5">
                      <span>Enter Decision</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Signal 2: Critical RAID Items */}
          {criticalRisks.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl border border-red-500/25 bg-[var(--surface)] shadow-xs space-y-3 hover:border-red-500/40 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20">
                    Critical {item.type} (Score: {item.score})
                  </span>
                  <span className="text-xs font-semibold text-[var(--muted)]">
                    Review Due: {formatDate(item.reviewDate)}
                  </span>
                </div>
                <div className="text-xs text-[var(--muted)]">
                  Exposure: {item.exposure?.amount ? `${item.exposure.currencyCode} ${item.exposure.amount}` : "N/A"}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[var(--foreground)]">
                  {item.code}: {item.title}
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[var(--surface-border)] flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[var(--muted)]">
                  <strong>Planned Response: </strong>
                  <span>{item.response}</span>
                </div>

                <Link href={`/governance/raid/${item.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <span>Review Risk & Record Note</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}

          {/* Signal 3: Blocked Tasks */}
          {blockedTasks.map((task) => (
            <div
              key={task.id}
              className="p-5 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] shadow-xs space-y-3 hover:border-amber-500/40 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                    Impediment Blocked
                  </span>
                  <PriorityPill priority={task.priority} size="sm" />
                </div>
                <div className="text-xs text-[var(--muted)]">Due: {formatDate(task.dueDate)}</div>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[var(--foreground)]">
                  {task.code}: {task.title}
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium leading-relaxed">
                  Blocker Rationale: {task.blockedReason || "Awaiting architectural resolution."}
                </p>
              </div>

              <div className="pt-2 border-t border-[var(--surface-border)] flex items-center justify-between">
                <span className="text-xs text-[var(--muted)]">Assignee: {task.assigneeId?.replace("u-", "")}</span>
                <Link href={`/projects/${task.projectId}/tasks/${task.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <span>Unblock / Transition Task</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
