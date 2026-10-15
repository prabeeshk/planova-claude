"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatMoney, formatDate } from "@/lib/formatting/format";
import type { Portfolio, Project } from "@/lib/domain/types";
import {
  Briefcase,
  TrendUp,
  FolderSimple,
  ArrowRight,
  ChartPieSlice,
  ShieldCheck,
  Warning,
  CheckCircle,
  Coins,
  Stack,
  Sparkle,
} from "@phosphor-icons/react";

export default function PortfolioDirectoryPage() {
  const organisationId = useSessionStore((s) => s.organisationId);

  const { data: portfoliosRes, isLoading: loadingPortfolios } = useQuery({
    queryKey: ["portfolios", organisationId],
    queryFn: () => apiClient.getPortfolios(),
  });

  const { data: projectsRes, isLoading: loadingProjects } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const portfolios = portfoliosRes?.data || [];
  const projects = projectsRes?.data || [];
  const people = peopleRes?.data || [];

  // Aggregate metrics
  const totalInvestmentAmount = portfolios.reduce((acc, p) => acc + (parseFloat(p.investment.amount) || 0), 0);
  const totalCurrency = portfolios[0]?.investment.currencyCode || "AED";

  const onTrackProjects = projects.filter((p) => p.health === "On Track").length;
  const atRiskProjects = projects.filter((p) => p.health === "At Risk").length;
  const criticalProjects = projects.filter((p) => p.health === "Critical").length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Briefcase size={26} className="text-blue-500" />
              Strategic Portfolios & Investment
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
              {portfolios.length} Active Portfolios
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Executive oversight connecting strategic business objectives, capital allocations, and multi-program health trends.
          </p>
        </div>
      </div>

      {/* Aggregate Portfolio KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Committed Capital</span>
            <Coins size={20} className="text-emerald-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {formatMoney({ amount: totalInvestmentAmount.toFixed(2), currencyCode: totalCurrency })}
          </div>
          <div className="text-xs text-slate-500">Across {portfolios.length} capital funds</div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>On Track Deliveries</span>
            <CheckCircle size={20} className="text-emerald-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {onTrackProjects}
          </div>
          <div className="text-xs text-slate-500">Green baseline alignment</div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>At-Risk Watchlist</span>
            <Warning size={20} className="text-amber-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {atRiskProjects}
          </div>
          <div className="text-xs text-slate-500">Under committee review</div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Critical Interventions</span>
            <ShieldCheck size={20} className="text-rose-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {criticalProjects}
          </div>
          <div className="text-xs text-slate-500">Immediate steering escalation</div>
        </Card>
      </div>

      {/* Portfolios Gallery Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Stack size={20} className="text-blue-500" />
          Strategic Investment Portfolios
        </h2>

        {loadingPortfolios ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map((portfolio) => {
              const portfolioProjects = projects.filter((p) => p.portfolioId === portfolio.id);
              const owner = people.find((p) => p.id === portfolio.ownerId);

              return (
                <Card
                  key={portfolio.id}
                  className="p-6 flex flex-col justify-between space-y-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
                          className="w-3 h-3 rounded-full inline-block mr-2"
                          style={{ backgroundColor: portfolio.accent || "#2563eb" }}
                        />
                        <span className="font-mono text-xs text-slate-500">{portfolio.id}</span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                          {portfolio.name}
                        </h3>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {portfolio.description}
                    </p>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                        Allocated Capital Envelope
                      </span>
                      <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                        {formatMoney(portfolio.investment)}
                      </p>
                    </div>

                    {/* Health Trend Sparkline */}
                    {portfolio.healthTrend.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
                          Quarterly Health Trend
                        </span>
                        <div className="flex items-center gap-1.5 h-6">
                          {portfolio.healthTrend.map((ht, idx) => {
                            const total = ht.onTrack + ht.atRisk + ht.critical;
                            const onTrackPct = total > 0 ? (ht.onTrack / total) * 100 : 0;
                            const atRiskPct = total > 0 ? (ht.atRisk / total) * 100 : 0;
                            const critPct = total > 0 ? (ht.critical / total) * 100 : 0;

                            return (
                              <div
                                key={idx}
                                className="flex-1 flex flex-col justify-end h-full rounded overflow-hidden bg-slate-100 dark:bg-slate-800"
                                title={`${ht.period}: ${ht.onTrack} green, ${ht.atRisk} amber, ${ht.critical} red`}
                              >
                                <div className="w-full bg-emerald-500" style={{ height: `${onTrackPct}%` }} />
                                <div className="w-full bg-amber-500" style={{ height: `${atRiskPct}%` }} />
                                <div className="w-full bg-rose-500" style={{ height: `${critPct}%` }} />
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>{portfolio.healthTrend[0]?.period}</span>
                          <span>{portfolio.healthTrend[portfolio.healthTrend.length - 1]?.period}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {portfolioProjects.length} Projects • Lead: {owner?.name || "Executive"}
                    </span>
                    <Link href={`/portfolio/${portfolio.id}`}>
                      <Button variant="secondary" size="sm" className="flex items-center gap-1">
                        <span>Inspect</span>
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

      {/* Cross-Portfolio Project Mosaic */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Drill-Through Project Delivery Mosaic
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Unified cross-portfolio progress and risk distribution across all tier 1 deliverables.
            </p>
          </div>
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              All Projects Directory →
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {projects.map((proj) => {
            const portfolio = portfolios.find((p) => p.id === proj.portfolioId);

            return (
              <Link
                key={proj.id}
                href={`/projects/${proj.id}`}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors space-y-2 block"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                    {proj.code}
                  </span>
                  <StatusChip status={proj.health} />
                </div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                  {proj.name}
                </h4>
                {portfolio && (
                  <span className="text-[10px] font-mono text-slate-500 block truncate">
                    Portfolio: {portfolio.name}
                  </span>
                )}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Progress</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {proj.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
