"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { formatMoney, formatDate } from "@/lib/formatting/format";
import type { Portfolio, Program, Project, StrategicObjective } from "@/lib/domain/types";
import { toast } from "sonner";
import {
  Briefcase,
  ArrowLeft,
  FolderSimple,
  Coins,
  ShieldCheck,
  Warning,
  CheckCircle,
  Sparkle,
  SlidersHorizontal,
  Target,
  ArrowRight,
  ChartBar,
  Camera,
  GitBranch,
} from "@phosphor-icons/react";

export default function PortfolioDetailPage() {
  const params = useParams<{ portfolioId: string }>();
  const organisationId = useSessionStore((s) => s.organisationId);

  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [budgetMultiplier, setBudgetMultiplier] = useState(100); // 100%
  const [deferNonCore, setDeferNonCore] = useState(false);
  const [scheduleCompressionDays, setScheduleCompressionDays] = useState(0);

  const { data: portfolioRes, isLoading: loadingPortfolio } = useQuery({
    queryKey: ["portfolio", params.portfolioId, organisationId],
    queryFn: () => apiClient.getPortfolio(params.portfolioId),
    enabled: !!params.portfolioId,
  });

  const { data: programsRes } = useQuery({
    queryKey: ["programs", params.portfolioId, organisationId],
    queryFn: () => apiClient.getPrograms(params.portfolioId),
    enabled: !!params.portfolioId,
  });

  const { data: objectivesRes } = useQuery({
    queryKey: ["objectives", params.portfolioId, organisationId],
    queryFn: () => apiClient.getObjectives(params.portfolioId),
    enabled: !!params.portfolioId,
  });

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const portfolio = portfolioRes?.data;
  const programs = programsRes?.data || [];
  const objectives = objectivesRes?.data || [];
  const allProjects = projectsRes?.data || [];
  const people = peopleRes?.data || [];

  const portfolioProjects = allProjects.filter((p) => p.portfolioId === params.portfolioId);
  const owner = people.find((p) => p.id === portfolio?.ownerId);

  // Baseline Investment
  const baseInvestment = parseFloat(portfolio?.investment.amount || "0");
  const currencyCode = portfolio?.investment.currencyCode || "AED";

  // Simulation Computations
  const simulatedInvestment = (baseInvestment * (budgetMultiplier / 100)) - (deferNonCore ? 850000 : 0);
  const simulatedROI = 14.2 + (budgetMultiplier > 100 ? 1.8 : -1.2) + (deferNonCore ? 2.4 : 0);
  const simulatedHealth = deferNonCore ? "Optimised" : budgetMultiplier < 100 ? "Constrained" : "Balanced";

  const handleCaptureSnapshot = () => {
    toast.success("Simulation scenario snapshot captured (immutable preview)");
    setSimulatorOpen(false);
  };

  if (loadingPortfolio || !portfolio) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-12 w-96 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/portfolio" className="hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1">
          <ArrowLeft size={16} />
          Portfolios
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-700 dark:text-slate-300">{portfolio.name}</span>
      </div>

      {/* Portfolio Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: portfolio.accent || "#2563eb" }}
            />
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
              {portfolio.id}
            </span>
            <span className="text-xs text-slate-500">
              Executive Sponsor: <strong className="text-slate-800 dark:text-slate-200">{owner?.name || "Executive Lead"}</strong>
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{portfolio.name}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{portfolio.description}</p>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-800 flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-400 block uppercase tracking-wider text-[10px]">Total Investment</span>
              <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                {formatMoney(portfolio.investment)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase tracking-wider text-[10px]">Active Programs</span>
              <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                {programs.length}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase tracking-wider text-[10px]">Assigned Projects</span>
              <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                {portfolioProjects.length}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: What-If Scenario Simulator */}
        <div className="shrink-0">
          <Button
            variant="primary"
            onClick={() => setSimulatorOpen(true)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal size={18} />
            Launch Scenario Simulator
          </Button>
        </div>
      </div>

      {/* Strategic Objectives */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Target size={20} className="text-purple-600 dark:text-purple-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Strategic Objectives Alignment
          </h2>
        </div>

        {objectives.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No formal strategic objectives mapped to this portfolio.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {objectives.map((obj) => (
              <div
                key={obj.id}
                className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {obj.name}
                  </h4>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    Target 2026
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {obj.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Constituent Programs */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <GitBranch size={20} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Constituent Delivery Programs ({programs.length})
          </h2>
        </div>

        {programs.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No programs configured in this portfolio.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map((prog) => {
              const manager = people.find((p) => p.id === prog.managerId);
              const progProjects = allProjects.filter((p) => p.portfolioId === portfolio.id);

              return (
                <div
                  key={prog.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <span className="font-mono text-xs text-slate-500">{prog.id}</span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {prog.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {prog.purpose}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
                    <span>Lead: {manager?.name || "Program Manager"}</span>
                    <Link href={`/portfolio/programs/${prog.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs text-blue-600 dark:text-blue-400">
                        View Program →
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Portfolio Projects Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FolderSimple size={20} className="text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Assigned Tier 1 Projects ({portfolioProjects.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-xs uppercase font-mono">
              <tr>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Project Name</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Health</th>
                <th className="py-2.5 px-3">Progress</th>
                <th className="py-2.5 px-3">Target Completion</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {portfolioProjects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                    {p.code}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100">
                    <Link href={`/projects/${p.id}`} className="hover:underline text-blue-600 dark:text-blue-400">
                      {p.name}
                    </Link>
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    {p.method}
                  </td>
                  <td className="py-3 px-3">
                    <StatusChip status={p.health} />
                  </td>
                  <td className="py-3 px-3 font-mono text-xs font-semibold">
                    {p.progress}%
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-500">
                    {formatDate(p.targetDate)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link href={`/projects/${p.id}`}>
                      <Button variant="ghost" size="sm">
                        <ArrowRight size={14} />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Scenario Simulator Modal */}
      <Modal
        open={simulatorOpen}
        onOpenChange={setSimulatorOpen}
        title={`What-If Scenario Simulation — ${portfolio.name}`}
        maxWidth="lg"
      >
        <div className="space-y-6 text-sm">
          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              <Sparkle size={16} />
              <span>UI-Only Simulation Engine</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Test capital adjustment hypotheses, deferred scope impacts, and resource constraint modeling. Production records remain untouched until formally submitted as a governance change.
            </p>
          </div>

          {/* Sliders & Toggles */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Budget Capital Allocation: {budgetMultiplier}%</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">
                  {formatMoney({ amount: ((baseInvestment * budgetMultiplier) / 100).toFixed(2), currencyCode })}
                </span>
              </div>
              <input
                type="range"
                min="70"
                max="130"
                step="5"
                value={budgetMultiplier}
                onChange={(e) => setBudgetMultiplier(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>-30% Contraction</span>
                <span>Baseline (100%)</span>
                <span>+30% Expansion</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block">
                  Defer Non-Core Tier 2 Scope
                </span>
                <span className="text-xs text-slate-500">
                  Postpones discretionary advisory spend to relieve squad capacity.
                </span>
              </div>
              <input
                type="checkbox"
                checked={deferNonCore}
                onChange={(e) => setDeferNonCore(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded"
              />
            </div>
          </div>

          {/* Live Outcome Comparison Matrix */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Baseline Allocation</span>
              <p className="text-base font-bold font-mono text-slate-700 dark:text-slate-300">
                {formatMoney({ amount: baseInvestment.toFixed(2), currencyCode })}
              </p>
              <span className="text-xs text-slate-500">14.2% Estimated Return</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 block">
                Simulated Projection
              </span>
              <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatMoney({ amount: simulatedInvestment.toFixed(2), currencyCode })}
              </p>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {simulatedROI.toFixed(1)}% Return ({simulatedHealth})
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setSimulatorOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={handleCaptureSnapshot} className="flex items-center gap-1.5">
              <Camera size={16} />
              Capture Immutable Snapshot
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
