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
import { formatDate } from "@/lib/formatting/format";
import type { GovernanceReview, Finding } from "@/lib/domain/types";
import { toast } from "sonner";
import {
  ListChecks,
  ArrowLeft,
  CalendarBlank,
  User,
  ShieldCheck,
  Warning,
  Paperclip,
  CheckCircle,
  Eye,
  FolderSimple,
} from "@phosphor-icons/react";

export default function GovernanceReviewsPage() {
  const queryClient = useQueryClient();
  const organisationId = useSessionStore((s) => s.organisationId);

  const [selectedReview, setSelectedReview] = useState<GovernanceReview | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const { data: reviewsRes, isLoading } = useQuery({
    queryKey: ["governanceReviews", organisationId],
    queryFn: () => apiClient.getReviews(),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const reviews = reviewsRes?.data || [];
  const people = peopleRes?.data || [];

  const attestMutation = useMutation({
    mutationFn: (id: string) => apiClient.attestReview(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["governanceReviews"] });
      toast.success(`Review cycle "${res.data.name}" attested successfully`);
      if (selectedReview?.id === res.data.id) {
        setSelectedReview(res.data);
      }
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to attest review");
    },
  });

  const handleOpenDetail = (review: GovernanceReview) => {
    setSelectedReview(review);
    setDetailModalOpen(true);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/governance" className="hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1">
          <ArrowLeft size={16} />
          Governance Overview
        </Link>
        <span>/</span>
        <span className="text-slate-700 dark:text-slate-300 font-medium">Review Cycles & Findings</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Governance Review Cycles & Audit Findings
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Formal recurring steering and audit evaluations across active delivery tiers with traceable evidence.
          </p>
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          No governance review cycles recorded.
        </Card>
      ) : (
        <div className="space-y-6">
          {reviews.map((rev) => {
            const chair = people.find((p) => p.id === rev.chairId);
            const attester = rev.attestedBy ? people.find((p) => p.id === rev.attestedBy) : null;
            const openFindings = rev.findings.filter((f) => f.status !== "Closed");

            return (
              <Card key={rev.id} className="p-6 space-y-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {rev.name}
                      </h2>
                      <StatusChip status={rev.status} />
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {rev.id}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Scope: <span className="font-medium text-slate-800 dark:text-slate-200">{rev.scope}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <CalendarBlank size={14} />
                        Evaluation Period: {formatDate(rev.periodStart)} – {formatDate(rev.periodEnd)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        Chair: {chair?.name || "Governance Lead"}
                      </span>
                      {attester && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle size={14} />
                          Attested by: {attester.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="secondary" size="sm" onClick={() => handleOpenDetail(rev)}>
                      <Eye size={14} className="mr-1" />
                      Inspect Full Dossier
                    </Button>
                    {rev.status !== "Attested" && rev.status !== "Closed" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => attestMutation.mutate(rev.id)}
                        disabled={attestMutation.isPending}
                        className="flex items-center gap-1.5"
                      >
                        <ShieldCheck size={16} />
                        {attestMutation.isPending ? "Attesting..." : "Sign Attestation"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Agenda Items */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Review Agenda & Scope
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {rev.agenda.map((ag, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                      >
                        <FolderSimple size={12} className="text-blue-500" />
                        {ag.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Findings Table */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Formal Audit Findings ({rev.findings.length})
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {openFindings.length} Open / Remediating
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {rev.findings.map((fnd) => {
                      const owner = people.find((p) => p.id === fnd.ownerId);

                      return (
                        <div
                          key={fnd.id}
                          className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              fnd.severity === "Critical"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}>
                              {fnd.severity}
                            </span>
                            <StatusChip status={fnd.status} />
                          </div>

                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {fnd.title}
                          </p>

                          <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                            <span>Owner: {owner?.name || fnd.ownerId}</span>
                            <span>Target: {formatDate(fnd.dueDate)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Dossier Modal */}
      <Modal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        title={selectedReview ? selectedReview.name : "Review Cycle Dossier"}
        maxWidth="lg"
      >
        {selectedReview && (
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Evaluation Window</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {formatDate(selectedReview.periodStart)} to {formatDate(selectedReview.periodEnd)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Scope Statement</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selectedReview.scope}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Attestation Status</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {selectedReview.status}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Reviewed Entities & Agenda
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                {selectedReview.agenda.map((ag, i) => (
                  <li key={i} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/30 rounded border border-slate-200/60 dark:border-slate-700">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                    <span>{ag.label}</span>
                    <span className="text-slate-400 font-mono">({ag.entityType}: {ag.entityId})</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
