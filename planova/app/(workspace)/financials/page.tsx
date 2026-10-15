"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { sessionFor, can } from "@/lib/access/permissions";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatMoney, formatDate } from "@/lib/formatting/format";
import type { Budget, ActualCost, ForecastLine, Project } from "@/lib/domain/types";
import {
  Coins,
  TrendUp,
  Receipt,
  ChartLineUp,
  ArrowRight,
  Lock,
  FolderSimple,
  Warning,
  CheckCircle,
  FileCsv,
} from "@phosphor-icons/react";

export default function FinancialsOverviewPage() {
  const organisationId = useSessionStore((s) => s.organisationId);
  const personaId = useSessionStore((s) => s.personaId);
  const session = sessionFor(personaId, organisationId);

  const hasCostPermission = can(session, "cost.view");

  const { data: budgetsRes, isLoading: loadingBudgets } = useQuery({
    queryKey: ["budgets", organisationId],
    queryFn: () => apiClient.getBudgets(),
  });

  const { data: actualsRes, isLoading: loadingActuals } = useQuery({
    queryKey: ["actuals", organisationId],
    queryFn: () => apiClient.getActuals(),
  });

  const { data: forecastsRes, isLoading: loadingForecasts } = useQuery({
    queryKey: ["forecasts", organisationId],
    queryFn: () => apiClient.getForecasts(),
  });

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const budgets = budgetsRes?.data || [];
  const actuals = actualsRes?.data || [];
  const forecasts = forecastsRes?.data || [];
  const projects = projectsRes?.data || [];

  const currencyCode = budgets[0]?.currencyCode || "AED";

  // Calculate totals
  const totalBudgetApproved = budgets.reduce((acc, b) => {
    const approvedVer = b.versions.find((v) => v.status === "Approved") || b.versions[0];
    return acc + (parseFloat(approvedVer?.total.amount || "0") || 0);
  }, 0);

  const totalActuals = actuals.reduce((acc, a) => acc + (parseFloat(a.amount.amount || "0") || 0), 0);
  const totalForecast = forecasts.reduce((acc, f) => acc + (parseFloat(f.amount.amount || "0") || 0), 0);
  const variance = totalBudgetApproved - (totalActuals + totalForecast);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Coins size={26} className="text-emerald-500" />
              Enterprise Financials & Cost Control
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-800">
              Reporting Currency: {currencyCode}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Governed capital accounting, budget version baselines, actual ERP expenditure, and forward cash commitments.
          </p>
        </div>

        {!hasCostPermission ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
            <Lock size={14} className="shrink-0" />
            <span>Sensitive financial totals redacted for persona ({session.personaId}).</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/financials/budgets">
              <Button variant="secondary" size="sm">
                Budget Baselines
              </Button>
            </Link>
            <Link href="/financials/actuals">
              <Button variant="secondary" size="sm">
                ERP Actuals
              </Button>
            </Link>
            <Link href="/financials/forecasts">
              <Button variant="secondary" size="sm">
                Forecast Curves
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Approved Baseline</span>
            <Coins size={20} className="text-blue-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {hasCostPermission
              ? formatMoney({ amount: totalBudgetApproved.toFixed(2), currencyCode })
              : "[Redacted]"}
          </div>
          <div className="text-xs text-slate-500">Across {budgets.length} approved project budgets</div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Actual Spend</span>
            <Receipt size={20} className="text-emerald-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {hasCostPermission
              ? formatMoney({ amount: totalActuals.toFixed(2), currencyCode })
              : "[Redacted]"}
          </div>
          <div className="text-xs text-slate-500">{actuals.length} ERP ledger entries posted</div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Forward Forecast</span>
            <ChartLineUp size={20} className="text-purple-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-purple-600 dark:text-purple-400">
            {hasCostPermission
              ? formatMoney({ amount: totalForecast.toFixed(2), currencyCode })
              : "[Redacted]"}
          </div>
          <div className="text-xs text-slate-500">FY2026/27 projected cash burn</div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Net Variance</span>
            <TrendUp size={20} className={variance >= 0 ? "text-emerald-500" : "text-rose-500"} />
          </div>
          <div
            className={`text-2xl lg:text-3xl font-bold font-mono ${
              !hasCostPermission
                ? "text-slate-500"
                : variance >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {hasCostPermission
              ? (variance >= 0 ? "+" : "") + formatMoney({ amount: variance.toFixed(2), currencyCode })
              : "[Redacted]"}
          </div>
          <div className="text-xs text-slate-500">
            {variance >= 0 ? "Under budget envelope" : "Over budget threshold"}
          </div>
        </Card>
      </div>

      {/* Subsurfaces Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition-all shadow-xs">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Coins size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Budget Versions & Baselines
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Maintain immutable approved budgets, edit draft cost categories, and submit capital revisions for governance approval.
            </p>
          </div>
          <Link href="/financials/budgets">
            <Button variant="secondary" className="w-full flex items-center justify-center gap-1.5">
              <span>View Budgets ({budgets.length})</span>
              <ArrowRight size={14} />
            </Button>
          </Link>
        </Card>

        <Card className="p-6 flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition-all shadow-xs">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Receipt size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              ERP Actual Expenditure
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Audit posted ledger transactions from SAP and Oracle with simulated CSV import validation and duplicate prevention.
            </p>
          </div>
          <Link href="/financials/actuals">
            <Button variant="secondary" className="w-full flex items-center justify-center gap-1.5">
              <span>Inspect Actuals ({actuals.length})</span>
              <ArrowRight size={14} />
            </Button>
          </Link>
        </Card>

        <Card className="p-6 flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition-all shadow-xs">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ChartLineUp size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Forward Cost Forecasts
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Period-based projection curves, draft allocation forecasting, and automated overrun alerts before milestone lock.
            </p>
          </div>
          <Link href="/financials/forecasts">
            <Button variant="secondary" className="w-full flex items-center justify-center gap-1.5">
              <span>Open Forecast Curves</span>
              <ArrowRight size={14} />
            </Button>
          </Link>
        </Card>
      </div>

      {/* Project Breakdown Table */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
          Project Capital Envelope & Variance Summary
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-xs uppercase font-mono">
              <tr>
                <th className="py-2.5 px-3">Project Code</th>
                <th className="py-2.5 px-3">Project Name</th>
                <th className="py-2.5 px-3">Approved Budget</th>
                <th className="py-2.5 px-3">Actual Spent</th>
                <th className="py-2.5 px-3">Variance Status</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {projects.map((proj) => {
                const projBudget = budgets.find((b) => b.projectId === proj.id);
                const approvedVersion = projBudget?.versions.find((v) => v.status === "Approved") || projBudget?.versions[0];
                const projActuals = actuals.filter((a) => a.projectId === proj.id);
                const projActualTotal = projActuals.reduce((a, b) => a + (parseFloat(b.amount.amount) || 0), 0);
                const projBudgetTotal = parseFloat(approvedVersion?.total.amount || "0");
                const diff = projBudgetTotal - projActualTotal;
                const isOver = diff < 0;

                return (
                  <tr key={proj.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {proj.code}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100">
                      <Link href={`/projects/${proj.id}`} className="hover:underline text-blue-600 dark:text-blue-400">
                        {proj.name}
                      </Link>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs">
                      {hasCostPermission && approvedVersion
                        ? formatMoney(approvedVersion.total)
                        : "[Redacted]"}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs">
                      {hasCostPermission
                        ? formatMoney({ amount: projActualTotal.toFixed(2), currencyCode })
                        : "[Redacted]"}
                    </td>
                    <td className="py-3 px-3">
                      {hasCostPermission ? (
                        <span
                          className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
                            isOver
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                        >
                          {isOver ? `Over by ${formatMoney({ amount: Math.abs(diff).toFixed(2), currencyCode })}` : "On Budget"}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Protected</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {projBudget && (
                        <Link href={`/financials/budgets/${projBudget.id}`}>
                          <Button variant="ghost" size="sm">
                            <ArrowRight size={14} />
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
