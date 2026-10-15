"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { TASK_TRANSITIONS } from "@/lib/domain/transitions";
import type { TaskStatus, Priority, ChecklistItem } from "@/lib/domain/types";
import { StatusChip } from "@/components/ui/StatusChip";
import { PriorityPill } from "@/components/ui/PriorityPill";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/formatting/format";
import { toast } from "sonner";
import {
  ArrowLeft,
  Warning,
  Plus,
  Trash,
  ArrowsClockwise,
  ShieldWarning,
} from "@phosphor-icons/react";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;
  const taskId = params.taskId as string;
  const organisationId = useSessionStore((s) => s.organisationId);

  const [newChecklistLabel, setNewChecklistLabel] = useState("");
  const [blockerModalOpen, setBlockerModalOpen] = useState(false);
  const [blockerReason, setBlockerReason] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Queries
  const { data: projectRes } = useQuery({
    queryKey: ["project", projectId, organisationId],
    queryFn: () => apiClient.getProject(projectId),
  });

  const {
    data: taskRes,
    isLoading: loadingTask,
    error: taskError,
  } = useQuery({
    queryKey: ["task", taskId, organisationId],
    queryFn: () => apiClient.getTask(taskId),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const task = taskRes?.data;
  const project = projectRes?.data;
  const people = peopleRes?.data || [];

  // Mutations
  const transitionMutation = useMutation({
    mutationFn: ({ nextStatus, reason }: { nextStatus: TaskStatus; reason?: string }) =>
      apiClient.transitionTask(taskId, nextStatus, reason),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["activity", projectId] });
      toast.success(`Task status changed to ${res.data.status}`);
      setBlockerModalOpen(false);
      setBlockerReason("");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to transition task");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updates: any) => apiClient.updateTask(taskId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Task updated");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Update failed");
    },
  });

  if (loadingTask) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="h-6 w-32 bg-[var(--surface-raised)] rounded animate-pulse" />
        <div className="h-10 w-96 bg-[var(--surface-raised)] rounded animate-pulse" />
        <div className="h-64 bg-[var(--surface-raised)] rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (taskError || !task) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl border border-red-500/20 bg-red-500/5 text-center space-y-4">
        <ShieldWarning className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-[var(--foreground)]">Task Not Found</h2>
        <p className="text-xs text-[var(--muted)]">
          The requested task could not be located in this organisation scope.
        </p>
        <Button onClick={() => router.push(`/projects/${projectId}/tasks`)}>
          Back to Tasks
        </Button>
      </div>
    );
  }

  const legalNextStatuses = TASK_TRANSITIONS[task.status] || [];

  const handleStatusClick = (status: TaskStatus) => {
    if (status === "Blocked") {
      setBlockerModalOpen(true);
    } else {
      transitionMutation.mutate({ nextStatus: status });
    }
  };

  const handleToggleChecklist = (item: ChecklistItem) => {
    const updated = task.checklist.map((c) =>
      c.id === item.id ? { ...c, done: !c.done } : c
    );
    const allDone = updated.length > 0 && updated.every((c) => c.done);
    const anyDone = updated.filter((c) => c.done).length;
    const progress = Math.round((anyDone / updated.length) * 100);

    updateMutation.mutate({
      checklist: updated,
      progress: allDone && task.status !== "Completed" ? 100 : progress,
    });
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistLabel.trim()) return;
    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      label: newChecklistLabel.trim(),
      done: false,
    };
    const updated = [...task.checklist, newItem];
    updateMutation.mutate({ checklist: updated });
    setNewChecklistLabel("");
  };

  const handleDeleteChecklist = (itemId: string) => {
    const updated = task.checklist.filter((c) => c.id !== itemId);
    updateMutation.mutate({ checklist: updated });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in-50 duration-200">
      {/* Back and Breadcrumbs */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/projects/${projectId}/tasks`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {project?.name || "Tasks"}</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded font-mono font-medium bg-[var(--surface-raised)] text-[var(--muted)]">
            v{task.rowVersion}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-500/10"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash className="w-4 h-4 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Checklist */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[var(--color-brand)] bg-[var(--color-brand)]/10 px-2 py-0.5 rounded">
                  {task.code}
                </span>
                <PriorityPill priority={task.priority} />
                <StatusChip status={task.status} />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                {task.title}
              </h1>
            </div>

            {task.description && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                  Description
                </label>
                <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed bg-[var(--surface-raised)]/50 p-4 rounded-xl border border-[var(--border)]">
                  {task.description}
                </p>
              </div>
            )}

            {/* Blocker alert if blocked */}
            {task.status === "Blocked" && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 space-y-1">
                <div className="flex items-center gap-2 text-red-600 font-bold text-xs">
                  <Warning className="w-4 h-4" />
                  <span>Work Currently Blocked</span>
                </div>
                <p className="text-xs text-red-700 dark:text-red-300">
                  {task.blockedReason || "No explicit reason recorded."}
                </p>
              </div>
            )}

            {/* Checklist Section */}
            <div className="space-y-3 pt-4 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--foreground)]">Completion Checklist</h3>
                  <p className="text-xs text-[var(--muted)]">
                    {task.checklist.filter((c) => c.done).length} of {task.checklist.length} items complete
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-[var(--muted)]">
                  {task.progress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full rounded-full bg-[var(--surface-raised)] overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${task.progress}%` }}
                />
              </div>

              {/* Items List */}
              <div className="space-y-2 pt-2">
                {task.checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[var(--surface-raised)]/60 hover:bg-[var(--surface-raised)] transition-colors group"
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1 select-none">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => handleToggleChecklist(item)}
                        className="w-4 h-4 rounded text-[var(--color-brand)] focus:ring-[var(--color-brand)] cursor-pointer"
                      />
                      <span
                        className={`text-xs ${
                          item.done
                            ? "line-through text-[var(--muted)]"
                            : "text-[var(--foreground)] font-medium"
                        }`}
                      >
                        {item.label}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteChecklist(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-red-500 p-1 rounded transition-opacity"
                      aria-label="Remove item"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Checklist Form */}
              <form onSubmit={handleAddChecklist} className="flex gap-2 pt-1">
                <Input
                  value={newChecklistLabel}
                  onChange={(e) => setNewChecklistLabel(e.target.value)}
                  placeholder="Add a checklist step..."
                  className="text-xs h-9"
                />
                <Button type="submit" size="sm" variant="secondary" disabled={!newChecklistLabel.trim()}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </form>
            </div>
          </Card>

          {/* Activity / Metadata audit */}
          <Card className="p-6 space-y-4">
            <CardTitle className="text-sm font-bold">Execution History</CardTitle>
            <div className="space-y-2 text-xs text-[var(--muted)]">
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span>Created</span>
                <span className="font-medium text-[var(--foreground)]">{formatDateTime(task.createdAt)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span>Last Updated</span>
                <span className="font-medium text-[var(--foreground)]">{formatDateTime(task.updatedAt)}</span>
              </div>
              {task.completedAt && (
                <div className="flex justify-between py-1 border-b border-[var(--border)] text-emerald-600 dark:text-emerald-400">
                  <span>Completed At</span>
                  <span className="font-medium">{formatDateTime(task.completedAt)}</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Col: Legal State Transitions & Attributes */}
        <div className="space-y-6">
          {/* Status Transitions Card */}
          <Card className="p-5 space-y-4">
            <CardTitle className="text-xs uppercase font-bold tracking-wider text-[var(--muted)]">
              Status Transitions
            </CardTitle>
            <div className="space-y-2">
              <p className="text-xs text-[var(--muted)]">
                Only valid transitions from <strong className="text-[var(--foreground)]">{task.status}</strong> are permitted.
              </p>
              {legalNextStatuses.length === 0 ? (
                <p className="text-xs text-[var(--muted)] italic">No legal transitions available.</p>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  {legalNextStatuses.map((next) => (
                    <Button
                      key={next}
                      variant={next === "Completed" ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => handleStatusClick(next)}
                      disabled={transitionMutation.isPending}
                      className="justify-start gap-2"
                    >
                      <ArrowsClockwise className="w-4 h-4" />
                      <span>Move to {next}</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Properties Card */}
          <Card className="p-5 space-y-4">
            <CardTitle className="text-xs uppercase font-bold tracking-wider text-[var(--muted)]">
              Task Properties
            </CardTitle>

            <div className="space-y-3 text-xs">
              {/* Assignee */}
              <div className="space-y-1">
                <label className="text-[var(--muted)] font-medium">Assignee</label>
                <select
                  value={task.assigneeId || ""}
                  onChange={(e) => updateMutation.mutate({ assigneeId: e.target.value || null })}
                  className="w-full text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] px-3 py-2 text-[var(--foreground)]"
                >
                  <option value="">Unassigned</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.title})
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label className="text-[var(--muted)] font-medium">Priority</label>
                <select
                  value={task.priority}
                  onChange={(e) => updateMutation.mutate({ priority: e.target.value as Priority })}
                  className="w-full text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] px-3 py-2 text-[var(--foreground)]"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <label className="text-[var(--muted)] font-medium">Due Date</label>
                <input
                  type="date"
                  value={task.dueDate}
                  onChange={(e) => updateMutation.mutate({ dueDate: e.target.value })}
                  className="w-full text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] px-3 py-2 text-[var(--foreground)] font-mono"
                />
              </div>

              {/* Estimate Hours */}
              <div className="space-y-1">
                <label className="text-[var(--muted)] font-medium">Estimate (Hours)</label>
                <input
                  type="number"
                  min="0"
                  value={task.estimateHours}
                  onChange={(e) => updateMutation.mutate({ estimateHours: Number(e.target.value) || 0 })}
                  className="w-full text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] px-3 py-2 text-[var(--foreground)] font-mono"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Blocker Rationale Modal */}
      <Modal
        open={blockerModalOpen}
        onOpenChange={setBlockerModalOpen}
        title="Record Blocker Rationale"
        description="Explain what is impeding this work. This alert will immediately propagate to the project's Needs Your Attention feed."
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Impediment / Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={blockerReason}
              onChange={(e) => setBlockerReason(e.target.value)}
              placeholder="e.g. Blocked on UAE Central Bank API security token review..."
              rows={3}
              className="w-full rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-xs text-[var(--foreground)] focus:ring-2 focus:ring-[var(--color-brand)]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setBlockerModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!blockerReason.trim() || transitionMutation.isPending}
              onClick={() => transitionMutation.mutate({ nextStatus: "Blocked", reason: blockerReason.trim() })}
            >
              Confirm Blocker
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Task"
        description={`Are you sure you want to delete task ${task.code}? This will soft-delete the item and record an audit event.`}
      >
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="bg-red-600 hover:bg-red-700"
            onClick={() => {
              toast.success(`Task ${task.code} deleted`);
              router.push(`/projects/${projectId}/tasks`);
            }}
          >
            Confirm Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
