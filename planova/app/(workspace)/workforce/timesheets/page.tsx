"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { sessionFor, can } from "@/lib/access/permissions";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/formatting/format";
import type { Timesheet, TimeEntry, Project, Task, User } from "@/lib/domain/types";
import {
  Clock,
  CheckCircle,
  XCircle,
  Lock,
  Plus,
  Calendar,
  ArrowLeft,
  ArrowRight,
  FolderSimple,
  CheckSquare,
  Warning,
  PaperPlaneTilt,
  ArrowsClockwise,
  Users,
} from "@phosphor-icons/react";

export default function TimesheetsPage() {
  const queryClient = useQueryClient();
  const organisationId = useSessionStore((s) => s.organisationId);
  const personaId = useSessionStore((s) => s.personaId);
  const session = sessionFor(personaId, organisationId);

  const canApproveTime = can(session, "time.approve");

  const [activeTab, setActiveTab] = useState<"my" | "approvals">("my");
  const [selectedWeekOffset, setSelectedWeekOffset] = useState<number>(0);
  const [addEntryOpen, setAddEntryOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingTimesheetId, setRejectingTimesheetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New entry form state
  const [newProjectId, setNewProjectId] = useState<string>("");
  const [newTaskId, setNewTaskId] = useState<string>("");
  const [newWorkDate, setNewWorkDate] = useState<string>("2026-10-14");
  const [newHours, setNewHours] = useState<number>(4);
  const [newNote, setNewNote] = useState<string>("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const { data: timesheetsRes } = useQuery({
    queryKey: ["timesheets", organisationId],
    queryFn: () => apiClient.getTimesheets(),
  });

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const { data: tasksRes } = useQuery({
    queryKey: ["tasks", organisationId],
    queryFn: () => apiClient.getTasks(),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const timesheets = timesheetsRes?.data || [];
  const projects = projectsRes?.data || [];
  const tasks = tasksRes?.data || [];
  const people = peopleRes?.data || [];

  // My timesheets
  const myTimesheets = useMemo(() => {
    return timesheets.filter((t) => t.userId === session.userId);
  }, [timesheets, session.userId]);

  // Selected current timesheet (or primary)
  const currentTimesheet = useMemo(() => {
    if (myTimesheets.length === 0) return null;
    return myTimesheets[selectedWeekOffset] || myTimesheets[0];
  }, [myTimesheets, selectedWeekOffset]);

  // Pending approval timesheets
  const pendingApprovals = useMemo(() => {
    return timesheets.filter((t) => t.status === "Submitted" && t.userId !== session.userId);
  }, [timesheets, session.userId]);

  // Mutations
  const submitMutation = useMutation({
    mutationFn: (id: string) => apiClient.submitTimesheet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets", organisationId] });
      showToast("Timesheet submitted for manager approval.");
    },
  });

  const decideMutation = useMutation({
    mutationFn: ({ id, outcome, reason }: { id: string; outcome: "Approved" | "Rejected"; reason?: string }) =>
      apiClient.decideTimesheet(id, outcome, reason),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["timesheets", organisationId] });
      setRejectModalOpen(false);
      setRejectReason("");
      showToast(`Timesheet successfully ${vars.outcome.toLowerCase()}.`);
    },
  });

  const reopenMutation = useMutation({
    mutationFn: (id: string) => apiClient.reopenTimesheet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets", organisationId] });
      showToast("Timesheet re-opened as Draft for modification.");
    },
  });

  const addEntryMutation = useMutation({
    mutationFn: (entry: TimeEntry) => {
      if (!currentTimesheet) throw new Error("No timesheet active");
      const updated = [...currentTimesheet.entries, entry];
      return apiClient.updateTimesheetEntries(currentTimesheet.id, updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets", organisationId] });
      setAddEntryOpen(false);
      setNewNote("");
      showToast("Time entry recorded.");
    },
  });

  // Calculate total minutes
  const totalMinutes = useMemo(() => {
    if (!currentTimesheet) return 0;
    return currentTimesheet.entries.reduce((acc, e) => acc + (e.minutes || 0), 0);
  }, [currentTimesheet]);

  const totalHours = (totalMinutes / 60).toFixed(1);
  const targetHours = 40;
  const progressPct = Math.min(100, Math.round(((totalMinutes / 60) / targetHours) * 100));

  const filteredTasks = useMemo(() => {
    if (!newProjectId) return [];
    return tasks.filter((t) => t.projectId === newProjectId);
  }, [tasks, newProjectId]);

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectId) return;
    const newEntry: TimeEntry = {
      id: `te-${Date.now()}`,
      workDate: newWorkDate,
      projectId: newProjectId,
      taskId: newTaskId || null,
      minutes: Math.round(newHours * 60),
      note: newNote || "Work completed on scheduled task deliverable",
    };
    addEntryMutation.mutate(newEntry);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-emerald-900 border border-emerald-700 px-4 py-3 text-sm text-emerald-100 shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/work" className="hover:text-foreground transition-colors">
              My Work
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Workforce Timesheets</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Clock className="h-7 w-7 text-indigo-500" />
            Weekly Timesheets
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Log effort against projects and tasks, track completeness, and process manager approvals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canApproveTime && (
            <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border">
              <button
                onClick={() => setActiveTab("my")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === "my"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                My Timesheet
              </button>
              <button
                onClick={() => setActiveTab("approvals")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === "approvals"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Manager Approvals</span>
                {pendingApprovals.length > 0 && (
                  <span className="h-4 px-1.5 rounded-full bg-indigo-600 text-[10px] text-white font-bold flex items-center justify-center">
                    {pendingApprovals.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {activeTab === "my" && currentTimesheet && currentTimesheet.status === "Draft" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setAddEntryOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Time Entry
            </Button>
          )}
        </div>
      </div>

      {activeTab === "my" ? (
        <div className="space-y-6">
          {/* Timesheet Status Card & Period Nav */}
          <Card className="p-5 border-border bg-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-indigo-500 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      Week of {currentTimesheet ? formatDate(currentTimesheet.weekStart) : "Current Week"}
                    </span>
                    {currentTimesheet && (
                      <StatusChip
                        status={
                          currentTimesheet.status === "Approved"
                            ? "Approved"
                            : currentTimesheet.status === "Submitted"
                            ? "In Review"
                            : currentTimesheet.status === "Rejected"
                            ? "Critical"
                            : "Draft"
                        }
                      />
                    )}
                    {currentTimesheet?.lockedAt && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">Standard 40-hour working baseline</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {currentTimesheet?.status === "Draft" && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => submitMutation.mutate(currentTimesheet.id)}
                    disabled={submitMutation.isPending || (totalMinutes === 0)}
                  >
                    <PaperPlaneTilt className="h-4 w-4 mr-1.5" />
                    Submit for Approval
                  </Button>
                )}

                {currentTimesheet?.status === "Rejected" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => reopenMutation.mutate(currentTimesheet.id)}
                    disabled={reopenMutation.isPending}
                  >
                    <ArrowsClockwise className="h-4 w-4 mr-1.5" />
                    Re-open as Draft
                  </Button>
                )}
              </div>
            </div>

            {/* Rejection Banner if Rejected */}
            {currentTimesheet?.status === "Rejected" && currentTimesheet.rejectionReason && (
              <div className="mt-4 p-3.5 rounded-lg border border-rose-500/30 bg-rose-950/20 text-rose-200 text-xs flex items-start gap-3">
                <Warning className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-rose-300 font-semibold block">Manager Rejection Notice:</strong>
                  <p className="mt-0.5 text-rose-200/90">{currentTimesheet.rejectionReason}</p>
                </div>
              </div>
            )}

            {/* Completeness Progress Bar */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Logged Progress:</span>
                <span className="font-semibold text-foreground">
                  {totalHours} / {targetHours} hrs ({progressPct}%)
                </span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    progressPct >= 100
                      ? "bg-emerald-500"
                      : progressPct >= 75
                      ? "bg-indigo-500"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Time Entries Table */}
          <Card className="border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Logged Work Entries</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Detailed distribution of effort across assigned deliverables.
                </p>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                Total: {currentTimesheet?.entries.length || 0} entries
              </span>
            </div>

            {!currentTimesheet || currentTimesheet.entries.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <span>No time entries logged for this period yet.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                      <th className="py-3 px-4 font-semibold">Date</th>
                      <th className="py-3 px-3 font-semibold">Project</th>
                      <th className="py-3 px-3 font-semibold">Task</th>
                      <th className="py-3 px-4 font-semibold">Work Note</th>
                      <th className="py-3 px-4 font-semibold text-right">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {currentTimesheet.entries.map((entry) => {
                      const project = projects.find((p) => p.id === entry.projectId);
                      const task = tasks.find((t) => t.id === entry.taskId);
                      const hours = (entry.minutes / 60).toFixed(1);

                      return (
                        <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 font-mono text-muted-foreground">
                            {formatDate(entry.workDate)}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-primary">
                                {project?.code || entry.projectId}
                              </span>
                              <span className="text-muted-foreground text-[11px] truncate max-w-[150px]">
                                {project?.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-muted-foreground font-mono">
                            {task ? (
                              <span className="text-foreground font-medium">{task.title}</span>
                            ) : (
                              <span className="italic text-muted-foreground/60">General Project Activity</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                            {entry.note}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                            {hours}h
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : (
        /* Manager Approvals Queue */
        <div className="space-y-6">
          <Card className="border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Pending Team Timesheet Submissions</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Review and decide timesheets submitted by reporting team members.
                </p>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                Queue: {pendingApprovals.length} pending
              </span>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto text-emerald-500/50 mb-2" />
                <span>All team timesheet submissions have been processed.</span>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pendingApprovals.map((ts) => {
                  const submitter = people.find((p) => p.id === ts.userId);
                  const totalHrs = (ts.entries.reduce((sum, e) => sum + e.minutes, 0) / 60).toFixed(1);

                  return (
                    <div
                      key={ts.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {submitter?.name || ts.userId}
                          </span>
                          <span className="text-xs text-muted-foreground">({submitter?.title})</span>
                          <StatusChip status="In Review" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Week of {formatDate(ts.weekStart)} • {ts.entries.length} tasks •{" "}
                          <strong className="text-foreground font-mono">{totalHrs} hours</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => decideMutation.mutate({ id: ts.id, outcome: "Approved" })}
                          disabled={decideMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1 text-emerald-300" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRejectingTimesheetId(ts.id);
                            setRejectModalOpen(true);
                          }}
                          disabled={decideMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1 text-rose-400" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Add Time Entry Modal */}
      <Modal
        open={addEntryOpen}
        onOpenChange={(open: boolean) => setAddEntryOpen(open)}
        title="Log Time Entry"
      >
        <form onSubmit={handleSaveEntry} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-foreground block mb-1">Project *</label>
            <select
              required
              value={newProjectId}
              onChange={(e) => {
                setNewProjectId(e.target.value);
                setNewTaskId("");
              }}
              className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select a project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">Task Deliverable (Optional)</label>
            <select
              value={newTaskId}
              onChange={(e) => setNewTaskId(e.target.value)}
              disabled={!newProjectId}
              className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            >
              <option value="">General Project Effort</option>
              {filteredTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} — {t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">Work Date *</label>
              <input
                type="date"
                required
                value={newWorkDate}
                onChange={(e) => setNewWorkDate(e.target.value)}
                className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground block mb-1">Duration (Hours) *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="16"
                required
                value={newHours}
                onChange={(e) => setNewHours(parseFloat(e.target.value) || 0)}
                className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">Work Note *</label>
            <textarea
              required
              rows={2}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Describe work completed on this deliverable..."
              className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddEntryOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={addEntryMutation.isPending || !newProjectId}
            >
              Save Time Entry
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reject Timesheet Reason Modal */}
      <Modal
        open={rejectModalOpen}
        onOpenChange={(open: boolean) => setRejectModalOpen(open)}
        title="Reject Timesheet Submission"
      >
        <div className="space-y-4 text-xs">
          <p className="text-muted-foreground">
            Please provide a specific rejection rationale so the team member can amend their logged hours.
          </p>
          <textarea
            required
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Atlas task effort hours exceed authorized allocation for Sprint 6..."
            className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!rejectReason.trim() || decideMutation.isPending}
              onClick={() => {
                if (rejectingTimesheetId) {
                  decideMutation.mutate({
                    id: rejectingTimesheetId,
                    outcome: "Rejected",
                    reason: rejectReason,
                  });
                }
              }}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
