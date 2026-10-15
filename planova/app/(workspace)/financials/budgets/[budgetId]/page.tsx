"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { sessionFor, can } from "@/lib/access/permissions";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { formatMoney, formatDate, formatDateTime } from "@/lib/formatting/format";
import type { Budget, BudgetVersion, BudgetLine } from "@/lib/domain/types";
import { toast } from "sonner";
import {
  Coins,
  ArrowLeft,
  FolderSimple,
  Lock,
  GitFork,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Warning,
  PencilSimple,
  FloppyDisk,
} from "@phosphor-icons/react";

export default function BudgetDetailPage() {
  const params = useParams<{ budgetId: string }>();
  const queryClient = useQueryClient();
  const organisationId = useSessionStore((s) => s.organisationId);
  const personaId = useSessionStore((s) => s.personaId);
  const session = sessionFor(personaId, organisationId);

  const hasCostPermission = can(session, "cost.view");

  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);

  const { data: budgetRes, isLoading } = useQuery({
    queryKey: ["budget", params.budgetId, organisationId],
    queryFn: () => apiClient.getBudget(params.budgetId),
    enabled: !!params.budgetId,
  });

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const budget = budgetRes?.data;
  const projects = projectsRes?.data || [];
  const project = projects.find((p) => p.id === budget?.projectId);

  const updateLineMutation = useMutation({
    mutationFn: ({ lineId, amount }: { lineId: string; amount: string }) =>
      apiClient.updateBudgetLine(params.budgetId, lineId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget", params.budgetId] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Draft line updated and total recalculated");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to update budget line");
    },
  });

  if (isLoading || !budget) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-12 w-96 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  const versions = budget.versions;
  const currentVersion: BudgetVersion = versions[selectedVersionIndex] || versions[0];
  const isDraft = currentVersion.status === "Draft";

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/financials/budgets" className="hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1">
          <ArrowLeft size={16} />
          Budget Baselines
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-700 dark:text-slate-300">{budget.id}</span>
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
              FY{budget.fiscalYear}
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
              v{currentVersion.version} ({currentVersion.status})
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

          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {project?.name || "Project"} Capital Budget
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Currency: <strong className="font-mono text-slate-700 dark:text-slate-300">{budget.currencyCode}</strong></span>
            {currentVersion.approvedAt && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle size={14} /> Approved on {formatDate(currentVersion.approvedAt)}
              </span>
            )}
            {currentVersion.approvalId && (
              <span>
                Approval Workflow:{" "}
                <Link
                  href={`/approvals/${currentVersion.approvalId}`}
                  className="font-mono text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
                >
                  {currentVersion.approvalId} <ArrowRight size={12} />
                </Link>
              </span>
            )}
          </div>
        </div>

        {/* Version Total Metric */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shrink-0 text-right">
          <span className="text-xs uppercase tracking-wider text-slate-400 block font-semibold">
            Version Total Allocation
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {hasCostPermission ? formatMoney(currentVersion.total) : "[Redacted]"}
          </div>
          <span className="text-[10px] text-slate-500 block font-mono">
            {currentVersion.lines.length} cost line categories
          </span>
        </div>
      </div>

      {/* Version Selector Tabs */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 gap-2">
        {versions.map((ver, idx) => (
          <button
            key={ver.id}
            onClick={() => setSelectedVersionIndex(idx)}
            className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
              selectedVersionIndex === idx
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <GitFork size={16} />
            <span>Version {ver.version}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                ver.status === "Approved"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              {ver.status}
            </span>
          </button>
        ))}
      </div>

      {/* Immutability Banner if Approved */}
      {!isDraft && (
        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-3 text-xs text-emerald-900 dark:text-emerald-300">
          <ShieldCheck size={20} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="font-semibold text-sm">Immutable Approved Baseline Snapshot</p>
            <p className="text-emerald-800/80 dark:text-emerald-300/80">
              This baseline was formally signed off by the Executive Investment Board. Any subsequent budgetary modifications require a drafted amendment version and governance change submission.
            </p>
          </div>
        </div>
      )}

      {/* Draft Edition Banner if Draft */}
      {isDraft && (
        <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl flex items-center justify-between gap-3 text-xs text-blue-900 dark:text-blue-300">
          <div className="flex items-center gap-3">
            <PencilSimple size={20} className="shrink-0 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-semibold text-sm">Editable Draft Amendment</p>
              <p className="text-blue-800/80 dark:text-blue-300/80">
                You can adjust line item allocation figures. Changing values will dynamically recalculate the version capital total.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => toast.success("Draft submitted for governance committee vote")}
          >
            Submit for Approval
          </Button>
        </div>
      )}

      {/* Line Categories Table */}
      <Card className="overflow-x-auto p-4">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-mono uppercase text-slate-500">
              <th className="py-3 px-3">Cost Category</th>
              <th className="py-3 px-3">Period</th>
              <th className="py-3 px-3">Allocated Amount ({budget.currencyCode})</th>
              <th className="py-3 px-3">Mode</th>
              {isDraft && <th className="py-3 px-3 text-right">Quick Update</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {currentVersion.lines.map((line) => (
              <tr key={line.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                  {line.category}
                </td>
                <td className="py-3 px-3 font-mono text-xs text-slate-500">
                  {line.period}
                </td>
                <td className="py-3 px-3 font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                  {hasCostPermission ? (
                    isDraft ? (
                      <input
                        type="number"
                        defaultValue={line.amount}
                        onBlur={(e) =>
                          updateLineMutation.mutate({ lineId: line.id, amount: e.target.value })
                        }
                        className="py-1 px-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm w-44 focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      formatMoney({ amount: line.amount, currencyCode: budget.currencyCode })
                    )
                  ) : (
                    "[Redacted]"
                  )}
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      isDraft
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {isDraft ? "Draft Field" : "Frozen"}
                  </span>
                </td>
                {isDraft && (
                  <td className="py-3 px-3 text-right text-xs text-slate-400">
                    Auto-saved on blur
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
