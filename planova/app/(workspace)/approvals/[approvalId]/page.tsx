"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { formatDate, formatDateTime, formatMoney } from "@/lib/formatting/format";
import type { DecisionOutcome, ApprovalAssignment } from "@/lib/domain/types";
import { toast } from "sonner";
import { sessionFor } from "@/lib/access/permissions";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  ArrowClockwise,
  UserSwitch,
  Clock,
  Lock,
  ArrowLeft,
  Warning,
  Copy,
  Paperclip,
  FolderSimple,
  GitFork,
  FileText,
  User,
  Check,
} from "@phosphor-icons/react";

export default function ApprovalDetailPage() {
  const params = useParams<{ approvalId: string }>();
  const queryClient = useQueryClient();
  const organisationId = useSessionStore((s) => s.organisationId);
  const personaId = useSessionStore((s) => s.personaId);
  const currentUserId = sessionFor(personaId, organisationId).userId;

  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [delegateModalOpen, setDelegateModalOpen] = useState(false);
  const [pendingOutcome, setPendingOutcome] = useState<DecisionOutcome | null>(null);
  const [comment, setComment] = useState("");
  const [delegateToUserId, setDelegateToUserId] = useState("");
  const [delegateReason, setDelegateReason] = useState("");
  const [copiedHash, setCopiedHash] = useState(false);

  const { data: approvalRes, isLoading } = useQuery({
    queryKey: ["approval", params.approvalId, organisationId],
    queryFn: () => apiClient.getApproval(params.approvalId),
    enabled: !!params.approvalId,
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const approval = approvalRes?.data;
  const people = peopleRes?.data || [];
  const projects = projectsRes?.data || [];

  const requester = people.find((p) => p.id === approval?.requesterId);
  const project = projects.find((p) => p.id === approval?.projectId);

  // Self-approval guard
  const isRequester = approval?.requesterId === currentUserId;

  // Active stage and assignment check
  const activeStage = approval?.stages.find((s) => s.status === "Active") || approval?.stages[0];
  const userAssignment: ApprovalAssignment | undefined = activeStage?.assignments.find(
    (a) => (a.assigneeId === currentUserId || a.delegatedToId === currentUserId)
  );

  const isAssigned = !!userAssignment;
  const hasDecided = userAssignment?.status === "Decided";
  const canDecide = isAssigned && !hasDecided && !isRequester && (approval?.status === "Pending" || approval?.status === "In Progress");

  const decideMutation = useMutation({
    mutationFn: ({ outcome, decisionComment }: { outcome: DecisionOutcome; decisionComment: string }) =>
      apiClient.decideApproval(params.approvalId, outcome, decisionComment),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["approval", params.approvalId] });
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["changes"] });
      toast.success(`Decision recorded: ${res.data.status}`);
      setDecisionModalOpen(false);
      setComment("");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to record decision");
    },
  });

  const delegateMutation = useMutation({
    mutationFn: ({ targetUserId, reason }: { targetUserId: string; reason: string }) =>
      apiClient.delegateApproval(params.approvalId, targetUserId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval", params.approvalId] });
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      toast.success("Approval assignment delegated");
      setDelegateModalOpen(false);
      setDelegateToUserId("");
      setDelegateReason("");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to delegate approval");
    },
  });

  const handleOpenDecisionModal = (outcome: DecisionOutcome) => {
    setPendingOutcome(outcome);
    setComment("");
    setDecisionModalOpen(true);
  };

  const handleConfirmDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingOutcome) return;

    if (
      (pendingOutcome === "Rejected" || pendingOutcome === "Rework Requested") &&
      comment.trim().length < 5
    ) {
      toast.error("A mandatory comment of at least 5 characters is required for rejection or rework.");
      return;
    }

    decideMutation.mutate({
      outcome: pendingOutcome,
      decisionComment: comment.trim(),
    });
  };

  const handleConfirmDelegation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegateToUserId) {
      toast.error("Please select an eligible committee member to delegate to.");
      return;
    }
    if (!delegateReason.trim()) {
      toast.error("Please provide a delegation rationale.");
      return;
    }

    delegateMutation.mutate({
      targetUserId: delegateToUserId,
      reason: delegateReason.trim(),
    });
  };

  const copyHashToClipboard = () => {
    if (!approval) return;
    navigator.clipboard.writeText(approval.versionHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
    toast.success("Version hash copied to clipboard");
  };

  if (isLoading || !approval) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-12 w-96 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/approvals" className="hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1">
          <ArrowLeft size={16} />
          Approvals Inbox
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-700 dark:text-slate-300">{approval.id}</span>
      </div>

      {/* Self-Approval Warning Banner */}
      {isRequester && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 text-amber-700 dark:text-amber-400">
          <Lock size={20} className="shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-sm">Self-Approval Prohibited by Governance Policy</p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
              Policy <strong>POL-DEL-02</strong> strictly prohibits authors, project managers, or requesters from approving their own requests. Your account is flagged as the requester ({requester?.name || "You"}). An independent governance authority or designated committee member must review and decide this record.
            </p>
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
              {approval.entityType}
            </span>
            <StatusChip status={approval.status} />
            <button
              onClick={copyHashToClipboard}
              className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors flex items-center gap-1"
              title="Click to copy full immutable SHA256 checksum"
            >
              {copiedHash ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>Hash: {approval.versionHash.slice(0, 10)}…</span>
            </button>
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

          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{approval.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-slate-400">Requester: </span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{requester?.name || "System PM"}</span>
            </div>
            <div>
              <span className="text-slate-400">Submitted: </span>
              <span>{formatDateTime(approval.submittedAt)}</span>
            </div>
            <div>
              <span className="text-slate-400">Due Date: </span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(approval.dueAt)}</span>
            </div>
            <div>
              <span className="text-slate-400">Target Entity: </span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {approval.entityType} #{approval.entityId} (v{approval.entityVersion})
              </span>
            </div>
          </div>
        </div>

        {/* Decision Actions Toolbar */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
          {canDecide ? (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenDecisionModal("Approved")}
                disabled={decideMutation.isPending}
                className="flex items-center gap-1.5"
              >
                <CheckCircle size={16} />
                Approve Request
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleOpenDecisionModal("Rejected")}
                disabled={decideMutation.isPending}
                className="flex items-center gap-1.5"
              >
                <XCircle size={16} />
                Reject with Rationale
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenDecisionModal("Rework Requested")}
                disabled={decideMutation.isPending}
                className="flex items-center gap-1.5"
              >
                <ArrowClockwise size={16} />
                Request Rework
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDelegateModalOpen(true)}
                disabled={delegateMutation.isPending}
                className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400"
              >
                <UserSwitch size={14} />
                Delegate Decision
              </Button>
            </>
          ) : (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700 dark:text-slate-300">Decision Status</p>
              {isRequester ? (
                <p>Self-approval blocked for author persona.</p>
              ) : hasDecided ? (
                <p className="text-emerald-600 dark:text-emerald-400 font-medium">Your vote has been signed and recorded.</p>
              ) : !isAssigned ? (
                <p>You are not an assigned voter for the current active stage.</p>
              ) : (
                <p>Workflow is completed ({approval.status}).</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Immutable Snapshot & Evidence */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submitted Immutable Snapshot */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                  Frozen Submission Snapshot
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">Immutable Payload v{approval.entityVersion}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {Object.entries(approval.snapshot).map(([key, value]) => (
                <div key={key} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-800 space-y-1">
                  <span className="text-xs uppercase tracking-wider font-mono text-slate-500 dark:text-slate-400 block">
                    {key.replace(/([A-Z])/g, " $1")}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100 font-mono break-words">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>

            {/* Target Entity Jump Link */}
            {approval.entityType === "Change" && (
              <div className="pt-2 flex justify-end">
                <Link
                  href={`/changes/${approval.entityId}`}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                >
                  Inspect source Change Request {approval.snapshot.code || approval.entityId} →
                </Link>
              </div>
            )}
          </Card>

          {/* Evidence Attachments */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Paperclip size={20} className="text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                Attached Evidence & Governance Artifacts
              </h3>
            </div>

            {approval.evidence.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No external artifacts attached to this approval submission.</p>
            ) : (
              <div className="space-y-2">
                {approval.evidence.map((ev, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip size={14} className="text-slate-400" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">{ev.label}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {ev.entityType} ({ev.entityId})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Append-Only Decision Trail */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                Audited Decision History (Append-Only)
              </h3>
            </div>

            {approval.decisions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                No decisions cast yet. Awaiting committee vote.
              </div>
            ) : (
              <div className="space-y-3">
                {approval.decisions.map((dec) => {
                  const actor = people.find((p) => p.id === dec.actorId);
                  const isPositive = dec.outcome === "Approved";
                  const isNegative = dec.outcome === "Rejected";

                  return (
                    <div
                      key={dec.id}
                      className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold text-xs px-2.5 py-0.5 rounded-full ${
                              isPositive
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                : isNegative
                                ? "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                                : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                            }`}
                          >
                            {dec.outcome}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {actor?.name || dec.actorId}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          {formatDateTime(dec.at)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200/60 dark:border-slate-800">
                        &ldquo;{dec.comment}&rdquo;
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Multi-Stage Workflow & Quorum */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              Workflow Stages & Quorum
            </h3>

            <div className="space-y-4">
              {approval.stages.map((stage, idx) => (
                <div
                  key={stage.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {stage.name}
                      </h4>
                    </div>
                    <StatusChip status={stage.status} />
                  </div>

                  <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                    <span className="capitalize">Mode: {stage.mode}</span>
                    <span className="font-mono">Quorum: {stage.quorum} vote</span>
                  </div>

                  {/* Voters / Assignments */}
                  <div className="space-y-1.5 pt-1">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Designated Voters:</p>
                    {stage.assignments.map((asg) => {
                      const assignee = people.find((p) => p.id === asg.assigneeId);
                      const delegate = asg.delegatedToId ? people.find((p) => p.id === asg.delegatedToId) : null;

                      return (
                        <div
                          key={asg.id}
                          className="flex items-center justify-between text-xs p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800"
                        >
                          <div className="flex items-center gap-1.5">
                            <User size={14} className="text-slate-400" />
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {assignee?.name || asg.assigneeId}
                            </span>
                            {delegate && (
                              <span className="text-purple-600 dark:text-purple-400 text-xs">
                                → {delegate.name} (Delegated)
                              </span>
                            )}
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                              asg.status === "Decided"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {asg.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Cryptographic Integrity Verification Box */}
          <Card className="p-5 space-y-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <ShieldCheck size={16} className="text-blue-500" />
              <span>Snapshot Integrity Guard</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every decision signature is cryptographically bound to the SHA-256 payload checksum below. Any out-of-band modification to the source entity invalidates the vote state.
            </p>
            <div className="bg-white dark:bg-slate-950 p-2.5 rounded border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 break-all select-all">
              {approval.versionHash}
            </div>
          </Card>
        </div>
      </div>

      {/* Decision Submission Modal */}
      <Modal
        open={decisionModalOpen}
        onOpenChange={setDecisionModalOpen}
        title={`Confirm Decision: ${pendingOutcome}`}
      >
        <form onSubmit={handleConfirmDecision} className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            You are recording a binding decision of <strong>{pendingOutcome}</strong> on {approval.title}.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Decision Comment{" "}
              {pendingOutcome === "Rejected" || pendingOutcome === "Rework Requested" ? (
                <span className="text-rose-500 font-bold">* (Mandatory)</span>
              ) : (
                <span className="text-slate-400 font-normal">(Optional)</span>
              )}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                pendingOutcome === "Rejected" || pendingOutcome === "Rework Requested"
                  ? "Detail technical/governance rationale for rejecting or requesting rework (min 5 chars)..."
                  : "Add governance notes, attestation references, or conditional sign-offs..."
              }
              rows={3}
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required={pendingOutcome === "Rejected" || pendingOutcome === "Rework Requested"}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setDecisionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={pendingOutcome === "Approved" ? "primary" : "destructive"}
              type="submit"
              disabled={decideMutation.isPending}
            >
              {decideMutation.isPending ? "Signing..." : `Confirm ${pendingOutcome}`}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delegation Modal */}
      <Modal
        open={delegateModalOpen}
        onOpenChange={setDelegateModalOpen}
        title="Delegate Approval Assignment"
      >
        <form onSubmit={handleConfirmDelegation} className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Transfer your decision authority for this stage to another authorized committee peer.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Delegate To <span className="text-rose-500">*</span>
            </label>
            <select
              value={delegateToUserId}
              onChange={(e) => setDelegateToUserId(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select eligible committee member...</option>
              {people
                .filter((p) => p.id !== currentUserId && p.id !== approval.requesterId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.title})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Delegation Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={delegateReason}
              onChange={(e) => setDelegateReason(e.target.value)}
              placeholder="E.g., Out of office on annual leave; delegated to peer domain lead..."
              rows={2}
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setDelegateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={delegateMutation.isPending}>
              {delegateMutation.isPending ? "Delegating..." : "Confirm Delegation"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
