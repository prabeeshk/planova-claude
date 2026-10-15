"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { deriveRisk } from "@/lib/domain/risk";
import { formatMoney, formatDate, formatDateTime } from "@/lib/formatting/format";
import { DEMO_TODAY, isOverdue } from "@/lib/demo-data/clock";
import type { RaidItem, RaidStatus } from "@/lib/domain/types";
import { toast } from "sonner";
import {
  ArrowLeft,
  ShieldWarning,
  ShieldCheck,
  CalendarCheck,
  Clock,
  Warning,
  FolderSimple,
  PencilSimple,
  ArrowsClockwise,
  CheckCircle,
  Coins,
  ArrowRight,
} from "@phosphor-icons/react";

export default function RaidItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const itemId = params.itemId as string;
  const organisationId = useSessionStore((s) => s.organisationId);

  // Modals
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [newProbability, setNewProbability] = useState(3);
  const [newImpact, setNewImpact] = useState(3);

  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");

  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closureReason, setClosureReason] = useState("");

  const { data: itemRes, isLoading } = useQuery({
    queryKey: ["raid-item", itemId, organisationId],
    queryFn: () => apiClient.getRaidItem(itemId),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const item = itemRes?.data;
  const people = peopleRes?.data || [];
  const projects = projectsRes?.data || [];

  const project = projects.find((p) => p.id === item?.projectId);
  const owner = people.find((p) => p.id === item?.ownerId);

  const reviewMutation = useMutation({
    mutationFn: (input: { note: string; probability: number; impact: number }) =>
      apiClient.reviewRaidItem(itemId, input.note, input.probability, input.impact),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["raid-item", itemId] });
      queryClient.invalidateQueries({ queryKey: ["raid"] });
      toast.success("Governance review recorded");
      setReviewModalOpen(false);
      setReviewNote("");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to record review");
    },
  });

  const escalateMutation = useMutation({
    mutationFn: (reason: string) => apiClient.escalateRaidItem(itemId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raid-item", itemId] });
      queryClient.invalidateQueries({ queryKey: ["raid"] });
      toast.success("RAID item escalated to Governance Committee");
      setEscalateModalOpen(false);
      setEscalateReason("");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to escalate");
    },
  });

  const closeMutation = useMutation({
    mutationFn: (reason: string) => apiClient.closeRaidItem(itemId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raid-item", itemId] });
      queryClient.invalidateQueries({ queryKey: ["raid"] });
      toast.success("RAID item closed with recorded rationale");
      setCloseModalOpen(false);
      setClosureReason("");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to close item");
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="h-6 w-32 bg-[var(--surface-raised)] rounded animate-pulse" />
        <div className="h-10 w-96 bg-[var(--surface-raised)] rounded animate-pulse" />
        <div className="h-64 bg-[var(--surface-raised)] rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl border border-red-500/20 bg-red-500/5 text-center space-y-4">
        <ShieldWarning className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-[var(--foreground)]">RAID Record Not Found</h2>
        <p className="text-xs text-[var(--muted)]">
          The requested risk or issue does not exist in this organisation scope.
        </p>
        <Button onClick={() => router.push("/governance/raid")}>
          Back to RAID Register
        </Button>
      </div>
    );
  }

  const overdue = isOverdue(item.reviewDate) && item.status !== "Closed";
  const derived = deriveRisk(newProbability, newImpact);

  const handleOpenReviewModal = () => {
    setNewProbability(item.probability);
    setNewImpact(item.impact);
    setReviewModalOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in-50 duration-200">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/governance/raid"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Enterprise RAID</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded font-mono font-medium bg-[var(--surface-raised)] text-[var(--muted)]">
            v{item.rowVersion}
          </span>
          {project && (
            <Link
              href={`/projects/${project.id}/raid`}
              className="text-xs px-2.5 py-1 rounded font-semibold bg-[var(--surface-raised)] hover:bg-[var(--surface-raised)]/80 text-[var(--foreground)] transition-colors flex items-center gap-1.5"
            >
              <FolderSimple className="w-3.5 h-3.5" />
              <span>Project View</span>
            </Link>
          )}
        </div>
      </div>

      {/* Escalation Alert Banner */}
      {item.status === "Escalated" && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 space-y-2">
          <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
            <Warning className="w-5 h-5" />
            <span>Escalated to Enterprise Governance Committee</span>
          </div>
          <p className="text-xs text-red-800 dark:text-red-200 leading-relaxed">
            This item exceeds local project risk tolerance thresholds. Required review at upcoming steering committee.
          </p>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details, Mitigation, Reviews */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-[var(--color-brand)] bg-[var(--color-brand)]/10 px-2 py-0.5 rounded">
                  {item.code}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--surface-raised)] text-[var(--foreground)]">
                  {item.type}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.severity === "Critical"
                      ? "bg-red-500/15 text-red-600"
                      : item.severity === "High"
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      : "bg-blue-500/15 text-blue-600"
                  }`}
                >
                  Score {item.score} · {item.severity}
                </span>
                <StatusChip status={item.status} />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                {item.title}
              </h1>
              {project && (
                <p className="text-xs text-[var(--muted)] flex items-center gap-1.5 pt-1">
                  <span>Project Charter:</span>
                  <Link
                    href={`/projects/${project.id}`}
                    className="font-semibold text-[var(--foreground)] hover:text-[var(--color-brand)] underline"
                  >
                    {project.name} ({project.code})
                  </Link>
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                Root Cause & Description
              </label>
              <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed bg-[var(--surface-raised)]/50 p-4 rounded-xl border border-[var(--border)]">
                {item.description}
              </p>
            </div>

            {/* Response & Mitigation */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                Response & Mitigation Strategy
              </label>
              <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed bg-[var(--surface-raised)]/50 p-4 rounded-xl border border-[var(--border)]">
                {item.response || "No explicit response strategy recorded."}
              </p>
            </div>

            {/* Closure Info if closed */}
            {item.status === "Closed" && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                  <CheckCircle className="w-4 h-4" />
                  <span>Item Formally Closed</span>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-200">
                  {item.closureReason || "Resolution verified by accountable owner."}
                </p>
              </div>
            )}
          </Card>

          {/* Review History */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold">Governance Review Log</CardTitle>
              <Button size="sm" variant="secondary" onClick={handleOpenReviewModal}>
                <PencilSimple className="w-4 h-4 mr-1.5" />
                Record Review
              </Button>
            </div>

            <div className="space-y-3 pt-2">
              {item.reviews.length === 0 ? (
                <p className="text-xs text-[var(--muted)] italic">No reviews recorded yet.</p>
              ) : (
                item.reviews.map((rev) => {
                  const revPerson = people.find((p) => p.id === rev.reviewerId);
                  return (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-xl bg-[var(--surface-raised)]/40 border border-[var(--border)] space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--foreground)]">
                          {revPerson?.name || rev.reviewerId}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--muted)]">{rev.date}</span>
                      </div>
                      <p className="text-[var(--foreground)]">{rev.note}</p>
                      <div className="text-[10px] text-[var(--muted)] font-mono pt-1">
                        Assessed Probability: {rev.probability} · Impact: {rev.impact} (Score: {rev.probability * rev.impact})
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Col: Matrix Score & Actions */}
        <div className="space-y-6">
          {/* Risk Derivation Card */}
          <Card className="p-5 space-y-4">
            <CardTitle className="text-xs uppercase font-bold tracking-wider text-[var(--muted)]">
              5×5 Policy Score
            </CardTitle>

            <div className="p-4 rounded-xl bg-[var(--surface-raised)]/60 border border-[var(--border)] text-center space-y-2">
              <div className="text-3xl font-extrabold text-[var(--foreground)]">
                {item.score}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand)]">
                {item.severity} Severity
              </div>
              <div className="text-[11px] text-[var(--muted)] font-mono">
                {item.probability} (Probability) × {item.impact} (Impact)
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--muted)]">Owner</span>
                <span className="font-medium text-[var(--foreground)]">{owner?.name || "Unassigned"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--muted)]">Next Review Date</span>
                <span className={`font-mono font-medium ${overdue ? "text-red-500 font-bold" : "text-[var(--foreground)]"}`}>
                  {item.reviewDate}
                </span>
              </div>
              {item.exposure && (
                <div className="flex justify-between py-1 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">Financial Exposure</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {formatMoney(item.exposure)}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Actions Card */}
          <Card className="p-5 space-y-3">
            <CardTitle className="text-xs uppercase font-bold tracking-wider text-[var(--muted)]">
              Governance Actions
            </CardTitle>

            <div className="flex flex-col gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenReviewModal}
                className="justify-start gap-2"
              >
                <ArrowsClockwise className="w-4 h-4" />
                <span>Conduct Risk Review</span>
              </Button>

              {item.status !== "Escalated" && item.status !== "Closed" && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="justify-start gap-2 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                  onClick={() => setEscalateModalOpen(true)}
                >
                  <Warning className="w-4 h-4" />
                  <span>Escalate to Committee</span>
                </Button>
              )}

              {item.status !== "Closed" && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="justify-start gap-2 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                  onClick={() => setCloseModalOpen(true)}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Formally Close Record</span>
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Record Review Modal */}
      <Modal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        title="Record Governance Review"
        description="Reassess probability and impact, record findings, and reset the 14-day governance review cycle."
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-xl bg-[var(--surface-raised)]/60 border border-[var(--border)] space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[var(--foreground)]">New Score Preview</span>
              <span className="font-bold text-[var(--color-brand)]">
                Score: {derived.score} ({derived.severity})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted)]">Probability</span>
                  <span className="font-bold">{newProbability}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={newProbability}
                  onChange={(e) => setNewProbability(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted)]">Impact</span>
                  <span className="font-bold">{newImpact}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={newImpact}
                  onChange={(e) => setNewImpact(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Review Notes & Findings <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="e.g. Verified vendor mitigation patch in staging environment..."
              rows={3}
              required
              className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!reviewNote.trim() || reviewMutation.isPending}
              onClick={() => reviewMutation.mutate({ note: reviewNote.trim(), probability: newProbability, impact: newImpact })}
            >
              Record Review
            </Button>
          </div>
        </div>
      </Modal>

      {/* Escalate Modal */}
      <Modal
        open={escalateModalOpen}
        onOpenChange={setEscalateModalOpen}
        title="Escalate RAID Item"
        description="Flag this item directly on the enterprise steering committee agenda and Project Pulse feed."
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Escalation Rationale <span className="text-red-500">*</span>
            </label>
            <textarea
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              placeholder="e.g. Schedule variance exceeds 20 business days without approved mitigation..."
              rows={3}
              required
              className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEscalateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
              disabled={!escalateReason.trim() || escalateMutation.isPending}
              onClick={() => escalateMutation.mutate(escalateReason.trim())}
            >
              Confirm Escalation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Close Modal */}
      <Modal
        open={closeModalOpen}
        onOpenChange={setCloseModalOpen}
        title="Formally Close Record"
        description="Explain how this risk or issue has been resolved or accepted."
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Closure Rationale <span className="text-red-500">*</span>
            </label>
            <textarea
              value={closureReason}
              onChange={(e) => setClosureReason(e.target.value)}
              placeholder="e.g. HSM capacity scaled horizontally; latency benchmark confirmed at 14ms."
              rows={3}
              required
              className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setCloseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!closureReason.trim() || closeMutation.isPending}
              onClick={() => closeMutation.mutate(closureReason.trim())}
            >
              Close Record
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
