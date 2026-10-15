"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { formatDate, formatDateTime } from "@/lib/formatting/format";
import type { GovernanceException } from "@/lib/domain/types";
import { toast } from "sonner";
import {
  Warning,
  ArrowLeft,
  CalendarBlank,
  User,
  ShieldCheck,
  Paperclip,
  CheckCircle,
  ChatText,
  PencilSimple,
  FolderSimple,
  Clock,
} from "@phosphor-icons/react";

export default function GovernanceExceptionsPage() {
  const queryClient = useQueryClient();
  const organisationId = useSessionStore((s) => s.organisationId);

  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [remediationFilter, setRemediationFilter] = useState<string>("all");
  const [selectedException, setSelectedException] = useState<GovernanceException | null>(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<GovernanceException["remediationStatus"]>("In Progress");
  const [commentText, setCommentText] = useState("");

  const { data: exceptionsRes, isLoading } = useQuery({
    queryKey: ["governanceExceptions", organisationId],
    queryFn: () => apiClient.getExceptions(),
  });

  const { data: policiesRes } = useQuery({
    queryKey: ["governancePolicies", organisationId],
    queryFn: () => apiClient.getPolicies(),
  });

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const exceptions = exceptionsRes?.data || [];
  const policies = policiesRes?.data || [];
  const projects = projectsRes?.data || [];
  const people = peopleRes?.data || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, status, comment }: { id: string; status: GovernanceException["remediationStatus"]; comment?: string }) =>
      apiClient.updateExceptionRemediation(id, status, comment),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["governanceExceptions"] });
      toast.success("Remediation status updated successfully");
      setUpdateModalOpen(false);
      setSelectedException(null);
      setCommentText("");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to update remediation status");
    },
  });

  const openUpdateModal = (exc: GovernanceException) => {
    setSelectedException(exc);
    setNewStatus(exc.remediationStatus);
    setCommentText("");
    setUpdateModalOpen(true);
  };

  const handleConfirmUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedException) return;
    updateMutation.mutate({
      id: selectedException.id,
      status: newStatus,
      comment: commentText.trim() || undefined,
    });
  };

  const filtered = exceptions.filter((exc) => {
    if (severityFilter !== "all" && exc.severity !== severityFilter) return false;
    if (remediationFilter !== "all" && exc.remediationStatus !== remediationFilter) return false;
    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/governance" className="hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1">
          <ArrowLeft size={16} />
          Governance Overview
        </Link>
        <span>/</span>
        <span className="text-slate-700 dark:text-slate-300 font-medium">Policy Exceptions Register</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Governed Policy Exceptions Register
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Time-bounded formal dispensations granted against enterprise standards with mandated remediation tracks.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Severity:
          </span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 px-2.5 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Remediation:
          </span>
          <select
            value={remediationFilter}
            onChange={(e) => setRemediationFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 px-2.5 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Remediated">Remediated</option>
            <option value="Accepted">Accepted</option>
          </select>
        </div>

        {(severityFilter !== "all" || remediationFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSeverityFilter("all");
              setRemediationFilter("all");
            }}
          >
            Reset Filters
          </Button>
        )}
      </Card>

      {/* Exceptions Cards List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          No policy exceptions match the current filter selection.
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((exc) => {
            const policy = policies.find((p) => p.id === exc.policyId);
            const project = projects.find((p) => p.id === exc.projectId);
            const owner = people.find((p) => p.id === exc.ownerId);

            return (
              <Card key={exc.id} className="p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded ${
                        exc.severity === "Critical"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                      }`}>
                        {exc.severity}
                      </span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {exc.id}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        exc.remediationStatus === "Remediated"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : exc.remediationStatus === "In Progress"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                      }`}>
                        Remediation: {exc.remediationStatus}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {exc.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Standard:{" "}
                        <strong className="text-slate-700 dark:text-slate-300">
                          {policy?.name || exc.policyId}
                        </strong>
                      </span>
                      {project && (
                        <span className="flex items-center gap-1">
                          <FolderSimple size={14} />
                          {project.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        Assigned Lead: {owner?.name || exc.ownerId}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        Window: {formatDate(exc.effectiveFrom)} to {formatDate(exc.effectiveTo)}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Button variant="secondary" size="sm" onClick={() => openUpdateModal(exc)} className="flex items-center gap-1.5">
                      <PencilSimple size={14} />
                      Update Remediation
                    </Button>
                  </div>
                </div>

                {/* Linked source record */}
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono">
                  <Paperclip size={14} className="text-slate-400" />
                  <span className="text-slate-500">Root Cause Link:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{exc.source.label}</span>
                  <span className="text-slate-400">({exc.source.entityType} #{exc.source.entityId})</span>
                </div>

                {/* Audit Comments Trail */}
                {exc.comments.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ChatText size={14} />
                      Remediation Audit Trail ({exc.comments.length})
                    </span>
                    <div className="space-y-1.5">
                      {exc.comments.map((cm, i) => {
                        const author = people.find((p) => p.id === cm.authorId);

                        return (
                          <div
                            key={i}
                            className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200/60 dark:border-slate-800 text-xs space-y-1"
                          >
                            <div className="flex justify-between text-slate-500">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {author?.name || cm.authorId}
                              </span>
                              <span className="font-mono">{formatDateTime(cm.at)}</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 italic">
                              &ldquo;{cm.body}&rdquo;
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Update Remediation Modal */}
      <Modal
        open={updateModalOpen}
        onOpenChange={setUpdateModalOpen}
        title={selectedException ? `Update Remediation — ${selectedException.id}` : "Update Exception"}
      >
        <form onSubmit={handleConfirmUpdate} className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Record progress or conclude remediation for <strong>{selectedException?.title}</strong>.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Remediation Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as any)}
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Remediated">Remediated</option>
              <option value="Accepted">Accepted (Formal Committee Waiver)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Remediation Progress Notes
            </label>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Detail verification actions, test artifacts, or vendor confirmations..."
              rows={3}
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setUpdateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Save Status"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
