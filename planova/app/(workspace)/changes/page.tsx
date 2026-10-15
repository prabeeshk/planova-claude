"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatMoney, formatDate } from "@/lib/formatting/format";
import type { ChangeRequest } from "@/lib/domain/types";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  ArrowRight,
  Clock,
  Coins,
  CalendarBlank,
  ShieldCheck,
  CheckCircle,
  FolderSimple,
  Warning,
} from "@phosphor-icons/react";

export default function EnterpriseChangesPage() {
  const queryClient = useQueryClient();
  const organisationId = useSessionStore((s) => s.organisationId);

  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New Change Form
  const [newProjectId, setNewProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [scope, setScope] = useState("");
  const [scheduleDays, setScheduleDays] = useState(14);
  const [costAmount, setCostAmount] = useState("150000");

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const { data: changesRes, isLoading } = useQuery({
    queryKey: ["changes", "all", organisationId],
    queryFn: () => apiClient.getChanges(),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const projects = projectsRes?.data || [];
  const changes = changesRes?.data || [];
  const people = peopleRes?.data || [];

  const createMutation = useMutation({
    mutationFn: (input: any) => apiClient.createChange(input),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["changes"] });
      toast.success(`Change Request ${res.data.code} drafted`);
      setCreateModalOpen(false);
      setTitle("");
      setReason("");
      setScope("");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to create change request");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !newProjectId || !reason.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate({
      projectId: newProjectId,
      title: title.trim(),
      reason: reason.trim(),
      scope: scope.trim() || "Extend deliverable scope and technical integration milestones",
      scheduleDays: Number(scheduleDays) || 0,
      costAmount: costAmount.trim() || "0",
    });
  };

  const filtered = changes.filter((c) => {
    if (projectFilter !== "all" && c.projectId !== projectFilter) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  const inApproval = changes.filter((c) => c.status === "In Approval" || c.status === "Ready for Approval");
  const approved = changes.filter((c) => c.status === "Approved" || c.status === "Implemented");
  const rejected = changes.filter((c) => c.status === "Rejected");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <FileText weight="fill" className="w-3.5 h-3.5" />
            <span>Scope & Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-1.5">
            Enterprise Change Register
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1 max-w-2xl">
            Central ledger of baseline modifications, budget variances, and scope adjustments across all active enterprise delivery programs.
          </p>
        </div>

        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Raise Change Request
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-raised)] text-[var(--color-brand)] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-[var(--foreground)]">{changes.length}</div>
            <div className="text-xs text-[var(--muted)]">Total Requests</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-amber-500/25 bg-amber-500/5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-[var(--foreground)]">{inApproval.length}</div>
            <div className="text-xs text-[var(--muted)]">Awaiting Decision</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-emerald-500/25 bg-emerald-500/5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-[var(--foreground)]">{approved.length}</div>
            <div className="text-xs text-[var(--muted)]">Approved & Implemented</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-red-500/25 bg-red-500/5">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-600 flex items-center justify-center shrink-0">
            <Warning className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-[var(--foreground)]">{rejected.length}</div>
            <div className="text-xs text-[var(--muted)]">Rejected / Closed</div>
          </div>
        </Card>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
        <div className="flex items-center gap-2">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] px-3 py-1.5 text-[var(--foreground)]"
          >
            <option value="all">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] px-3 py-1.5 text-[var(--foreground)]"
          >
            <option value="all">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Assessing">Assessing</option>
            <option value="In Approval">In Approval</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <span className="text-xs text-[var(--muted)]">
          Showing <strong>{filtered.length}</strong> of {changes.length} change requests
        </span>
      </div>

      {/* Changes List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-[var(--surface-raised)] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <FileText className="w-12 h-12 text-[var(--muted)] mx-auto opacity-50" />
          <h3 className="text-base font-bold text-[var(--foreground)]">No Change Requests Found</h3>
          <p className="text-xs text-[var(--muted)] max-w-md mx-auto">
            No changes match the selected project or status filters.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((cr) => {
            const project = projects.find((p) => p.id === cr.projectId);
            const requester = people.find((p) => p.id === cr.requesterId);

            return (
              <Card
                key={cr.id}
                className="p-5 transition-all hover:border-[var(--color-brand)]/40 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--color-brand)] bg-[var(--color-brand)]/10 px-2 py-0.5 rounded">
                        {cr.code}
                      </span>
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--muted)]">
                        v{cr.currentVersion}
                      </span>
                      <StatusChip status={cr.status} />
                      {project && (
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-[10px] font-medium text-[var(--muted)] hover:text-[var(--color-brand)] flex items-center gap-1 truncate max-w-[160px]"
                        >
                          <FolderSimple className="w-3 h-3" />
                          <span>{project.name}</span>
                        </Link>
                      )}
                    </div>
                    <Link
                      href={`/changes/${cr.id}`}
                      className="text-base font-bold text-[var(--foreground)] hover:text-[var(--color-brand)] transition-colors inline-block pt-1"
                    >
                      {cr.title}
                    </Link>
                  </div>

                  <Link
                    href={`/changes/${cr.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--surface-raised)] hover:bg-[var(--surface-raised)]/80 text-[var(--foreground)] transition-colors shrink-0"
                  >
                    <span>Assess Impact</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <p className="text-xs text-[var(--muted)] leading-relaxed line-clamp-2">
                  {cr.reason}
                </p>

                {/* Impact Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[var(--border)] text-xs">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-[10px] text-[var(--muted)]">Cost Variance</div>
                      <div className="font-mono font-bold text-[var(--foreground)]">
                        {cr.impact.cost ? formatMoney(cr.impact.cost) : "0.00 AED"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <CalendarBlank className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="text-[10px] text-[var(--muted)]">Schedule Shift</div>
                      <div className="font-mono font-bold text-[var(--foreground)]">
                        +{cr.impact.scheduleDays} Days
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-[10px] text-[var(--muted)]">Raised Date</div>
                      <div className="font-mono text-[var(--foreground)]">
                        {formatDate(cr.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="text-[10px] text-[var(--muted)]">Requester</div>
                      <div className="font-medium text-[var(--foreground)] truncate max-w-[120px]">
                        {requester?.name || cr.requesterId}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Raise Change Modal */}
      <Modal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        title="Raise Enterprise Change Request"
        description="Formal governance document specifying scope, schedule, or financial variances requiring authorized approval."
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Target Project <span className="text-red-500">*</span>
            </label>
            <select
              value={newProjectId}
              onChange={(e) => setNewProjectId(e.target.value)}
              required
              className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)]"
            >
              <option value="">Select project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Change Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scope Expansion for Central Bank Biometric Integration"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Business Rationale & Root Cause <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Detail regulatory mandate, client scope request, or architecture discovery..."
              rows={3}
              required
              className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--foreground)]">
                Schedule Impact (Days)
              </label>
              <Input
                type="number"
                value={scheduleDays}
                onChange={(e) => setScheduleDays(Number(e.target.value))}
                min="0"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--foreground)]">
                Budget Impact Amount
              </label>
              <Input
                value={costAmount}
                onChange={(e) => setCostAmount(e.target.value)}
                placeholder="150000"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">Scope Delta Summary</label>
            <textarea
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="Specify technical components added or modified..."
              rows={2}
              className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={createMutation.isPending}>
              Draft Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
