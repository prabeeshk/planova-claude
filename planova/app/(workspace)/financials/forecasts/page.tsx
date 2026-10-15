"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { sessionFor, can } from "@/lib/access/permissions";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/formatting/format";
import type { ForecastLine, Project, Budget, ActualCost } from "@/lib/domain/types";
import {
  ChartLineUp,
  Coins,
  Warning,
  CheckCircle,
  Lock,
  ArrowRight,
  FloppyDisk,
  Check,
  Funnel,
  TrendUp,
  Info,
  Calendar,
} from "@phosphor-icons/react";

export default function FinancialsForecastsPage() {
  const queryClient = useQueryClient();
  const organisationId = useSessionStore((s) => s.organisationId);
  const personaId = useSessionStore((s) => s.personaId);
  const session = sessionFor(personaId, organisationId);

  const hasCostPermission = can(session, "cost.view");
  const canEditForecast = can(session, "forecast.edit");

  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [editingCell, setEditingCell] = useState<{ id: string; value: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const { data: budgetsRes } = useQuery({
    queryKey: ["budgets", organisationId],
    queryFn: () => apiClient.getBudgets(),
  });

  const { data: actualsRes } = useQuery({
    queryKey: ["actuals", organisationId],
    queryFn: () => apiClient.getActuals(),
  });

  const { data: forecastsRes } = useQuery({
    queryKey: ["forecasts", organisationId],
    queryFn: () => apiClient.getForecasts(),
  });

  const projects = projectsRes?.data || [];
  const budgets = budgetsRes?.data || [];
  const actuals = actualsRes?.data || [];
  const forecasts = forecastsRes?.data || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: string }) =>
      apiClient.updateForecast(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forecasts", organisationId] });
      setEditingCell(null);
      showToast("Forecast line updated successfully.");
    },
  });

  const publishMutation = useMutation({
    mutationFn: (projectId: string) => apiClient.publishForecast(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forecasts", organisationId] });
      showToast("Draft projections published successfully.");
    },
  });

  // Extract distinct periods
  const periods = useMemo(() => {
    const set = new Set<string>();
    forecasts.forEach((f) => set.add(f.period));
    return Array.from(set).sort();
  }, [forecasts]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (selectedProjectId === "ALL") return projects;
    return projects.filter((p) => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  // Compute metrics (only if hasCostPermission)
  const currencyCode = budgets[0]?.currencyCode || "AED";

  const totalForecastedAmount = useMemo(() => {
    if (!hasCostPermission) return null;
    return forecasts.reduce((acc, f) => acc + (parseFloat(f.amount.amount) || 0), 0);
  }, [forecasts, hasCostPermission]);

  const totalActualsAmount = useMemo(() => {
    if (!hasCostPermission) return null;
    return actuals.reduce((acc, a) => acc + (parseFloat(a.amount.amount) || 0), 0);
  }, [actuals, hasCostPermission]);

  const totalBaselineAmount = useMemo(() => {
    if (!hasCostPermission) return null;
    return budgets.reduce((acc, b) => {
      const approved = b.versions.find((v) => v.status === "Approved") || b.versions[0];
      return acc + (parseFloat(approved?.total.amount || "0") || 0);
    }, 0);
  }, [budgets, hasCostPermission]);

  const totalOutturn = (totalActualsAmount ?? 0) + (totalForecastedAmount ?? 0);
  const baselineVariance = (totalBaselineAmount ?? 0) > 0 ? totalOutturn - (totalBaselineAmount ?? 0) : 0;
  const variancePct = (totalBaselineAmount ?? 0) > 0 ? (baselineVariance / (totalBaselineAmount ?? 0)) * 100 : 0;

  // Threshold alerts (overrun > 10% vs baseline)
  const overrunAlerts = useMemo(() => {
    return projects
      .map((proj) => {
        const projBudget = budgets.find((b) => b.projectId === proj.id);
        const approvedVersion = projBudget?.versions.find((v) => v.status === "Approved") || projBudget?.versions[0];
        const base = parseFloat(approvedVersion?.total.amount || "0") || 0;

        const projActuals = actuals
          .filter((a) => a.projectId === proj.id)
          .reduce((sum, a) => sum + (parseFloat(a.amount.amount) || 0), 0);

        const projForecasts = forecasts
          .filter((f) => f.projectId === proj.id)
          .reduce((sum, f) => sum + (parseFloat(f.amount.amount) || 0), 0);

        const outturn = projActuals + projForecasts;
        const diff = base > 0 ? outturn - base : 0;
        const diffPct = base > 0 ? (diff / base) * 100 : 0;

        return {
          project: proj,
          baseline: base,
          outturn,
          diff,
          diffPct,
          isOverrun: diffPct > 10,
        };
      })
      .filter((item) => item.isOverrun);
  }, [projects, budgets, actuals, forecasts]);

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-emerald-900 border border-emerald-700 px-4 py-3 text-sm text-emerald-100 shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumbs & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/financials" className="hover:text-foreground transition-colors">
              Financials
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Forecasts & Projections</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ChartLineUp className="h-7 w-7 text-indigo-500" />
            Financial Forecasts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Rolling period projections, variance outturn analysis, and draft cost modeling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/financials/budgets">
            <Button variant="outline" size="sm">
              View Baselines
            </Button>
          </Link>
          <Link href="/financials/actuals">
            <Button variant="outline" size="sm">
              Posted Actuals
            </Button>
          </Link>
          {canEditForecast && selectedProjectId !== "ALL" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => publishMutation.mutate(selectedProjectId)}
              disabled={publishMutation.isPending}
            >
              <Check className="h-4 w-4 mr-1.5" />
              Publish Project Forecast
            </Button>
          )}
        </div>
      </div>

      {/* Sensitive Cost Masking Alert Banner */}
      {!hasCostPermission && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          <Lock className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-amber-300">Confidential Financial Data Redacted</h4>
            <p className="text-xs text-amber-200/80 mt-1">
              Your active role (<strong>{session.roleCode}</strong>) does not have the <code>cost.view</code> capability.
              Sensitive currency projections and totals are masked in accordance with PLANOVA security policies to avoid leakage.
            </p>
          </div>
        </div>
      )}

      {/* Overrun Threshold Alerts */}
      {hasCostPermission && overrunAlerts.length > 0 && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4">
          <div className="flex items-center gap-2.5 text-rose-300 font-semibold text-sm mb-2">
            <Warning className="h-5 w-5 text-rose-400" />
            <span>Threshold Overrun Warning ({overrunAlerts.length} Projects Exceeding Budget Variance Policy)</span>
          </div>
          <div className="space-y-2 mt-2">
            {overrunAlerts.map(({ project, baseline, outturn, diff, diffPct }) => (
              <div
                key={project.id}
                className="flex items-center justify-between text-xs bg-rose-900/30 rounded-lg p-2.5 border border-rose-800/40"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-rose-200">{project.code}</span>
                  <span className="text-rose-100 font-medium">{project.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-rose-300/80">
                    Baseline: {formatMoney({ amount: baseline.toString(), currencyCode })}
                  </span>
                  <span className="text-rose-300/80">
                    Projected Outturn: {formatMoney({ amount: outturn.toString(), currencyCode })}
                  </span>
                  <span className="font-semibold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-700/60">
                    +{diffPct.toFixed(1)}% (+{formatMoney({ amount: diff.toString(), currencyCode })})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Approved Baseline</span>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {hasCostPermission
              ? formatMoney({ amount: (totalBaselineAmount ?? 0).toString(), currencyCode })
              : "••••••••"}
          </div>
          <span className="text-xs text-muted-foreground mt-1 block">Sum of locked project versions</span>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Posted Actuals (To Date)</span>
            <Coins className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {hasCostPermission
              ? formatMoney({ amount: (totalActualsAmount ?? 0).toString(), currencyCode })
              : "••••••••"}
          </div>
          <span className="text-xs text-muted-foreground mt-1 block">Incurred & booked ERP costs</span>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Projected Outturn</span>
            <TrendUp className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {hasCostPermission
              ? formatMoney({ amount: totalOutturn.toString(), currencyCode })
              : "••••••••"}
          </div>
          <span className="text-xs text-muted-foreground mt-1 block">Actuals + Future Forecasts</span>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Outturn Variance</span>
            <ChartLineUp className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold flex items-baseline gap-2">
            <span className={baselineVariance > 0 ? "text-rose-400" : "text-emerald-400"}>
              {hasCostPermission
                ? `${baselineVariance > 0 ? "+" : ""}${formatMoney({
                    amount: baselineVariance.toString(),
                    currencyCode,
                  })}`
                : "••••••••"}
            </span>
            {hasCostPermission && (
              <span className="text-xs font-medium text-muted-foreground">
                ({variancePct > 0 ? "+" : ""}
                {variancePct.toFixed(1)}%)
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground mt-1 block">Delta against approved plan</span>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30 p-3 rounded-xl border border-border">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Funnel className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium text-muted-foreground">Scope:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Published</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Draft Projection (Editable)</span>
          </div>
        </div>
      </div>

      {/* Forecast Matrix Table */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Forecast Projection Matrix</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select any draft cell to update rolling projections. Values calculate outturn dynamically.
            </p>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            Currency: {currencyCode}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                <th className="py-3 px-4 font-semibold sticky left-0 bg-muted/60 z-10">Project</th>
                <th className="py-3 px-3 font-semibold text-right">Baseline</th>
                <th className="py-3 px-3 font-semibold text-right">Actuals</th>
                {periods.map((period) => (
                  <th key={period} className="py-3 px-3 font-semibold text-right min-w-[120px]">
                    {period}
                  </th>
                ))}
                <th className="py-3 px-3 font-semibold text-right">Outturn</th>
                <th className="py-3 px-4 font-semibold text-right">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProjects.map((project) => {
                const projBudget = budgets.find((b) => b.projectId === project.id);
                const approvedVersion = projBudget?.versions.find((v) => v.status === "Approved") || projBudget?.versions[0];
                const baselineVal = parseFloat(approvedVersion?.total.amount || "0") || 0;

                const projActualsVal = actuals
                  .filter((a) => a.projectId === project.id)
                  .reduce((sum, a) => sum + (parseFloat(a.amount.amount) || 0), 0);

                const projForecasts = forecasts.filter((f) => f.projectId === project.id);
                const projForecastTotal = projForecasts.reduce(
                  (sum, f) => sum + (parseFloat(f.amount.amount) || 0),
                  0
                );

                const outturnVal = projActualsVal + projForecastTotal;
                const varianceVal = baselineVal > 0 ? outturnVal - baselineVal : 0;
                const variancePctVal = baselineVal > 0 ? (varianceVal / baselineVal) * 100 : 0;

                return (
                  <tr key={project.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 sticky left-0 bg-card z-10 font-medium text-foreground">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs text-primary">{project.code}</span>
                        <span className="truncate max-w-[200px] text-muted-foreground text-[11px]">
                          {project.name}
                        </span>
                      </div>
                    </td>

                    {/* Baseline */}
                    <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                      {hasCostPermission
                        ? formatMoney({ amount: baselineVal.toString(), currencyCode })
                        : "••••••"}
                    </td>

                    {/* Actuals */}
                    <td className="py-3 px-3 text-right font-mono text-emerald-400">
                      {hasCostPermission
                        ? formatMoney({ amount: projActualsVal.toString(), currencyCode })
                        : "••••••"}
                    </td>

                    {/* Period Columns */}
                    {periods.map((period) => {
                      const line = projForecasts.find((f) => f.period === period);
                      const isEditing = editingCell?.id === line?.id;
                      const isDraft = line?.status === "Draft";

                      if (!line) {
                        return (
                          <td key={period} className="py-3 px-3 text-right text-muted-foreground/40 font-mono">
                            -
                          </td>
                        );
                      }

                      return (
                        <td key={period} className="py-3 px-3 text-right font-mono">
                          {!hasCostPermission ? (
                            <span className="text-muted-foreground/50">••••••</span>
                          ) : isEditing && editingCell ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                value={editingCell.value}
                                onChange={(e) =>
                                  setEditingCell({ id: line.id, value: e.target.value })
                                }
                                className="w-20 px-1.5 py-0.5 text-right font-mono text-xs bg-background border border-primary rounded text-foreground focus:outline-none"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="primary"
                                className="h-6 px-1.5 text-[10px]"
                                onClick={() =>
                                  updateMutation.mutate({
                                    id: line.id,
                                    amount: editingCell.value,
                                  })
                                }
                                disabled={updateMutation.isPending}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                if (canEditForecast) {
                                  setEditingCell({ id: line.id, value: line.amount.amount });
                                }
                              }}
                              className={`group inline-flex items-center justify-end gap-1 px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                                isDraft
                                  ? "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/20"
                                  : "text-foreground hover:bg-muted/40"
                              }`}
                            >
                              <span>
                                {formatMoney({ amount: line.amount.amount, currencyCode })}
                              </span>
                              {isDraft && canEditForecast && (
                                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-amber-400">
                                  ✎
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Outturn */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-foreground">
                      {hasCostPermission
                        ? formatMoney({ amount: outturnVal.toString(), currencyCode })
                        : "••••••"}
                    </td>

                    {/* Variance */}
                    <td className="py-3 px-4 text-right font-mono">
                      {hasCostPermission ? (
                        <span
                          className={`font-semibold ${
                            varianceVal > 0 ? "text-rose-400" : "text-emerald-400"
                          }`}
                        >
                          {varianceVal > 0 ? "+" : ""}
                          {variancePctVal.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">••••</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Explanatory Guide Box */}
      <div className="rounded-xl border border-border bg-card/60 p-4 text-xs text-muted-foreground space-y-2">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Info className="h-4 w-4 text-primary" />
          <span>PLANOVA Enterprise Forecast Conventions</span>
        </div>
        <ul className="list-disc list-inside space-y-1 ml-1 text-muted-foreground/80">
          <li>
            <strong>Posted Actuals:</strong> Reconciled ERP and timesheet ledger items through current period.
          </li>
          <li>
            <strong>Rolling Forecast:</strong> Forward-looking projections updated monthly by project managers and reviewed by Finance Controllers.
          </li>
          <li>
            <strong>Variance Overrun Threshold:</strong> Projections exceeding approved baseline by &gt;10% automatically trigger RAID escalation flags.
          </li>
          <li>
            <strong>Privacy & Data Masking:</strong> Sensitive cost rates and currency numbers are masked for unauthorized personas to guarantee institutional compliance.
          </li>
        </ul>
      </div>
    </div>
  );
}
