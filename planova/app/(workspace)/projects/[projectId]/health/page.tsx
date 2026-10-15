"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectHealthBadge } from "@/components/ui/ProjectHealthBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/formatting/format";
import type { Health, HealthDimension, DimensionHealth } from "@/lib/domain/types";
import { toast } from "sonner";
import {
  Heartbeat,
  PencilSimple,
  Clock,
  Coins,
  FileText,
  Users,
  ArrowsClockwise,
  CheckCircle,
  Warning,
  Pulse,
} from "@phosphor-icons/react";

export default function ProjectHealthPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;
  const organisationId = useSessionStore((s) => s.organisationId);

  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [overallHealth, setOverallHealth] = useState<Health>("On Track");
  const [summary, setSummary] = useState("");

  const [scheduleHealth, setScheduleHealth] = useState<Health>("On Track");
  const [costHealth, setCostHealth] = useState<Health>("On Track");
  const [scopeHealth, setScopeHealth] = useState<Health>("On Track");
  const [resourceHealth, setResourceHealth] = useState<Health>("On Track");

  const { data: projectRes, isLoading } = useQuery({
    queryKey: ["project", projectId, organisationId],
    queryFn: () => apiClient.getProject(projectId),
  });

  const { data: activityRes } = useQuery({
    queryKey: ["activity", projectId, organisationId],
    queryFn: () => apiClient.getActivityEvents(projectId),
  });

  const project = projectRes?.data;
  const activityEvents = activityRes?.data || [];
  const healthEvents = activityEvents.filter((e) => e.summary.toLowerCase().includes("health") || e.verb.includes("health"));

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });
  const people = peopleRes?.data || [];

  const updateMutation = useMutation({
    mutationFn: (input: {
      overall: Health;
      dimensions: Record<HealthDimension, DimensionHealth>;
      summary: string;
    }) => apiClient.updateProjectHealth(projectId, input.overall, input.dimensions, input.summary),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["activity", projectId] });
      toast.success(`Project health updated to ${res.data.health}`);
      setUpdateModalOpen(false);
      setSummary("");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to update health");
    },
  });

  const handleOpenModal = () => {
    if (!project) return;
    setOverallHealth(project.health);
    if (project.dimensions) {
      setScheduleHealth(project.dimensions.schedule?.health || "On Track");
      setCostHealth(project.dimensions.cost?.health || "On Track");
      setScopeHealth(project.dimensions.scope?.health || "On Track");
      setResourceHealth(project.dimensions.resource?.health || "On Track");
    }
    setUpdateModalOpen(true);
  };

  const handleSaveHealth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      toast.error("Please provide an explanatory rationale summary");
      return;
    }

    const dimensions: Record<HealthDimension, DimensionHealth> = {
      schedule: {
        health: scheduleHealth,
        rationale: "Schedule checkpoint verified against baseline commitments.",
      },
      cost: {
        health: costHealth,
        rationale: "Budget commitments reconciled with financial general ledger.",
      },
      scope: {
        health: scopeHealth,
        rationale: "Deliverable acceptance criteria confirmed with business sponsor.",
      },
      resource: {
        health: resourceHealth,
        rationale: "Team velocity and capacity checked for upcoming sprints.",
      },
    };

    updateMutation.mutate({
      overall: overallHealth,
      dimensions,
      summary: summary.trim(),
    });
  };

  if (!project) return null;

  const dims: Record<HealthDimension, DimensionHealth> = project.dimensions || {
    schedule: { health: "On Track", rationale: "Milestones progressing on plan." },
    cost: { health: "On Track", rationale: "Spend within variance envelope." },
    scope: { health: "On Track", rationale: "Deliverables aligned with charter." },
    resource: { health: "On Track", rationale: "Team fully staffed." },
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <ProjectHeader project={project} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Health & Governance Evaluation
              </h1>
              <ProjectHealthBadge health={project.health} />
            </div>
            <p className="text-xs text-[var(--muted)] mt-1">
              Multi-dimensional delivery telemetry across Schedule, Cost, Scope, and Resource domains with auditable rationale.
            </p>
          </div>

          <Button onClick={handleOpenModal}>
            <PencilSimple className="w-4 h-4 mr-1.5" />
            Publish Health Update
          </Button>
        </div>

        {/* 4 Dimensions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Schedule */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-[var(--foreground)]">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Schedule</span>
              </span>
              <ProjectHealthBadge health={dims.schedule.health} />
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              {dims.schedule.rationale || "All scheduled milestone dates currently within approved baseline."}
            </p>
          </Card>

          {/* Cost */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-[var(--foreground)]">
                <Coins className="w-4 h-4 text-emerald-500" />
                <span>Cost</span>
              </span>
              <ProjectHealthBadge health={dims.cost.health} />
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              {dims.cost.rationale || "Actual expenditure and commitments tracking within authorized variance envelope."}
            </p>
          </Card>

          {/* Scope */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-[var(--foreground)]">
                <FileText className="w-4 h-4 text-purple-500" />
                <span>Scope</span>
              </span>
              <ProjectHealthBadge health={dims.scope.health} />
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              {dims.scope.rationale || "Deliverable boundaries conform to approved statement of work."}
            </p>
          </Card>

          {/* Resource */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-[var(--foreground)]">
                <Users className="w-4 h-4 text-amber-500" />
                <span>Resource</span>
              </span>
              <ProjectHealthBadge health={dims.resource.health} />
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              {dims.resource.rationale || "Squad allocations aligned with sprint commitments."}
            </p>
          </Card>
        </div>

        {/* Health History Timeline */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--foreground)]">Status & Health History</h3>
            <span className="text-xs font-mono text-[var(--muted)]">v{project.rowVersion}</span>
          </div>

          <div className="space-y-4 pt-2">
            {healthEvents.length === 0 ? (
              <div className="p-4 rounded-xl bg-[var(--surface-raised)]/40 text-xs text-[var(--muted)]">
                Initial baseline health published. All subsequent health updates will record an auditable chronological entry here.
              </div>
            ) : (
              healthEvents.map((evt) => {
                const actor = people.find((p) => p.id === evt.actorId);
                return (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-xl bg-[var(--surface-raised)]/40 border border-[var(--border)] space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[var(--foreground)]">{actor?.name || evt.actorId}</span>
                      <span className="font-mono text-[10px] text-[var(--muted)]">
                        {formatDateTime(evt.at)}
                      </span>
                    </div>
                    <p className="text-[var(--muted)]">{evt.summary}</p>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Publish Health Modal */}
      <Modal
        open={updateModalOpen}
        onOpenChange={setUpdateModalOpen}
        title="Publish Project Health Statement"
        description="Formal governance update. Updates the project status across Portfolio, Pulse, and Executive Briefing."
      >
        <form onSubmit={handleSaveHealth} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Overall Project Health <span className="text-red-500">*</span>
            </label>
            <select
              value={overallHealth}
              onChange={(e) => setOverallHealth(e.target.value as Health)}
              className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)] font-bold"
            >
              <option value="On Track">On Track (Green) — Progressing within baseline</option>
              <option value="At Risk">At Risk (Amber) — Variances require active mitigation</option>
              <option value="Critical">Critical (Red) — Milestone or budget in jeopardy</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[var(--surface-raised)]/50 border border-[var(--border)]">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--muted)]">Schedule Health</label>
              <select
                value={scheduleHealth}
                onChange={(e) => setScheduleHealth(e.target.value as Health)}
                className="w-full text-xs rounded-lg bg-[var(--surface)] border border-[var(--border)] p-2 text-[var(--foreground)]"
              >
                <option value="On Track">On Track</option>
                <option value="At Risk">At Risk</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--muted)]">Cost Health</label>
              <select
                value={costHealth}
                onChange={(e) => setCostHealth(e.target.value as Health)}
                className="w-full text-xs rounded-lg bg-[var(--surface)] border border-[var(--border)] p-2 text-[var(--foreground)]"
              >
                <option value="On Track">On Track</option>
                <option value="At Risk">At Risk</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--muted)]">Scope Health</label>
              <select
                value={scopeHealth}
                onChange={(e) => setScopeHealth(e.target.value as Health)}
                className="w-full text-xs rounded-lg bg-[var(--surface)] border border-[var(--border)] p-2 text-[var(--foreground)]"
              >
                <option value="On Track">On Track</option>
                <option value="At Risk">At Risk</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--muted)]">Resource Health</label>
              <select
                value={resourceHealth}
                onChange={(e) => setResourceHealth(e.target.value as Health)}
                className="w-full text-xs rounded-lg bg-[var(--surface)] border border-[var(--border)] p-2 text-[var(--foreground)]"
              >
                <option value="On Track">On Track</option>
                <option value="At Risk">At Risk</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Explanatory Rationale Summary <span className="text-red-500">*</span>
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Schedule Amber due to vendor security token review; mitigation path in progress."
              rows={3}
              required
              className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setUpdateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={updateMutation.isPending}>
              Publish Update
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
