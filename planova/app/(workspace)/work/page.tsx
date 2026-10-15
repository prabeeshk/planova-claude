"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { sessionFor } from "@/lib/access/permissions";
import { StatusChip } from "@/components/ui/StatusChip";
import { PriorityPill } from "@/components/ui/PriorityPill";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/formatting/format";
import type { Task, TaskStatus, RaidItem, ApprovalRequest } from "@/lib/domain/types";
import { toast } from "sonner";
import {
  CheckSquare,
  Clock,
  Warning,
  ShieldCheck,
  CalendarBlank,
  ArrowRight,
  FolderSimple,
  CheckCircle,
  XCircle,
  ListChecks,
  HourglassHigh,
  User,
  Plus,
} from "@phosphor-icons/react";

type WorkTab = "tasks" | "raid" | "approvals";

export default function MyWorkPage() {
  const queryClient = useQueryClient();
  const organisationId = useSessionStore((s) => s.organisationId);
  const personaId = useSessionStore((s) => s.personaId);
  const currentUserId = sessionFor(personaId, organisationId).userId;

  const [activeTab, setActiveTab] = useState<WorkTab>("tasks");
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>("active");

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const { data: tasksRes, isLoading: loadingTasks } = useQuery({
    queryKey: ["tasks", "all", organisationId],
    queryFn: () => apiClient.getTasks(),
  });

  const { data: raidRes, isLoading: loadingRaid } = useQuery({
    queryKey: ["raidItems", "all", organisationId],
    queryFn: () => apiClient.getRaidItems(),
  });

  const { data: approvalsRes, isLoading: loadingApprovals } = useQuery({
    queryKey: ["approvals", organisationId],
    queryFn: () => apiClient.getApprovals(),
  });

  const { data: timesheetsRes } = useQuery({
    queryKey: ["timesheets", currentUserId, organisationId],
    queryFn: () => apiClient.getTimesheets(currentUserId),
  });

  const people = peopleRes?.data || [];
  const projects = projectsRes?.data || [];
  const allTasks = tasksRes?.data || [];
  const allRaid = raidRes?.data || [];
  const allApprovals = approvalsRes?.data || [];
  const timesheets = timesheetsRes?.data || [];

  const currentUser = people.find((p) => p.id === currentUserId);
  const latestTimesheet = timesheets[0];
  const loggedMinutes = latestTimesheet ? latestTimesheet.entries.reduce((a, e) => a + e.minutes, 0) : 0;

  // My Tasks: tasks assigned to current user
  const myTasks = allTasks.filter((t) => t.assigneeId === currentUserId);

  // My RAID: items where ownerId === currentUserId
  const myRaid = allRaid.filter((r) => r.ownerId === currentUserId);

  // My Approvals: pending voting assignments for current user
  const myApprovals = allApprovals.filter((app) => {
    if (app.status !== "Pending" && app.status !== "In Progress") return false;
    return app.stages.some((stage) =>
      stage.assignments.some(
        (asg) =>
          (asg.assigneeId === currentUserId || asg.delegatedToId === currentUserId) &&
          asg.status === "Pending"
      )
    );
  });

  // Task transition mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      apiClient.updateTask(taskId, { status }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(`Task ${res.data.code} updated to ${res.data.status}`);
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to update task status");
    },
  });

  // Metrics
  const activeTasksCount = myTasks.filter((t) => t.status === "In Progress" || t.status === "Not Started").length;
  const blockedTasksCount = myTasks.filter((t) => t.status === "Blocked").length;
  const now = new Date();
  const overdueTasksCount = myTasks.filter((t) => {
    if (t.status === "Completed" || t.status === "Cancelled") return false;
    return new Date(t.dueDate) < now;
  }).length;

  // Filtered tasks
  const filteredTasks = myTasks.filter((t) => {
    if (taskStatusFilter === "active") return t.status !== "Completed" && t.status !== "Cancelled";
    if (taskStatusFilter === "blocked") return t.status === "Blocked";
    if (taskStatusFilter === "completed") return t.status === "Completed";
    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              My Work Command Centre
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
              {currentUser?.name || "Team Member"}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Personal triage console for your assigned deliverables, owned RAID risks, and pending governance decisions.
          </p>
        </div>

        {/* Timesheet Quick Card */}
        {latestTimesheet && (
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center gap-4 shrink-0">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Clock size={20} />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Weekly Timesheet
                </span>
                <StatusChip status={latestTimesheet.status} />
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {loggedMinutes / 60} hrs logged ({latestTimesheet.weekStart})
              </p>
            </div>
            <Link href="/workforce/timesheets">
              <Button variant="ghost" size="sm">
                Log Time →
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Tasks to Deliver</span>
            <CheckSquare size={18} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {activeTasksCount}
          </div>
          <div className="text-xs text-slate-500">{myTasks.length} total assigned</div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Blocked Items</span>
            <XCircle size={18} className="text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {blockedTasksCount}
          </div>
          <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">Requires escalation</div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Owned RAID Items</span>
            <Warning size={18} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {myRaid.length}
          </div>
          <div className="text-xs text-slate-500">Under active mitigation</div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Approvals Waiting</span>
            <ShieldCheck size={18} className="text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {myApprovals.length}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Voting assignment</div>
        </Card>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`pb-3 px-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "tasks"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <CheckSquare size={16} />
          My Assigned Deliverables ({myTasks.length})
        </button>

        <button
          onClick={() => setActiveTab("raid")}
          className={`pb-3 px-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "raid"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Warning size={16} />
          My RAID Items ({myRaid.length})
        </button>

        <button
          onClick={() => setActiveTab("approvals")}
          className={`pb-3 px-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "approvals"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <ShieldCheck size={16} />
          My Decision Approvals ({myApprovals.length})
        </button>
      </div>

      {/* Tab 1: My Tasks */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          {/* Sub-filter toolbar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
              <button
                onClick={() => setTaskStatusFilter("active")}
                className={`px-2.5 py-1 text-xs font-semibold rounded ${
                  taskStatusFilter === "active"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Active Work ({activeTasksCount})
              </button>
              <button
                onClick={() => setTaskStatusFilter("blocked")}
                className={`px-2.5 py-1 text-xs font-semibold rounded ${
                  taskStatusFilter === "blocked"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Blocked ({blockedTasksCount})
              </button>
              <button
                onClick={() => setTaskStatusFilter("completed")}
                className={`px-2.5 py-1 text-xs font-semibold rounded ${
                  taskStatusFilter === "completed"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setTaskStatusFilter("all")}
                className={`px-2.5 py-1 text-xs font-semibold rounded ${
                  taskStatusFilter === "all"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                All
              </button>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <Card className="p-12 text-center text-slate-500">
              No tasks found under this filter.
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((t) => {
                const project = projects.find((p) => p.id === t.projectId);
                const isOverdue = new Date(t.dueDate) < now && t.status !== "Completed" && t.status !== "Cancelled";
                const completedChecklist = t.checklist.filter((c) => c.done).length;

                return (
                  <Card
                    key={t.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {t.code}
                        </span>
                        <StatusChip status={t.status} />
                        <PriorityPill priority={t.priority} size="sm" />
                        {isOverdue && (
                          <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-medium">
                            Overdue
                          </span>
                        )}
                        {project && (
                          <Link
                            href={`/projects/${project.id}`}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <FolderSimple size={14} />
                            {project.name}
                          </Link>
                        )}
                      </div>

                      <Link
                        href={`/projects/${t.projectId}/tasks/${t.id}`}
                        className="text-base font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 block"
                      >
                        {t.title}
                      </Link>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <CalendarBlank size={14} />
                          Due: {formatDate(t.dueDate)}
                        </span>
                        {t.estimateHours && (
                          <span>Estimate: {t.estimateHours}h</span>
                        )}
                        {t.checklist.length > 0 && (
                          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                            <ListChecks size={14} />
                            Checklist: {completedChecklist}/{t.checklist.length} done
                          </span>
                        )}
                        {t.blockedReason && (
                          <span className="text-rose-600 dark:text-rose-400 font-medium truncate max-w-sm">
                            Blocker: {t.blockedReason}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick status transition actions */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                      {t.status === "Not Started" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateTaskStatusMutation.mutate({ taskId: t.id, status: "In Progress" })}
                        >
                          Start Task
                        </Button>
                      )}
                      {t.status === "In Progress" && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => updateTaskStatusMutation.mutate({ taskId: t.id, status: "Completed" })}
                        >
                          Complete
                        </Button>
                      )}
                      {t.status === "Blocked" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateTaskStatusMutation.mutate({ taskId: t.id, status: "In Progress" })}
                        >
                          Unblock
                        </Button>
                      )}
                      <Link href={`/projects/${t.projectId}/tasks/${t.id}`}>
                        <Button size="sm" variant="ghost">
                          <ArrowRight size={16} />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My RAID Items */}
      {activeTab === "raid" && (
        <div className="space-y-3">
          {myRaid.length === 0 ? (
            <Card className="p-12 text-center text-slate-500">
              You do not own any active RAID risks, issues, assumptions, or dependencies.
            </Card>
          ) : (
            myRaid.map((item) => {
              const project = projects.find((p) => p.id === item.projectId);

              return (
                <Card
                  key={item.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.type.toUpperCase()}: {item.code}
                      </span>
                      <StatusChip status={item.status} />
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        item.severity === "Critical"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}>
                        Score: {item.score} ({item.severity})
                      </span>
                      {project && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <FolderSimple size={14} />
                          {project.name}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/governance/raid/${item.id}`}
                      className="text-base font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 block"
                    >
                      {item.title}
                    </Link>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                      Mitigation: {item.response}
                    </p>

                    <div className="text-xs text-slate-500">
                      Next Review Due: <strong className="text-slate-700 dark:text-slate-300">{formatDate(item.reviewDate)}</strong>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Link href={`/governance/raid/${item.id}`}>
                      <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
                        <span>Review Risk</span>
                        <ArrowRight size={14} />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Tab 3: My Approvals */}
      {activeTab === "approvals" && (
        <div className="space-y-3">
          {myApprovals.length === 0 ? (
            <Card className="p-12 text-center text-slate-500">
              No governance decisions currently pending your vote.
            </Card>
          ) : (
            myApprovals.map((app) => {
              const project = projects.find((p) => p.id === app.projectId);

              return (
                <Card
                  key={app.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {app.entityType}
                      </span>
                      <StatusChip status={app.status} />
                      <span className="font-mono text-xs text-slate-500">
                        v{app.entityVersion} ({app.versionHash.slice(0, 8)})
                      </span>
                      {project && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <FolderSimple size={14} />
                          {project.name}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/approvals/${app.id}`}
                      className="text-base font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 block"
                    >
                      {app.title}
                    </Link>

                    <div className="text-xs text-slate-500">
                      Voting SLA: Due <strong className="text-slate-700 dark:text-slate-300">{formatDate(app.dueAt)}</strong>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Link href={`/approvals/${app.id}`}>
                      <Button variant="primary" size="sm" className="flex items-center gap-1.5">
                        <span>Cast Decision</span>
                        <ArrowRight size={14} />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
