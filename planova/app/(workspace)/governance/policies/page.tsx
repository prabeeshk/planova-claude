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
import type { Policy } from "@/lib/domain/types";
import { toast } from "sonner";
import {
  Scales,
  ArrowLeft,
  CalendarBlank,
  ShieldCheck,
  CheckCircle,
  FileText,
  Eye,
  Check,
  Users,
} from "@phosphor-icons/react";

export default function GovernancePoliciesPage() {
  const queryClient = useQueryClient();
  const organisationId = useSessionStore((s) => s.organisationId);

  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [attestationOnly, setAttestationOnly] = useState(false);

  const { data: policiesRes, isLoading } = useQuery({
    queryKey: ["governancePolicies", organisationId],
    queryFn: () => apiClient.getPolicies(),
  });

  const policies = policiesRes?.data || [];

  const attestMutation = useMutation({
    mutationFn: (id: string) => apiClient.attestPolicy(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["governancePolicies"] });
      toast.success(`Attestation recorded for policy ${res.data.code}`);
      if (selectedPolicy?.id === res.data.id) {
        setSelectedPolicy(res.data);
      }
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to record attestation");
    },
  });

  const handleOpenDetail = (policy: Policy) => {
    setSelectedPolicy(policy);
    setDetailModalOpen(true);
  };

  const filtered = attestationOnly
    ? policies.filter((p) => p.attestationRequired)
    : policies;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/governance" className="hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1">
          <ArrowLeft size={16} />
          Governance Overview
        </Link>
        <span>/</span>
        <span className="text-slate-700 dark:text-slate-300 font-medium">Standards & Policies Catalogue</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Enterprise Governance Policies & Standards
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Authoritative regulatory and operational standards versioned with workforce attestation compliance metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={attestationOnly ? "primary" : "secondary"}
            size="sm"
            onClick={() => setAttestationOnly(!attestationOnly)}
          >
            {attestationOnly ? "Showing Attestation Required" : "Filter Attestation Required"}
          </Button>
        </div>
      </div>

      {/* Policies Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          No policies found matching the filter.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((pol) => {
            const pct = pol.audienceCount > 0 ? Math.round((pol.attestedCount / pol.audienceCount) * 100) : 100;

            return (
              <Card key={pol.id} className="p-6 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {pol.code}
                        </span>
                        <span className="font-mono text-xs text-slate-500">v{pol.version}</span>
                        {pol.attestationRequired && (
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            Attestation Mandated
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {pol.name}
                      </h2>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {pol.summary}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                    <CalendarBlank size={14} />
                    <span>Effective from: {formatDate(pol.effectiveFrom)}</span>
                  </div>

                  {/* Attestation Progress Bar */}
                  {pol.attestationRequired && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          Workforce Attestation Coverage
                        </span>
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {pol.attestedCount} / {pol.audienceCount} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="secondary" size="sm" onClick={() => handleOpenDetail(pol)}>
                    <Eye size={14} className="mr-1" />
                    Read Clauses ({pol.clauses.length})
                  </Button>

                  {pol.attestationRequired && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => attestMutation.mutate(pol.id)}
                      disabled={attestMutation.isPending}
                      className="flex items-center gap-1.5"
                    >
                      <CheckCircle size={16} />
                      Sign Attestation
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Policy Clauses Modal */}
      <Modal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        title={selectedPolicy ? `${selectedPolicy.code}: ${selectedPolicy.name}` : "Policy Dossier"}
        maxWidth="lg"
      >
        {selectedPolicy && (
          <div className="space-y-5 text-sm">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Version</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">v{selectedPolicy.version}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Effective Date</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{formatDate(selectedPolicy.effectiveFrom)}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 pt-1">
                {selectedPolicy.summary}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Governance Clauses & Standards
              </h4>
              <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-300 list-decimal pl-4">
                {selectedPolicy.clauses.map((clause, i) => (
                  <li key={i} className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200/60 dark:border-slate-700 leading-relaxed">
                    {clause}
                  </li>
                ))}
              </ol>
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
