"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { PriorityPill } from "@/components/ui/PriorityPill";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/formatting/format";
import { DEMO_TODAY, isOverdue } from "@/lib/demo-data/clock";
import type { Task, Milestone } from "@/lib/domain/types";
import { toast } from "sonner";
import {
  CalendarBlank,
  Flag,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  Table,
  ChartBarHorizontal,
  Warning,
  Clock,
  PencilSimple,
} from "@phosphor-icons/react";

export default function ProjectTimelinePage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;
  const organisationId = useSessionStore((s) => s.organisationId);

  const [viewMode, setViewMode] = useState<"gantt" | "table">("gantt");
  const [zoom, setZoom] = useState<"days" | "weeks" | "months">("weeks");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editStartDate, setEditStartDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  const { data: projectRes } = useQuery({
    queryKey: ["project", projectId, organisationId],
    queryFn: () => apiClient.getProject(projectId),
  });

  const { data: tasksRes, isLoading: loadingTasks } = useQuery({
    queryKey: ["tasks", projectId, organisationId],
    queryFn: () => apiClient.getTasks({ projectId }),
  });

  const { data: milestonesRes } = useQuery({
    queryKey: ["milestones", projectId, organisationId],
    queryFn: () => apiClient.getMilestones({ projectId }),
  });

  const project = projectRes?.data;
  const tasks = tasksRes?.data || [];
  const milestones = milestonesRes?.data || [];

  // Date range boundaries for Gantt
  const { minDate, maxDate, totalDays } = useMemo(() => {
    let min = new Date("2026-10-01");
    let max = new Date("2026-12-31");

    tasks.forEach((t) => {
      const start = new Date(t.startDate);
      const end = new Date(t.dueDate);
      if (start < min) min = start;
      if (end > max) max = end;
    });

    milestones.forEach((m) => {
      const d = new Date(m.targetDate);
      if (d < min) min = d;
      if (d > max) max = d;
    });

    const diff = Math.max(1, Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24)));
    return { minDate: min, maxDate: max, totalDays: diff };
  }, [tasks, milestones]);

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      apiClient.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Schedule adjusted");
      setEditingTask(null);
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to update schedule");
    },
  });

  const handleEditSchedule = (task: Task) => {
    setEditingTask(task);
    setEditStartDate(task.startDate);
    setEditDueDate(task.dueDate);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if (new Date(editDueDate) < new Date(editStartDate)) {
      toast.error("Due date cannot be before start date");
      return;
    }
    updateMutation.mutate({
      id: editingTask.id,
      updates: { startDate: editStartDate, dueDate: editDueDate },
    });
  };

  if (!project) return null;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <ProjectHeader project={project} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--muted)]">View:</span>
            <div className="inline-flex rounded-xl p-0.5 bg-[var(--surface-raised)] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setViewMode("gantt")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "gantt"
                    ? "bg-[var(--surface)] text-[var(--foreground)] shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <ChartBarHorizontal className="w-3.5 h-3.5" />
                <span>Gantt</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "table"
                    ? "bg-[var(--surface)] text-[var(--foreground)] shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Data Table</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-xl p-0.5 bg-[var(--surface-raised)] border border-[var(--border)] text-xs font-medium">
              {(["days", "weeks", "months"] as const).map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZoom(z)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                    zoom === z
                      ? "bg-[var(--surface)] text-[var(--foreground)] font-semibold shadow-xs"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
            <div className="text-xs text-[var(--muted)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Today: <strong className="font-mono text-[var(--foreground)]">{DEMO_TODAY}</strong></span>
            </div>
          </div>
        </div>

        {/* Gantt View */}
        {viewMode === "gantt" ? (
          <Card className="p-6 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-4 text-xs">
                <span className="font-semibold text-[var(--foreground)]">Milestone & Task Schedule</span>
                <span className="flex items-center gap-1.5 text-[var(--muted)]">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Milestone</span>
                </span>
                <span className="flex items-center gap-1.5 text-[var(--muted)]">
                  <span className="w-2.5 h-2.5 rounded bg-[var(--color-brand)]" />
                  <span>Task Span</span>
                </span>
                <span className="flex items-center gap-1.5 text-[var(--muted)]">
                  <span className="w-2.5 h-2.5 rounded bg-red-500" />
                  <span>Overdue</span>
                </span>
              </div>
              <span className="text-xs text-[var(--muted)]">
                Range: {formatDate(minDate.toISOString())} – {formatDate(maxDate.toISOString())}
              </span>
            </div>

            {/* Scrollable Timeline Grid */}
            <div className="overflow-x-auto space-y-4 pt-2">
              {/* Milestones row */}
              {milestones.length > 0 && (
                <div className="space-y-2 pb-4 border-b border-[var(--border)]/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    Key Milestones ({milestones.length})
                  </span>
                  <div className="space-y-2">
                    {milestones.map((m) => {
                      const mDate = new Date(m.targetDate);
                      const leftPct = Math.max(
                        0,
                        Math.min(
                          95,
                          ((mDate.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100
                        )
                      );
                      const overdue = isOverdue(m.targetDate) && !m.achievedAt;

                      return (
                        <div
                          key={m.id}
                          className="relative h-9 flex items-center bg-[var(--surface-raised)]/40 rounded-lg px-3 group hover:bg-[var(--surface-raised)] transition-colors"
                        >
                          <div className="w-48 shrink-0 text-xs font-semibold text-[var(--foreground)] truncate pr-2">
                            {m.name}
                          </div>
                          <div className="flex-1 relative h-full flex items-center">
                            <div
                              className="absolute flex items-center gap-1.5 cursor-pointer"
                              style={{ left: `${leftPct}%` }}
                              title={`${m.name} target ${m.targetDate}`}
                            >
                              <div
                                className={`w-3.5 h-3.5 rotate-45 flex items-center justify-center shadow-xs ${
                                  m.achievedAt
                                    ? "bg-emerald-500 text-white"
                                    : overdue
                                    ? "bg-red-500 text-white"
                                    : "bg-amber-500 text-white"
                                }`}
                              />
                              <span className="text-[10px] font-mono font-medium text-[var(--muted)] whitespace-nowrap pl-1">
                                {m.targetDate}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tasks schedule */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Scheduled Tasks ({tasks.length})
                </span>
                {tasks.map((task) => {
                  const s = new Date(task.startDate);
                  const d = new Date(task.dueDate);
                  const leftPct = Math.max(
                    0,
                    Math.min(
                      90,
                      ((s.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100
                    )
                  );
                  const widthPct = Math.max(
                    3,
                    Math.min(
                      100 - leftPct,
                      ((d.getTime() - s.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100
                    )
                  );
                  const overdue = isOverdue(task.dueDate) && task.status !== "Completed" && task.status !== "Cancelled";

                  return (
                    <div
                      key={task.id}
                      className="relative h-10 flex items-center bg-[var(--surface-raised)]/30 rounded-lg px-3 hover:bg-[var(--surface-raised)]/70 transition-colors group"
                    >
                      <div className="w-64 shrink-0 flex items-center gap-2 pr-4 truncate">
                        <span className="font-mono text-[10px] text-[var(--muted)]">{task.code}</span>
                        <Link
                          href={`/projects/${projectId}/tasks/${task.id}`}
                          className="text-xs font-semibold text-[var(--foreground)] hover:text-[var(--color-brand)] truncate"
                        >
                          {task.title}
                        </Link>
                      </div>

                      <div className="flex-1 relative h-full flex items-center">
                        <div
                          className={`absolute h-6 rounded-md flex items-center px-2 cursor-pointer shadow-xs transition-transform group-hover:scale-[1.01] ${
                            overdue
                              ? "bg-red-500/20 border border-red-500/40 text-red-700 dark:text-red-300"
                              : task.status === "Completed"
                              ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                              : task.status === "Blocked"
                              ? "bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300"
                              : "bg-[var(--color-brand)]/20 border border-[var(--color-brand)]/40 text-[var(--color-brand)]"
                          }`}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          onClick={() => handleEditSchedule(task)}
                          title={`${task.code}: ${task.startDate} to ${task.dueDate} (${task.progress}% done)`}
                        >
                          {/* Inner Progress fill */}
                          <div
                            className={`absolute inset-y-0 left-0 rounded-l-md opacity-30 ${
                              task.status === "Completed"
                                ? "bg-emerald-500"
                                : overdue
                                ? "bg-red-500"
                                : "bg-[var(--color-brand)]"
                            }`}
                            style={{ width: `${task.progress}%` }}
                          />
                          <span className="relative z-10 text-[10px] font-mono font-bold truncate">
                            {task.progress}%
                          </span>
                        </div>
                      </div>

                      <div className="w-20 shrink-0 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleEditSchedule(task)}
                          title="Adjust dates"
                        >
                          <PencilSimple className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        ) : (
          /* Accessible Table Alternative */
          <Card className="p-6 overflow-hidden space-y-4">
            <h2 className="text-sm font-bold text-[var(--foreground)]">Accessible Schedule Table</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[var(--muted)]">
                <thead className="bg-[var(--surface-raised)] text-[var(--foreground)] uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-3">Item</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Start Date</th>
                    <th className="p-3">Due / Target Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Progress</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {milestones.map((m) => (
                    <tr key={m.id} className="hover:bg-[var(--surface-raised)]/40 transition-colors">
                      <td className="p-3 font-semibold text-[var(--foreground)]">{m.name}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600">
                          Milestone
                        </span>
                      </td>
                      <td className="p-3 font-mono">—</td>
                      <td className="p-3 font-mono font-semibold text-[var(--foreground)]">{m.targetDate}</td>
                      <td className="p-3">
                        <StatusChip status={m.achievedAt ? "Completed" : "Not Started"} />
                      </td>
                      <td className="p-3 font-mono">{m.achievedAt ? "100%" : "0%"}</td>
                      <td className="p-3 text-right">—</td>
                    </tr>
                  ))}
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-[var(--surface-raised)]/40 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-[var(--color-brand)]">{task.code}</span>
                          <span className="font-semibold text-[var(--foreground)]">{task.title}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--surface-raised)]">
                          Task
                        </span>
                      </td>
                      <td className="p-3 font-mono">{task.startDate}</td>
                      <td className="p-3 font-mono font-semibold text-[var(--foreground)]">{task.dueDate}</td>
                      <td className="p-3">
                        <StatusChip status={task.status} />
                      </td>
                      <td className="p-3 font-mono">{task.progress}%</td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSchedule(task)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Edit Dates Modal */}
      {editingTask && (
        <Modal
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          title={`Adjust Schedule — ${editingTask.code}`}
          description={`Update start and target completion dates for "${editingTask.title}".`}
        >
          <form onSubmit={handleSaveSchedule} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--foreground)]">Start Date</label>
              <input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                required
                className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)] font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--foreground)]">Due Date</label>
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                required
                className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)] font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditingTask(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
