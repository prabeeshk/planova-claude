"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { formatMoney, formatDate, formatDateTime } from "@/lib/formatting/format";
import { CHANGE_TRANSITIONS } from "@/lib/domain/transitions";
import type { ChangeRequest, ChangeStatus } from "@/lib/domain/types";
import { toast } from "sonner";
import {
  FileText,
  ArrowLeft,
  CalendarBlank,
  Coins,
  Clock,
  Warning,
  CheckCircle,
  XCircle,
  FolderSimple,
  ShieldCheck,
  GitFork,
  ArrowRight,
  PencilSimple,
  Paperclip,
  ShareNetwork,
  Scales,
} from "@phosphor-icons/react";

type ImpactTab = "scope" | "schedule" | "cost" | "resource" | "risk" | "options" | "evidence";

export default function ChangeDetailPage() {
  const params = useParams<{ changeId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const organisationId = useSessionStore((s) => s.organisationId);

  const [activeTab, setActiveTab] = useState<ImpactTab>("scope");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ChangeStatus | null>(null);
  const [transitionReason, setTransitionReason] = useState("");

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editOptions, setEditOptions] = useState("");
  const [editScope, setEditScope] = useState("");
  const [editScheduleDays, setEditScheduleDays] = useState(0);
  const [editCostAmount, setEditCostAmount] = useState("");
  const [editResource, setEditResource] = useState("");
  const [editRisk, setEditRisk] = useState("");

  const { data: changeRes, isLoading } = useQuery({
    queryKey: ["change", params.changeId, organisationId],
    queryFn: () => apiClient.getChange(params.changeId),
    enabled: !!params.changeId,
  });

  const change = changeRes?.data;

  const { data: projectRes } = useQuery({
    queryKey: ["project", change?.projectId, organisationId],
    queryFn: () => (change?.projectId ? apiClient.getProject(change.projectId) : null),
    enabled: !!change?.projectId,
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const { data: raidRes } = useQuery({
    queryKey: ["raid", change?.projectId, organisationId],
    queryFn: () => (change?.projectId ? apiClient.getRaidItems({ projectId: change.projectId }) : null),
    enabled: !!change?.projectId,
  });

  const project = projectRes?.data;
  const people = peopleRes?.data || [];
  const requester = people.find((p) => p.id === change?.requesterId);
  const raidItems = raidRes?.data || [];
  const linkedRaids = raidItems.filter((r) => change?.linkedRaidIds.includes(r.id));

  // Initialize edit form when opening modal
  const openEditModal = () => {
    if (!change) return;
    setEditTitle(change.title);
    setEditReason(change.reason);
    setEditOptions(change.options);
    setEditScope(change.impact.scope);
    setEditScheduleDays(change.impact.scheduleDays);
    setEditCostAmount(change.impact.cost.amount);
    setEditResource(change.impact.resource);
    setEditRisk(change.impact.risk);
    setEditModalOpen(true);
  };

  const updateMutation = useMutation({
    mutationFn: (input: any) => apiClient.updateChange(params.changeId, input),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["change", params.changeId] });
      queryClient.invalidateQueries({ queryKey: ["changes"] });
      toast.success("Change request updated successfully");
      setEditModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to update change request");
    },
  });

  const transitionMutation = useMutation({
    mutationFn: ({ status, reason }: { status: ChangeStatus; reason?: string }) =>
      apiClient.transitionChange(params.changeId, status, reason),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["change", params.changeId] });
      queryClient.invalidateQueries({ queryKey: ["changes"] });
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      toast.success(`Transitioned to ${res.data.status}`);
      setTransitionModalOpen(false);
      setTargetStatus(null);
      setTransitionReason("");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to transition change request");
    },
  });

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }
    updateMutation.mutate({
      title: editTitle.trim(),
      reason: editReason.trim(),
      options: editOptions.trim(),
      impact: {
        scope: editScope.trim(),
        scheduleDays: Number(editScheduleDays) || 0,
        cost: {
          amount: editCostAmount.trim() || "0",
          currencyCode: change?.impact.cost.currencyCode || "AED",
        },
        resource: editResource.trim(),
        risk: editRisk.trim(),
      },
    });
  };

  const handleTransitionClick = (status: ChangeStatus) => {
    setTargetStatus(status);
    if (status === "Withdrawn" || status === "Rejected" || status === "Closed") {
      setTransitionModalOpen(true);
    } else {
      transitionMutation.mutate({ status });
    }
  };

  const confirmTransitionWithReason = () => {
    if (!targetStatus) return;
    transitionMutation.mutate({ status: targetStatus, reason: transitionReason.trim() });
  };

  if (isLoading || !change) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-12 w-96 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  const allowedTransitions = CHANGE_TRANSITIONS[change.status] || [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/changes" className="hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1">
          <ArrowLeft size={16} />
          Change Control Register
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-700 dark:text-slate-300">{change.code}</span>
      </div>

      {/* Resubmission Warning Banner */}
      {change.pendingResubmission && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between text-amber-600 dark:text-amber-400">
          <div className="flex items-center gap-3">
            <Warning size={24} className="shrink-0" />
            <div>
              <p className="font-medium text-sm">Specification Modified Since Submission</p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                A draft edit was made while in governance review. Re-submit this change to freeze payload version {change.currentVersion} and refresh the approval stage quorum.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleTransitionClick("In Approval")}
            disabled={transitionMutation.isPending}
          >
            Resubmit for Approval
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
              {change.code}
            </span>
            <StatusChip status={change.status} />
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
              <GitFork size={12} />
              v{change.currentVersion} (rv{change.rowVersion})
            </span>
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{change.title}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{change.reason}</p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-slate-400 dark:text-slate-500">Requester: </span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{requester?.name || "System PM"}</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500">Created: </span>
              <span>{formatDate(change.createdAt)}</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500">Last Updated: </span>
              <span>{formatDateTime(change.updatedAt)}</span>
            </div>
            {change.approvalId && (
              <div>
                <span className="text-slate-400 dark:text-slate-500">Approval Workflow: </span>
                <Link
                  href={`/approvals/${change.approvalId}`}
                  className="font-mono text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
                >
                  {change.approvalId} <ArrowRight size={12} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={openEditModal} className="flex items-center gap-1.5">
            <PencilSimple size={16} />
            Edit Specification
          </Button>

          {/* Workflow Transition Buttons */}
          {allowedTransitions.map((nextStatus) => {
            const isPrimary = nextStatus === "Ready for Approval" || nextStatus === "In Approval" || nextStatus === "Implemented";
            const isDestructive = nextStatus === "Withdrawn" || nextStatus === "Rejected";

            return (
              <Button
                key={nextStatus}
                size="sm"
                variant={isPrimary ? "primary" : isDestructive ? "destructive" : "secondary"}
                disabled={transitionMutation.isPending}
                onClick={() => handleTransitionClick(nextStatus)}
                className="capitalize"
              >
                {nextStatus === "In Approval"
                  ? "Submit for Approval"
                  : nextStatus === "Ready for Approval"
                  ? "Mark Ready for Review"
                  : nextStatus === "Assessing"
                  ? "Return to Assessment"
                  : nextStatus === "Implemented"
                  ? "Mark Implemented"
                  : nextStatus === "Closed"
                  ? "Close Change"
                  : nextStatus}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Impact Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Budget Impact</span>
            <Coins size={18} className="text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {formatMoney(change.impact.cost)}
          </div>
          <div className="text-xs text-slate-500">Direct Capex / Opex variance</div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Schedule Delta</span>
            <CalendarBlank size={18} className="text-blue-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {change.impact.scheduleDays > 0 ? `+${change.impact.scheduleDays}` : change.impact.scheduleDays} days
          </div>
          <div className="text-xs text-slate-500">Critical path milestone shift</div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Resource Capacity</span>
            <Clock size={18} className="text-purple-500" />
          </div>
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
            {change.impact.resource || "None noted"}
          </div>
          <div className="text-xs text-slate-500">Allocation rebalancing impact</div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Risk Posture</span>
            <Warning size={18} className="text-amber-500" />
          </div>
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
            {change.impact.risk || "None noted"}
          </div>
          <div className="text-xs text-slate-500">Regulatory & technical exposure</div>
        </Card>
      </div>

      {/* 5 Impact Tabs & Evaluation Workspace */}
      <Card className="overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 px-4 pt-2">
          {(
            [
              { id: "scope", label: "Scope & Deliverables" },
              { id: "schedule", label: "Schedule & Milestones" },
              { id: "cost", label: "Cost & Commercials" },
              { id: "resource", label: "Resource & Squads" },
              { id: "risk", label: "Risk & Governance" },
              { id: "options", label: "Considered Options" },
              { id: "evidence", label: "Evidence & RAID" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs md:text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Panel */}
        <div className="p-6">
          {activeTab === "scope" && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Scope Variance & Functional Changes
              </h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700/60 font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {change.impact.scope}
              </div>
              <div className="text-xs text-slate-500">
                Scope modifications will update deliverable statements and functional verification tests upon approval.
              </div>
            </div>
          )}

          {activeTab === "schedule" && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Schedule Impact & Timeline Shifts
              </h3>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50">
                <CalendarBlank size={32} className="text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                    +{change.impact.scheduleDays} calendar days delta
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Approved shift extends target project delivery gate and triggers automated Gantt realignment.
                  </p>
                </div>
              </div>
              {project && (
                <div className="text-xs text-slate-500">
                  Target completion date would adjust from{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{formatDate(project.targetDate)}</span>{" "}
                  to reflect requested delay.
                </div>
              )}
            </div>
          )}

          {activeTab === "cost" && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Cost Breakdown & Budget Reallocation
              </h3>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
                <Coins size={32} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                    {formatMoney(change.impact.cost)}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Additional expenditure requires Financial Delegation Authority (FDA) approval level 2.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "resource" && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Resource Allocation & Headcount Requirements
              </h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700/60 text-sm text-slate-800 dark:text-slate-200">
                {change.impact.resource || "No squad reallocation specified."}
              </div>
            </div>
          )}

          {activeTab === "risk" && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Risk Posture & Contingency Strategy
              </h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700/60 text-sm text-slate-800 dark:text-slate-200">
                {change.impact.risk || "Standard operational risk controls apply."}
              </div>
            </div>
          )}

          {activeTab === "options" && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Considered Alternatives & Trade-Off Analysis
              </h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700/60 font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {change.options || "No formal counter-options recorded."}
              </div>
            </div>
          )}

          {activeTab === "evidence" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Linked RAID Items
                </h3>
                {linkedRaids.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No RAID items directly linked to this change.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {linkedRaids.map((r) => (
                      <Link
                        key={r.id}
                        href={`/governance/raid/${r.id}`}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                              {r.code}
                            </span>
                            <StatusChip status={r.status} />
                          </div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
                            {r.title}
                          </p>
                        </div>
                        <ArrowRight size={16} className="text-slate-400 shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Attached Technical Evidence
                </h3>
                {change.evidence.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No external artifacts linked.</p>
                ) : (
                  <div className="space-y-2">
                    {change.evidence.map((ev, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs font-mono text-slate-700 dark:text-slate-300 p-2 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-700"
                      >
                        <Paperclip size={14} className="text-slate-400" />
                        <span>{ev.label}</span>
                        <span className="text-slate-400">({ev.entityType}: {ev.entityId})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Edit Specification Modal */}
      <Modal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        title={`Edit Specification — ${change.code}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {change.status !== "Draft" && change.status !== "Assessing" && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <Warning size={16} className="shrink-0 mt-0.5" />
              <span>
                <strong>Notice:</strong> This Change Request is currently in governance review. Editing the specification will fork a new version (v{change.currentVersion + 1}) and flag the record as requiring resubmission.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Title
            </label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Descriptive title"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Business Justification / Reason
            </label>
            <textarea
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              rows={2}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Schedule Impact (Days)
              </label>
              <Input
                type="number"
                value={editScheduleDays}
                onChange={(e) => setEditScheduleDays(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Cost Impact ({change.impact.cost.currencyCode})
              </label>
              <Input
                type="text"
                value={editCostAmount}
                onChange={(e) => setEditCostAmount(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Scope Details
            </label>
            <textarea
              value={editScope}
              onChange={(e) => setEditScope(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Considered Alternatives
            </label>
            <textarea
              value={editOptions}
              onChange={(e) => setEditOptions(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transition Confirmation Modal (For Withdrawn, Rejected, or Closed requiring rationale) */}
      <Modal
        open={transitionModalOpen}
        onOpenChange={setTransitionModalOpen}
        title={`Transition to ${targetStatus}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Please provide a governance justification for transitioning {change.code} to <strong>{targetStatus}</strong>.
          </p>
          <textarea
            value={transitionReason}
            onChange={(e) => setTransitionReason(e.target.value)}
            placeholder="Enter rationale for committee record..."
            className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setTransitionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmTransitionWithReason}
              disabled={transitionMutation.isPending}
            >
              {transitionMutation.isPending ? "Processing..." : `Confirm ${targetStatus}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
