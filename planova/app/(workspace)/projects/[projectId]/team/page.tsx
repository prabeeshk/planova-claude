"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { ResourceAllocation } from "@/lib/domain/types";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Trash,
  Warning,
  Clock,
  EnvelopeSimple,
  PencilSimple,
} from "@phosphor-icons/react";

export default function ProjectTeamPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;
  const organisationId = useSessionStore((s) => s.organisationId);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [role, setRole] = useState("Senior Engineer");
  const [percent, setPercent] = useState(80);

  const { data: projectRes } = useQuery({
    queryKey: ["project", projectId, organisationId],
    queryFn: () => apiClient.getProject(projectId),
  });

  const { data: allocationsRes, isLoading: loadingAllocations } = useQuery({
    queryKey: ["allocations", projectId, organisationId],
    queryFn: () => apiClient.getAllocations({ projectId }),
  });

  const { data: allAllocationsRes } = useQuery({
    queryKey: ["allocations", "all", organisationId],
    queryFn: () => apiClient.getAllocations(),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const project = projectRes?.data;
  const allocations = allocationsRes?.data || [];
  const allAllocations = allAllocationsRes?.data || [];
  const people = peopleRes?.data || [];

  // Compute total allocation across all projects for each person
  const totalAllocationsByUser = allAllocations.reduce((acc, a) => {
    acc[a.userId] = (acc[a.userId] || 0) + a.percent;
    return acc;
  }, {} as Record<string, number>);

  const createMutation = useMutation({
    mutationFn: (input: any) => apiClient.createAllocation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocations", projectId] });
      queryClient.invalidateQueries({ queryKey: ["allocations", "all"] });
      toast.success("Team member allocated");
      setAddModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to allocate team member");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, percent }: { id: string; percent: number }) =>
      apiClient.updateAllocation(id, percent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocations", projectId] });
      queryClient.invalidateQueries({ queryKey: ["allocations", "all"] });
      toast.success("Allocation updated");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to update allocation");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteAllocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocations", projectId] });
      queryClient.invalidateQueries({ queryKey: ["allocations", "all"] });
      toast.success("Member removed from squad");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to remove member");
    },
  });

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error("Please select a team member");
      return;
    }
    createMutation.mutate({
      projectId,
      userId: selectedUserId,
      role: role.trim() || "Engineer",
      percent: Number(percent),
    });
  };

  if (!project) return null;

  const totalProjectHoursPerWeek = allocations.reduce((sum, a) => sum + (a.percent / 100) * 40, 0);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <ProjectHeader project={project} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Strip & Aggregate Capacity */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Project Squad & Allocations
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[var(--surface-raised)] text-[var(--muted)]">
                {allocations.length} members · {totalProjectHoursPerWeek} hrs/wk
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] mt-1">
              Named membership, role assignments, and committed capacity with cross-project over-allocation detection.
            </p>
          </div>

          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Member
          </Button>
        </div>

        {/* Squad Members Grid */}
        {loadingAllocations ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-[var(--surface-raised)] animate-pulse" />
            ))}
          </div>
        ) : allocations.length === 0 ? (
          <Card className="p-12 text-center space-y-4">
            <Users className="w-12 h-12 text-[var(--muted)] mx-auto opacity-50" />
            <h3 className="text-base font-bold text-[var(--foreground)]">No Squad Members Allocated</h3>
            <p className="text-xs text-[var(--muted)] max-w-md mx-auto">
              Allocate engineers, analysts, and designers to staff this delivery commitment.
            </p>
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Allocate First Member
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allocations.map((alloc) => {
              const person = people.find((p) => p.id === alloc.userId);
              const globalAlloc = totalAllocationsByUser[alloc.userId] || alloc.percent;
              const isOverallocated = globalAlloc > 100;
              const committedHours = Math.round((alloc.percent / 100) * 40);

              return (
                <Card
                  key={alloc.id}
                  className={`p-5 flex flex-col justify-between space-y-4 transition-all hover:border-[var(--color-brand)]/40 ${
                    isOverallocated ? "border-amber-500/40 bg-amber-500/5" : ""
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-brand)]/10 text-[var(--color-brand)] font-bold flex items-center justify-center text-sm border border-[var(--color-brand)]/20 shrink-0">
                          {person ? person.name.slice(0, 2).toUpperCase() : "US"}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[var(--foreground)] line-clamp-1">
                            {person?.name || alloc.userId}
                          </h3>
                          <p className="text-xs text-[var(--muted)] line-clamp-1">{alloc.role}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(alloc.id)}
                        className="text-[var(--muted)] hover:text-red-500 p-1 rounded transition-colors"
                        title="Remove member"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>

                    {isOverallocated && (
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
                        <Warning className="w-4 h-4 shrink-0 text-amber-600" />
                        <span>
                          <strong>{globalAlloc}% total allocation</strong> across all commitments (over capacity).
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Allocation controls */}
                  <div className="space-y-2 pt-3 border-t border-[var(--border)] text-xs text-[var(--muted)]">
                    <div className="flex items-center justify-between">
                      <span>Project Commitment</span>
                      <span className="font-mono font-bold text-[var(--foreground)]">
                        {alloc.percent}% ({committedHours}h/wk)
                      </span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-[var(--surface-raised)] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isOverallocated ? "bg-amber-500" : "bg-[var(--color-brand)]"
                        }`}
                        style={{ width: `${Math.min(100, alloc.percent)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span>Quick adjust %:</span>
                      <div className="flex items-center gap-1">
                        {[25, 50, 80, 100].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => updateMutation.mutate({ id: alloc.id, percent: pct })}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                              alloc.percent === pct
                                ? "bg-[var(--color-brand)] text-white"
                                : "bg-[var(--surface-raised)] text-[var(--muted)] hover:text-[var(--foreground)]"
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <Modal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        title="Allocate Squad Member"
        description="Assign a person and specify their commitment percentage for this project."
      >
        <form onSubmit={handleAddMember} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Person <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)]"
            >
              <option value="">Select team member...</option>
              {people.map((p) => {
                const currentAlloc = totalAllocationsByUser[p.id] || 0;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.title} (Currently at {currentAlloc}%)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">Project Role</label>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Lead Backend Architect"
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[var(--foreground)]">Allocation Percentage</span>
              <span className="font-mono font-bold text-[var(--color-brand)]">
                {percent}% ({Math.round((percent / 100) * 40)} hrs/week)
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="secondary" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={createMutation.isPending}>
              Confirm Allocation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
