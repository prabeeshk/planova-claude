"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { RiskMatrix } from "@/components/data-display/RiskMatrix";
import { deriveRisk } from "@/lib/domain/risk";
import { DEMO_TODAY, isOverdue } from "@/lib/demo-data/clock";
import type { RaidItem, RaidType, RaidStatus } from "@/lib/domain/types";
import { toast } from "sonner";
import {
  ShieldCheck,
  Plus,
  Warning,
  Funnel,
  ArrowRight,
  ShieldWarning,
  CalendarCheck,
  ArrowsClockwise,
} from "@phosphor-icons/react";

export default function ProjectRaidPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;
  const organisationId = useSessionStore((s) => s.organisationId);

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New item form state
  const [newType, setNewType] = useState<RaidType>("Risk");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newProbability, setNewProbability] = useState(3);
  const [newImpact, setNewImpact] = useState(3);
  const [newOwnerId, setNewOwnerId] = useState("");
  const [newResponse, setNewResponse] = useState("");
  const [newReviewDate, setNewReviewDate] = useState("2026-10-25");

  const { data: projectRes } = useQuery({
    queryKey: ["project", projectId, organisationId],
    queryFn: () => apiClient.getProject(projectId),
  });

  const { data: raidRes, isLoading: loadingRaid } = useQuery({
    queryKey: ["raid", projectId, organisationId],
    queryFn: () => apiClient.getRaidItems({ projectId }),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const project = projectRes?.data;
  const items = raidRes?.data || [];
  const people = peopleRes?.data || [];

  const derived = deriveRisk(newProbability, newImpact);

  const createMutation = useMutation({
    mutationFn: (input: any) => apiClient.createRaidItem(input),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["raid", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success(`RAID item ${res.data.code} logged successfully`);
      setCreateModalOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewResponse("");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to log RAID item");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please provide a title");
      return;
    }
    createMutation.mutate({
      projectId,
      type: newType,
      title: newTitle.trim(),
      description: newDescription.trim(),
      probability: newProbability,
      impact: newImpact,
      ownerId: newOwnerId || (people[0]?.id || ""),
      response: newResponse.trim() || "Mitigate and monitor through weekly governance checkpoint",
      reviewDate: newReviewDate,
    });
  };

  const filteredItems = items.filter((item) => {
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    return true;
  });

  const criticalRisks = items.filter((i) => i.type === "Risk" && (i.severity === "Critical" || i.severity === "High"));
  const openIssues = items.filter((i) => i.type === "Issue" && i.status !== "Closed" && i.status !== "Resolved");
  const overdueReviews = items.filter((i) => isOverdue(i.reviewDate) && i.status !== "Closed");

  if (!project) return null;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <ProjectHeader project={project} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Strip & Metric Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                RAID Log
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[var(--surface-raised)] text-[var(--muted)]">
                {items.length} records
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] mt-1">
              Active Risks, Assumptions, Issues, and Dependencies governed by the standard 5×5 probability × impact policy matrix.
            </p>
          </div>

          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Log RAID Item
          </Button>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 flex items-center gap-3 border-red-500/25 bg-red-500/5">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-600 flex items-center justify-center shrink-0">
              <ShieldWarning className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-[var(--foreground)]">{criticalRisks.length}</div>
              <div className="text-xs text-[var(--muted)]">Critical / High Risks</div>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3 border-amber-500/25 bg-amber-500/5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
              <Warning className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-[var(--foreground)]">{openIssues.length}</div>
              <div className="text-xs text-[var(--muted)]">Active Impediment Issues</div>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-raised)] text-[var(--muted)] flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-[var(--foreground)]">{overdueReviews.length}</div>
              <div className="text-xs text-[var(--muted)]">Overdue Governance Reviews</div>
            </div>
          </Card>
        </div>

        {/* 5x5 Heatmap & Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <RiskMatrix items={items} />
          </div>

          {/* List and Table in Col 2-3 */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {(["all", "Risk", "Assumption", "Issue", "Dependency"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      typeFilter === t
                        ? "bg-[var(--color-brand)] text-white"
                        : "text-[var(--muted)] hover:text-[var(--foreground)] bg-[var(--surface-raised)]"
                    }`}
                  >
                    {t === "all" ? "All Types" : t}
                  </button>
                ))}
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] px-2.5 py-1 text-[var(--foreground)]"
              >
                <option value="all">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Monitoring">Monitoring</option>
                <option value="Escalated">Escalated</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* RAID Items List */}
            {loadingRaid ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-[var(--surface-raised)] animate-pulse" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <Card className="p-8 text-center space-y-3">
                <ShieldCheck className="w-10 h-10 text-[var(--muted)] mx-auto opacity-50" />
                <h3 className="text-sm font-bold text-[var(--foreground)]">No Matching RAID Items</h3>
                <p className="text-xs text-[var(--muted)]">Adjust filters or log a new risk/issue.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => {
                  const overdue = isOverdue(item.reviewDate) && item.status !== "Closed";
                  const owner = people.find((p) => p.id === item.ownerId);

                  return (
                    <Card
                      key={item.id}
                      className="p-4 transition-all hover:border-[var(--color-brand)]/40 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-[var(--color-brand)] bg-[var(--color-brand)]/10 px-2 py-0.5 rounded">
                              {item.code}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--surface-raised)] text-[var(--foreground)]">
                              {item.type}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.severity === "Critical"
                                  ? "bg-red-500/15 text-red-600"
                                  : item.severity === "High"
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                  : "bg-blue-500/15 text-blue-600"
                              }`}
                            >
                              Score {item.score} · {item.severity}
                            </span>
                          </div>
                          <Link
                            href={`/governance/raid/${item.id}`}
                            className="text-sm font-bold text-[var(--foreground)] hover:text-[var(--color-brand)] line-clamp-1"
                          >
                            {item.title}
                          </Link>
                        </div>
                        <StatusChip status={item.status} />
                      </div>

                      <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border)] text-xs text-[var(--muted)]">
                        <div className="flex items-center gap-4">
                          <span>Owner: <strong className="text-[var(--foreground)]">{owner?.name || "Unassigned"}</strong></span>
                          <span className={overdue ? "text-red-500 font-semibold" : ""}>
                            Review: <strong className="font-mono">{item.reviewDate}</strong>
                          </span>
                        </div>
                        <Link
                          href={`/governance/raid/${item.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-[var(--color-brand)] hover:underline"
                        >
                          <span>Review & History</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log RAID Modal */}
      <Modal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        title="Log RAID Item"
        description="Record a Risk, Assumption, Issue, or Dependency with standard matrix scoring."
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--foreground)]">Item Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as RaidType)}
                className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)]"
              >
                <option value="Risk">Risk</option>
                <option value="Assumption">Assumption</option>
                <option value="Issue">Issue</option>
                <option value="Dependency">Dependency</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--foreground)]">Next Review Date</label>
              <input
                type="date"
                value={newReviewDate}
                onChange={(e) => setNewReviewDate(e.target.value)}
                required
                className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)] font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Core Banking Latency Variance under Load"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">Description & Impact</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Detail root cause, affected dependencies, and potential delivery consequences..."
              rows={3}
              className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)]"
            />
          </div>

          {/* 5x5 Probability and Impact Sliders */}
          <div className="p-4 rounded-xl bg-[var(--surface-raised)]/60 border border-[var(--border)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--foreground)]">5×5 Risk Score Calculator</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--foreground)]">
                Score: {derived.score} ({derived.severity})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted)]">Probability (1–5)</span>
                  <span className="font-bold text-[var(--foreground)]">{newProbability}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={newProbability}
                  onChange={(e) => setNewProbability(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted)]">Impact (1–5)</span>
                  <span className="font-bold text-[var(--foreground)]">{newImpact}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={newImpact}
                  onChange={(e) => setNewImpact(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">Accountable Owner</label>
            <select
              value={newOwnerId}
              onChange={(e) => setNewOwnerId(e.target.value)}
              className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)]"
            >
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">Mitigation / Response Strategy</label>
            <textarea
              value={newResponse}
              onChange={(e) => setNewResponse(e.target.value)}
              placeholder="e.g. Provision additional HSM read replicas and execute failover test..."
              rows={2}
              className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={createMutation.isPending}>
              Log Item
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
