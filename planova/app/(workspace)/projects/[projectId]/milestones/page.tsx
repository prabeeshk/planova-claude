"use client";

import React, { useState } from "react";
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
import { formatDate } from "@/lib/formatting/format";
import { DEMO_TODAY, isOverdue } from "@/lib/demo-data/clock";
import type { Milestone } from "@/lib/domain/types";
import { toast } from "sonner";
import {
  Flag,
  Plus,
  Star,
  CheckCircle,
  Warning,
  CalendarCheck,
  User as UserIcon,
} from "@phosphor-icons/react";

export default function ProjectMilestonesPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;
  const organisationId = useSessionStore((s) => s.organisationId);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [isKey, setIsKey] = useState(false);

  const { data: projectRes } = useQuery({
    queryKey: ["project", projectId, organisationId],
    queryFn: () => apiClient.getProject(projectId),
  });

  const { data: milestonesRes, isLoading: loadingMilestones } = useQuery({
    queryKey: ["milestones", projectId, organisationId],
    queryFn: () => apiClient.getMilestones({ projectId }),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const project = projectRes?.data;
  const milestones = milestonesRes?.data || [];
  const people = peopleRes?.data || [];

  const createMutation = useMutation({
    mutationFn: (input: {
      projectId: string;
      name: string;
      targetDate: string;
      ownerId: string;
      isKey: boolean;
    }) => apiClient.createMilestone(input),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["milestones", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success(`Milestone "${res.data.name}" created`);
      setCreateModalOpen(false);
      setName("");
      setTargetDate("");
      setIsKey(false);
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to create milestone");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetDate) {
      toast.error("Please fill in required fields");
      return;
    }
    createMutation.mutate({
      projectId,
      name: name.trim(),
      targetDate,
      ownerId: ownerId || (people[0]?.id || ""),
      isKey,
    });
  };

  if (!project) return null;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <ProjectHeader project={project} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Project Milestones
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[var(--surface-raised)] text-[var(--muted)]">
                {milestones.length}
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] mt-1">
              Zero-duration markers representing critical delivery commitments and contractual checkpoints.
            </p>
          </div>

          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Milestone
          </Button>
        </div>

        {/* Milestones Grid / List */}
        {loadingMilestones ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-[var(--surface-raised)] animate-pulse" />
            ))}
          </div>
        ) : milestones.length === 0 ? (
          <Card className="p-12 text-center space-y-4">
            <Flag className="w-12 h-12 text-[var(--muted)] mx-auto opacity-50" />
            <h3 className="text-base font-bold text-[var(--foreground)]">No Milestones Defined</h3>
            <p className="text-xs text-[var(--muted)] max-w-md mx-auto">
              Establish key delivery milestones to track schedule performance and baseline variance.
            </p>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Create First Milestone
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {milestones.map((m) => {
              const overdue = isOverdue(m.targetDate) && !m.achievedAt;
              const owner = people.find((p) => p.id === m.ownerId);

              return (
                <Card
                  key={m.id}
                  className={`p-5 flex flex-col justify-between space-y-4 transition-all hover:border-[var(--color-brand)]/40 ${
                    m.isKey ? "border-amber-500/40 bg-amber-500/5" : ""
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {m.isKey && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            <Star weight="fill" className="w-3 h-3 text-amber-500" />
                            <span>Key Gate</span>
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-[var(--muted)]">v{m.rowVersion}</span>
                      </div>
                      <StatusChip status={m.achievedAt ? "Completed" : overdue ? "Critical" : "Not Started"} />
                    </div>

                    <h3 className="text-sm font-bold text-[var(--foreground)] line-clamp-2">
                      {m.name}
                    </h3>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-[var(--border)] text-xs text-[var(--muted)]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CalendarCheck className="w-3.5 h-3.5" />
                        <span>Target Date</span>
                      </span>
                      <span className={`font-mono font-bold ${overdue ? "text-red-500" : "text-[var(--foreground)]"}`}>
                        {m.targetDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Baseline Date</span>
                      <span className="font-mono text-[var(--muted)]">{m.baselineDate}</span>
                    </div>

                    {owner && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5" />
                          <span>Owner</span>
                        </span>
                        <span className="font-medium text-[var(--foreground)] truncate max-w-[130px]">
                          {owner.name}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* New Milestone Modal */}
      <Modal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        title="Create Project Milestone"
        description="Milestones are zero-duration checkpoints that mark key transitions or approval gates."
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Milestone Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. UAE Central Bank Integration Sign-Off"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Target Commitment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
              className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)] font-mono"
            />
            <p className="text-[11px] text-[var(--muted)]">
              Zero-duration rule: A milestone occurs on a single specific date.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">Accountable Owner</label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)]"
            >
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isKey"
              checked={isKey}
              onChange={(e) => setIsKey(e.target.checked)}
              className="w-4 h-4 rounded text-[var(--color-brand)] focus:ring-[var(--color-brand)] cursor-pointer"
            />
            <label htmlFor="isKey" className="text-xs font-medium text-[var(--foreground)] cursor-pointer">
              Mark as Strategic Key Gate (elevates to Executive Briefing and Pulse)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={createMutation.isPending}>
              Create Milestone
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
