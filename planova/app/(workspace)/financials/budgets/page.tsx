"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { sessionFor, can } from "@/lib/access/permissions";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatMoney, formatDate } from "@/lib/formatting/format";
import type { Budget, Project } from "@/lib/domain/types";
import {
  Coins,
  ArrowLeft,
  FolderSimple,
  ArrowRight,
  Lock,
  GitFork,
  CalendarBlank,
} from "@phosphor-icons/react";

export default function BudgetsDirectoryPage() {
  const organisationId = useSessionStore((s) => s.organisationId);
  const personaId = useSessionStore((s) => s.personaId);
  const session = sessionFor(personaId, organisationId);

  const hasCostPermission = can(session, "cost.view");

  const { data: budgetsRes, isLoading: loadingBudgets } = useQuery({
    queryKey: ["budgets", organisationId],
    queryFn: () => apiClient.getBudgets(),
  });

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const budgets = budgetsRes?.data || [];
  const projects = projectsRes?.data || [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/financials" className="hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1">
          <ArrowLeft size={16} />
          Financial Control
        </Link>
        <span>/</span>
        <span className="text-slate-700 dark:text-slate-300 font-medium">Budget Baselines</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Coins size={26} className="text-blue-500" />
            Project Budget Baselines & Capital Versions
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Governed baseline snapshots with line category allocations, version change control, and approval audit linkages.
          </p>
        </div>
      </div>

      {/* Budgets Grid */}
      {loadingBudgets ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          No project budgets registered.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const project = projects.find((p) => p.id === b.projectId);
            const approvedVer = b.versions.find((v) => v.status === "Approved") || b.versions[0];
            const draftVer = b.versions.find((v) => v.status === "Draft");

            return (
              <Card
                key={b.id}
                className="p-6 flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                          FY{b.fiscalYear}
                        </span>
                        <span className="font-mono text-xs text-slate-500">
                          {b.versions.length} Version{b.versions.length > 1 ? "s" : ""}
                        </span>
                        {approvedVer && <StatusChip status={approvedVer.status} />}
                      </div>

                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {project ? project.name : b.projectId}
                      </h2>
                    </div>

                    <span className="font-mono text-xs text-slate-400 font-bold">
                      {b.currencyCode}
                    </span>
                  </div>

                  {/* Approved Total Card */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 block">Approved Capital Baseline:</span>
                      <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                        {hasCostPermission && approvedVer
                          ? formatMoney(approvedVer.total)
                          : "[Redacted — FDA Req.]"}
                      </span>
                    </div>

                    {draftVer && (
                      <div className="text-right">
                        <span className="text-amber-600 dark:text-amber-400 font-semibold block flex items-center gap-1 justify-end">
                          <GitFork size={12} /> Draft v{draftVer.version}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {hasCostPermission ? formatMoney(draftVer.total) : "Protected"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    ID: <span className="font-mono">{b.id}</span>
                  </span>
                  <Link href={`/financials/budgets/${b.id}`}>
                    <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
                      <span>Inspect Versions</span>
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
