"use client";

import React, { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { PriorityPill } from "@/components/ui/PriorityPill";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/formatting/format";
import { toast } from "sonner";
import type { Task, TaskStatus } from "@/lib/domain/types";
import { nextStates, TASK_TRANSITIONS } from "@/lib/domain/transitions";
import {
  Plus,
  DotsThree,
  CheckCircle,
  WarningOctagon,
  Clock,
  Circle,
  ArrowRight,
  ChatCircleDots,
  CheckSquare,
} from "@phosphor-icons/react";

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "Not Started", label: "Not Started", color: "border-gray-400" },
  { status: "In Progress", label: "In Progress", color: "border-blue-500" },
  { status: "Blocked", label: "Blocked", color: "border-rose-500" },
  { status: "Completed", label: "Completed", color: "border-emerald-500" },
  { status: "Cancelled", label: "Cancelled", color: "border-slate-400" },
];

export default function ProjectBoardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const queryClient = useQueryClient();
  const organisationId = useSessionStore((s) => s.organisationId);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [blockingModalOpen, setBlockingModalOpen] = useState(false);
  const [blockingReason, setBlockingReason] = useState("");
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);

  // New task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState<any>("Medium");
  const [taskEst, setTaskEst] = useState(16);

  // Fetch project
  const { data: projectData } = useQuery({
    queryKey: ["project", projectId, organisationId],
    queryFn: () => apiClient.getProject(projectId),
  });

  // Fetch tasks
  const { data: tasksData } = useQuery({
    queryKey: ["tasks", projectId, organisationId],
    queryFn: () => apiClient.getTasks({ projectId }),
  });

  const project = projectData?.data;
  const tasks = tasksData?.data || [];

  // Transition mutation
  const transitionMutation = useMutation({
    mutationFn: ({
      taskId,
      nextStatus,
      reason,
    }: {
      taskId: string;
      nextStatus: TaskStatus;
      reason?: string;
    }) => apiClient.transitionTask(taskId, nextStatus, reason),
    onSuccess: (res) => {
      toast.success(`Task ${res.data.code} moved to ${res.data.status}`);
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to move task");
    },
  });

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.createTask({
        projectId,
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        assigneeId: "u-arjun",
        startDate: "2026-10-14",
        dueDate: "2026-10-28",
        estimateHours: taskEst,
      }),
    onSuccess: (res) => {
      toast.success(`Task ${res.data.code} created!`);
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      setNewTaskModalOpen(false);
      setTaskTitle("");
      setTaskDesc("");
    },
  });

  const handleStatusChange = (task: Task, nextStatus: TaskStatus) => {
    if (nextStatus === "Blocked") {
      setSelectedTask(task);
      setBlockingReason("");
      setBlockingModalOpen(true);
      return;
    }
    transitionMutation.mutate({ taskId: task.id, nextStatus });
  };

  const confirmBlocked = () => {
    if (!selectedTask) return;
    if (!blockingReason.trim()) {
      toast.error("A blocker explanation is required.");
      return;
    }
    transitionMutation.mutate({
      taskId: selectedTask.id,
      nextStatus: "Blocked",
      reason: blockingReason.trim(),
    });
    setBlockingModalOpen(false);
  };

  if (!project) return null;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <ProjectHeader project={project} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Board actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--foreground)]">Execution Flow Board</h2>
            <p className="text-xs text-[var(--muted)]">
              Drag or use quick status menus to advance tasks through delivery states.
            </p>
          </div>

          <Button size="sm" onClick={() => setNewTaskModalOpen(true)} className="gap-1.5">
            <Plus weight="bold" className="w-3.5 h-3.5" />
            <span>New Task</span>
          </Button>
        </div>

        {/* 5 Column Kanban Layout */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 items-start overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                className="bg-[var(--surface-elevated)]/60 rounded-2xl p-3 border border-[var(--surface-border)] space-y-3 min-w-[220px]"
              >
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[var(--foreground)]">
                      {col.label}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[var(--surface)] text-[var(--muted)] border border-[var(--surface-border)]">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Column Cards */}
                <div className="space-y-2.5">
                  {colTasks.map((task) => {
                    const legalTransitions = nextStates(TASK_TRANSITIONS, task.status);
                    const doneChecks = task.checklist.filter((c) => c.done).length;

                    return (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)] hover:border-[var(--primary)]/50 hover:shadow-sm transition-all space-y-2.5 select-none"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-[var(--primary)]">
                            {task.code}
                          </span>
                          <PriorityPill priority={task.priority} size="sm" />
                        </div>

                        <h4 className="font-semibold text-xs text-[var(--foreground)] leading-snug line-clamp-2">
                          {task.title}
                        </h4>

                        {task.status === "Blocked" && task.blockedReason && (
                          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-700 dark:text-rose-300 font-medium leading-tight">
                            Blocker: {task.blockedReason}
                          </div>
                        )}

                        {/* Checklist progress */}
                        {task.checklist.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted)]">
                            <CheckSquare className="w-3.5 h-3.5 text-[var(--primary)]" />
                            <span>
                              {doneChecks} of {task.checklist.length} done
                            </span>
                          </div>
                        )}

                        {/* Footer: Due date, assignee, and transition selector */}
                        <div className="pt-2 border-t border-[var(--surface-border)] flex items-center justify-between">
                          <span className="text-[10px] text-[var(--muted)]">
                            Due {formatDate(task.dueDate, "MMM d")}
                          </span>

                          {/* Quick accessible status transitions */}
                          {legalTransitions.length > 0 && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleStatusChange(task, e.target.value as TaskStatus);
                                }
                              }}
                              defaultValue=""
                              className="bg-[var(--surface-elevated)] border border-[var(--surface-border)] text-[10px] font-semibold text-[var(--foreground)] rounded-md px-1.5 py-0.5 focus:outline-none cursor-pointer"
                              aria-label={`Change status for task ${task.code}`}
                            >
                              <option value="" disabled>Move to...</option>
                              {legalTransitions.map((ns) => (
                                <option key={ns} value={ns}>
                                  → {ns}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className="py-6 text-center text-[11px] text-[var(--muted)] border border-dashed border-[var(--surface-border)] rounded-xl">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Blocker Reason Modal */}
      <Modal
        open={blockingModalOpen}
        onOpenChange={setBlockingModalOpen}
        title="Record Blocker Reason"
        description="A clear impediment explanation is mandatory under delivery governance before flagging a task as Blocked."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Why is this task blocked? *
            </label>
            <textarea
              rows={3}
              value={blockingReason}
              onChange={(e) => setBlockingReason(e.target.value)}
              placeholder="e.g. Waiting on third-party API gateway latency fix or external security audit signoff..."
              className="w-full p-2.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setBlockingModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={confirmBlocked}>
              Mark as Blocked
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Task Modal */}
      <Modal
        open={newTaskModalOpen}
        onOpenChange={setNewTaskModalOpen}
        title="Add Delivery Task"
        description="Create a task with estimation, priority, and checklist tracking."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">Task Title *</label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Implement webhook retry queue with exponential backoff"
              className="w-full h-9 px-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">Description</label>
            <textarea
              rows={2}
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Detailed acceptance criteria and technical deliverables..."
              className="w-full p-2.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--foreground)]">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full h-8 px-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-xs"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--foreground)]">Estimate Hours</label>
              <input
                type="number"
                value={taskEst}
                onChange={(e) => setTaskEst(Number(e.target.value))}
                className="w-full h-8 px-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-xs"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setNewTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
              disabled={!taskTitle.trim()}
            >
              Create Task
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
