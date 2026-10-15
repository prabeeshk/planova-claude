"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
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
} from "@phosphor-icons/react";

export default function ProjectChangesPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;
  const organisationId = useSessionStore((s) => s.organisationId);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [scope, setScope] = useState("");
  const [scheduleDays, setScheduleDays] = useState(14);
  const [costAmount, setCostAmount] = useState("120000");

  const { data: projectRes } = useQuery({
    queryKey: ["project", projectId, organisationId],
    queryFn: () => apiClient.getProject(projectId),
  });

  const { data: changesRes, isLoading: loadingChanges } = useQuery({
    queryKey: ["changes", projectId, organisationId],
    queryFn: () => apiClient.getChanges({ projectId }),
  });

  const project = projectRes?.data;
  const changes = changesRes?.data || [];

  const createMutation = useMutation({
    mutationFn: (input: any) => apiClient.createChange(input),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["changes", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
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
    if (!title.trim() || !reason.trim()) {
      toast.error("Please fill in required fields");
      return;
    }
    createMutation.mutate({
      projectId,
      title: title.trim(),
      reason: reason.trim(),
      scope: scope.trim() || "Extend deliverable scope and technical integration milestones",
      scheduleDays: Number(scheduleDays) || 0,
      costAmount: costAmount.trim() || "0",
    });
  };

  if (!project) return null;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <ProjectHeader project={project} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Change Control Register
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[var(--surface-raised)] text-[var(--muted)]">
                {changes.length} requests
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] mt-1">
              Governed modifications to scope, baseline schedule, and financial commitments with multi-stage approval enforcement.
            </p>
          </div>

          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Raise Change Request
          </Button>
        </div>

        {/* Changes List */}
        {loadingChanges ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-[var(--surface-raised)] animate-pulse" />
            ))}
          </div>
        ) : changes.length === 0 ? (
          <Card className="p-12 text-center space-y-4">
            <FileText className="w-12 h-12 text-[var(--muted)] mx-auto opacity-50" />
            <h3 className="text-base font-bold text-[var(--foreground)]">No Change Requests Raised</h3>
            <p className="text-xs text-[var(--muted)] max-w-md mx-auto">
              All delivery parameters currently track to the approved baseline charter. Raise a request when variance requires formal governance.
            </p>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Raise First Change Request
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {changes.map((cr) => (
              <Card
                key={cr.id}
                className="p-5 transition-all hover:border-[var(--color-brand)]/40 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--color-brand)] bg-[var(--color-brand)]/10 px-2 py-0.5 rounded">
                        {cr.code}
                      </span>
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--muted)]">
                        v{cr.currentVersion}
                      </span>
                      <StatusChip status={cr.status} />
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
                    <span>View Impact & Evidence</span>
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
                      <div className="text-[10px] text-[var(--muted)]">Linked RAID</div>
                      <div className="font-mono text-[var(--foreground)]">
                        {cr.linkedRaidIds?.length || 0} Items
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Raise Change Request Modal */}
      <Modal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        title="Raise Change Request"
        description="Formal governance document specifying scope, schedule, or financial variances requiring authorized approval."
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
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
                placeholder="120000"
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
