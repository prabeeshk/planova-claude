"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { formatDate, formatDateTime } from "@/lib/formatting/format";
import type { ApprovalRequest } from "@/lib/domain/types";
import { sessionFor } from "@/lib/access/permissions";
import {
  CheckCircle,
  XCircle,
  Clock,
  Warning,
  ArrowRight,
  ShieldCheck,
  FileText,
  FolderSimple,
  User,
  Paperclip,
  CheckSquare,
  Lock,
  Funnel,
} from "@phosphor-icons/react";

type ViewTab = "inbox" | "history";

export default function ApprovalsPage() {
  const organisationId = useSessionStore((s) => s.organisationId);
  const personaId = useSessionStore((s) => s.personaId);
  const currentUserId = sessionFor(personaId, organisationId).userId;

  const [activeTab, setActiveTab] = useState<ViewTab>("inbox");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: approvalsRes, isLoading } = useQuery({
    queryKey: ["approvals", organisationId],
    queryFn: () => apiClient.getApprovals(),
  });

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const approvals = approvalsRes?.data || [];
  const projects = projectsRes?.data || [];
  const people = peopleRes?.data || [];

  // Helper: check if approval has pending assignment for current user
  const isAssignedToUser = (app: ApprovalRequest) => {
    if (app.status !== "Pending" && app.status !== "In Progress") return false;
    return app.stages.some((stage) =>
      stage.assignments.some(
        (asg) =>
          (asg.assigneeId === currentUserId || asg.delegatedToId === currentUserId) &&
          asg.status === "Pending"
      )
    );
  };

  // Metrics
  const myActionRequiredCount = approvals.filter(isAssignedToUser).length;
  const totalPending = approvals.filter((a) => a.status === "Pending" || a.status === "In Progress").length;
  const totalApproved = approvals.filter((a) => a.status === "Approved").length;
  const totalRejected = approvals.filter((a) => a.status === "Rejected").length;

  const now = new Date();

  // Filtered list
  const filteredApprovals = approvals.filter((app) => {
    // Tab filter
    if (activeTab === "inbox" && !isAssignedToUser(app)) return false;

    // Entity filter
    if (entityFilter !== "all" && app.entityType !== entityFilter) return false;

    // Status filter
    if (statusFilter !== "all" && app.status !== statusFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = app.title.toLowerCase().includes(q);
      const matchHash = app.versionHash.toLowerCase().includes(q);
      const matchId = app.id.toLowerCase().includes(q);
      if (!matchTitle && !matchHash && !matchId) return false;
    }

    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Governance & Decision Approvals
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
              {myActionRequiredCount} Actionable
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Governed multi-stage approval workflows with immutable version snapshots and self-approval guards.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "inbox"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <CheckSquare size={14} />
            My Decisions ({myActionRequiredCount})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "history"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <ShieldCheck size={14} />
            All Permitted History ({approvals.length})
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Action Required</span>
            <Clock size={18} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {myActionRequiredCount}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">Assigned to your persona</div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Pending</span>
            <Warning size={18} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {totalPending}
          </div>
          <div className="text-xs text-slate-500">Active committee stages</div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Approved</span>
            <CheckCircle size={18} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {totalApproved}
          </div>
          <div className="text-xs text-slate-500">Signed with immutable hashes</div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Rejected / Rework</span>
            <XCircle size={18} className="text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {totalRejected}
          </div>
          <div className="text-xs text-slate-500">Returned with formal rationale</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, hash, or entity reference..."
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-2.5 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Entity Types</option>
            <option value="Change">Change Request</option>
            <option value="Budget">Budget Version</option>
            <option value="Release">Release Gate</option>
            <option value="RaidClosure">RAID Closure</option>
          </select>

          {activeTab === "history" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-2.5 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>
          )}

          {(entityFilter !== "all" || statusFilter !== "all" || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEntityFilter("all");
                setStatusFilter("all");
                setSearchQuery("");
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </Card>

      {/* Approvals Listing */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredApprovals.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <ShieldCheck size={48} className="mx-auto text-slate-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {activeTab === "inbox" ? "Inbox Clear — No Decisions Pending" : "No Approvals Match Filter"}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {activeTab === "inbox"
              ? "You do not have any governance assignments currently awaiting your vote. Check All Permitted History to view completed records."
              : "Try clearing search keywords or entity filters to inspect past governance records."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredApprovals.map((app) => {
            const project = projects.find((p) => p.id === app.projectId);
            const requester = people.find((p) => p.id === app.requesterId);
            const isRequester = app.requesterId === currentUserId;
            const dueDate = new Date(app.dueAt);
            const isOverdue = dueDate < now && (app.status === "Pending" || app.status === "In Progress");
            const activeStage = app.stages.find((s) => s.status === "Active") || app.stages[0];

            return (
              <Card
                key={app.id}
                className="p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {app.entityType}
                    </span>
                    <StatusChip status={app.status} />
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                      Hash: {app.versionHash.slice(0, 8)}
                    </span>
                    {isOverdue && (
                      <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-medium flex items-center gap-1">
                        <Clock size={12} /> Overdue SLA
                      </span>
                    )}
                    {isRequester && (
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-medium flex items-center gap-1">
                        <Lock size={12} /> Requester (Self-Approval Guard)
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/approvals/${app.id}`}
                    className="text-base font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2"
                  >
                    {app.title}
                  </Link>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    {project && (
                      <span className="flex items-center gap-1">
                        <FolderSimple size={14} />
                        {project.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      Requester: {requester?.name || "System"}
                    </span>
                    <span>Due: {formatDate(app.dueAt)}</span>
                    {app.evidence.length > 0 && (
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <Paperclip size={14} />
                        {app.evidence.length} Evidence links
                      </span>
                    )}
                    {activeStage && (
                      <span className="font-mono text-slate-600 dark:text-slate-400">
                        Stage: {activeStage.name} (Quorum: {activeStage.quorum})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <Link href={`/approvals/${app.id}`}>
                    <Button variant={isAssignedToUser(app) ? "primary" : "secondary"} size="sm" className="flex items-center gap-1.5">
                      <span>{isAssignedToUser(app) ? "Cast Decision" : "View Record"}</span>
                      <ArrowRight size={14} />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
