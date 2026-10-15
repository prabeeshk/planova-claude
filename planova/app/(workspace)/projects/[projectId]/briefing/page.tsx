"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectHealthBadge } from "@/components/ui/ProjectHealthBadge";
import { SimulatedAIIndicator } from "@/components/ui/SimulatedAIIndicator";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/formatting/format";
import { DEMO_TODAY } from "@/lib/demo-data/clock";
import { toast } from "sonner";
import {
  Sparkle,
  Copy,
  ArrowsClockwise,
  DownloadSimple,
  ShieldCheck,
  CheckCircle,
  Warning,
  Flag,
  CalendarCheck,
  FileText,
} from "@phosphor-icons/react";

export default function ProjectBriefingPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const organisationId = useSessionStore((s) => s.organisationId);

  const [variantIndex, setVariantIndex] = useState(0);

  const { data: projectRes } = useQuery({
    queryKey: ["project", projectId, organisationId],
    queryFn: () => apiClient.getProject(projectId),
  });

  const { data: tasksRes } = useQuery({
    queryKey: ["tasks", projectId, organisationId],
    queryFn: () => apiClient.getTasks({ projectId }),
  });

  const { data: milestonesRes } = useQuery({
    queryKey: ["milestones", projectId, organisationId],
    queryFn: () => apiClient.getMilestones(projectId),
  });

  const { data: raidRes } = useQuery({
    queryKey: ["raid", projectId, organisationId],
    queryFn: () => apiClient.getRaidItems({ projectId }),
  });

  const { data: changesRes } = useQuery({
    queryKey: ["changes", projectId, organisationId],
    queryFn: () => apiClient.getChanges({ projectId }),
  });

  const project = projectRes?.data;
  const tasks = tasksRes?.data || [];
  const milestones = milestonesRes?.data || [];
  const raidItems = raidRes?.data || [];
  const changes = changesRes?.data || [];

  if (!project) return null;

  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const blockedTasks = tasks.filter((t) => t.status === "Blocked");
  const criticalRisks = raidItems.filter((r) => r.severity === "Critical" || r.severity === "High");
  const pendingApprovals = changes.filter((c) => c.status === "In Approval" || c.status === "Ready for Approval");

  const wordingVariants = [
    {
      oneLiner: `${project.name} is tracking at ${project.health.toUpperCase()} with ${project.progress}% aggregate completion across core milestones.`,
      sprintSummary: `During the current cycle, the engineering squad achieved ${completedTasks} completed work packages. Delivery velocity remains stable, with immediate attention required on ${criticalRisks.length} elevated risks.`,
      governanceOutlook: `Decision velocity is satisfactory; however, ${pendingApprovals.length} pending change approvals must be resolved to protect the ${project.targetDate} baseline commitment.`,
    },
    {
      oneLiner: `Executive assessment: ${project.name} exhibits steady progress (${project.progress}%) under ${project.health} governance monitoring.`,
      sprintSummary: `Key technical deliverables are advancing with ${completedTasks} items closed. Critical focus is centered on resolving external vendor token dependencies before next gate sign-off.`,
      governanceOutlook: `Baseline cost commitments remain intact. Approver decision turnaround is within the 3-day SLA threshold.`,
    },
    {
      oneLiner: `Operational briefing: Overall status ${project.health.toUpperCase()} for ${project.name}, targeting final rollout by ${project.targetDate}.`,
      sprintSummary: `All work packages adhere to security compliance controls. ${blockedTasks.length > 0 ? `${blockedTasks.length} blocked items currently under active mitigation.` : "No active work blockers detected."}`,
      governanceOutlook: `Recommended action: Convene steering committee to ratify change requests and unblock biometric HSM scale-out.`,
    },
  ];

  const currentVariant = wordingVariants[variantIndex % wordingVariants.length];

  const handleRegenerate = () => {
    setVariantIndex((v) => v + 1);
    toast.success("Briefing updated with deterministic wording variant");
  };

  const handleCopy = () => {
    const text = `PLANOVA EXECUTIVE BRIEFING: ${project.name} (${project.code})\nDate: ${DEMO_TODAY}\nHealth: ${project.health}\nProgress: ${project.progress}%\n\n${currentVariant.oneLiner}\n\n${currentVariant.sprintSummary}\n\nKey Milestones: ${milestones.map((m) => `${m.name} (${m.targetDate})`).join("; ")}\n\nGovernance: ${currentVariant.governanceOutlook}`;
    navigator.clipboard?.writeText?.(text);
    toast.success("Briefing copied to clipboard");
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <ProjectHeader project={project} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Strip & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Executive Project Briefing
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400">
                Variant #{variantIndex + 1}
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] mt-1">
              One-page synthesized executive summary grounded in verified project records and real delivery evidence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleRegenerate}>
              <ArrowsClockwise className="w-4 h-4 mr-1.5" />
              Regenerate
            </Button>
            <Button size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-1.5" />
              Copy Briefing
            </Button>
          </div>
        </div>

        {/* AI Transparency Banner */}
        <SimulatedAIIndicator
          sourceEvidence={[
            `${tasks.length} Task Records`,
            `${milestones.length} Milestone Commitments`,
            `${criticalRisks.length} Critical RAID Items`,
          ]}
          whyShown="Synthesized from active project records, milestone target commitments, and open risk exposure."
        />

        {/* The Briefing Document Sheet */}
        <Card className="p-8 sm:p-10 space-y-8 bg-[var(--surface)] border-[var(--border)] shadow-sm">
          {/* Briefing Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
            <div>
              <span className="font-mono text-xs font-bold text-[var(--color-brand)] uppercase tracking-wider">
                {project.code} · Delivery Governance Briefing
              </span>
              <h2 className="text-2xl font-bold text-[var(--foreground)] mt-1">
                {project.name}
              </h2>
              <p className="text-xs text-[var(--muted)] mt-1">
                Generated: {DEMO_TODAY} · Delivery Method: {project.method} · PM: Fatima Al-Mansoor
              </p>
            </div>
            <ProjectHealthBadge health={project.health} />
          </div>

          {/* Section 1: Executive Summary */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              1. Executive Statement
            </h3>
            <p className="text-sm font-semibold text-[var(--foreground)] leading-relaxed bg-[var(--surface-raised)]/60 p-4 rounded-xl border border-[var(--border)]">
              {currentVariant.oneLiner}
            </p>
          </div>

          {/* Section 2: Progress & Delivery Velocity */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              2. Progress & Execution Velocity
            </h3>
            <p className="text-xs text-[var(--foreground)] leading-relaxed">
              {currentVariant.sprintSummary}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[var(--surface-raised)]/40 border border-[var(--border)]">
                <span className="text-[10px] text-[var(--muted)] block">Completed Tasks</span>
                <span className="text-base font-bold text-[var(--foreground)]">{completedTasks} / {tasks.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface-raised)]/40 border border-[var(--border)]">
                <span className="text-[10px] text-[var(--muted)] block">Aggregate Progress</span>
                <span className="text-base font-bold text-emerald-600">{project.progress}%</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface-raised)]/40 border border-[var(--border)]">
                <span className="text-[10px] text-[var(--muted)] block">Target Finish</span>
                <span className="text-base font-mono font-bold text-[var(--foreground)]">{project.targetDate}</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface-raised)]/40 border border-[var(--border)]">
                <span className="text-[10px] text-[var(--muted)] block">Active Blockers</span>
                <span className={`text-base font-bold ${blockedTasks.length > 0 ? "text-red-500" : "text-[var(--foreground)]"}`}>
                  {blockedTasks.length}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Upcoming Critical Milestones */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              3. Critical Milestone Commitments
            </h3>
            <div className="space-y-2">
              {milestones.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-raised)]/40 border border-[var(--border)] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Flag weight={m.isKey ? "fill" : "regular"} className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-[var(--foreground)]">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[var(--muted)]">{m.targetDate}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.achievedAt ? "bg-emerald-500/10 text-emerald-600" : "bg-[var(--surface-raised)] text-[var(--muted)]"
                    }`}>
                      {m.achievedAt ? "Achieved" : "Scheduled"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Governance & Key Decisions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              4. Decisions & Governance Outlook
            </h3>
            <p className="text-xs text-[var(--foreground)] leading-relaxed">
              {currentVariant.governanceOutlook}
            </p>
          </div>

          {/* Briefing Footer */}
          <div className="pt-6 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]">
            <span>Prepared for PLANOVA Executive Steering Committee</span>
            <span className="font-mono text-[10px]">Security Classification: Internal</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
