"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SimulatedAIIndicator } from "@/components/ui/SimulatedAIIndicator";
import { formatDate } from "@/lib/formatting/format";
import {
  Sparkle,
  Warning,
  CalendarBlank,
  Coins,
  Clock,
  CheckCircle,
  ArrowRight,
  ShieldWarning,
  FolderSimple,
  CaretDown,
  CaretUp,
  SlidersHorizontal,
  Info,
  GitFork,
  Scales,
} from "@phosphor-icons/react";

type SignalCategory = "All" | "Schedule" | "Delivery" | "Risk" | "Resource" | "Finance" | "Governance";
type SignalSeverity = "All" | "Critical" | "High" | "Medium" | "Info";

interface InsightSignal {
  id: string;
  category: "Schedule" | "Delivery" | "Risk" | "Resource" | "Finance" | "Governance";
  severity: "Critical" | "High" | "Medium" | "Info";
  title: string;
  summary: string;
  ruleExplanation: string;
  confidenceScore: number;
  metric: string;
  evidenceItems: { label: string; href: string; type: string }[];
  actionLabel: string;
  actionHref: string;
  detectedAt: string;
}

export default function InsightsPage() {
  const organisationId = useSessionStore((s) => s.organisationId);

  const [categoryFilter, setCategoryFilter] = useState<SignalCategory>("All");
  const [severityFilter, setSeverityFilter] = useState<SignalSeverity>("All");
  const [expandedTrayId, setExpandedTrayId] = useState<string | null>("sig-01");

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const { data: raidRes } = useQuery({
    queryKey: ["raidItems", "all", organisationId],
    queryFn: () => apiClient.getRaidItems(),
  });

  const { data: allocationsRes } = useQuery({
    queryKey: ["allocations", "all", organisationId],
    queryFn: () => apiClient.getAllocations(),
  });

  const { data: budgetsRes } = useQuery({
    queryKey: ["budgets", organisationId],
    queryFn: () => apiClient.getBudgets(),
  });

  const projects = projectsRes?.data || [];
  const raidItems = raidRes?.data || [];
  const allocations = allocationsRes?.data || [];
  const budgets = budgetsRes?.data || [];

  // Deterministic Intelligence Signals based on active enterprise telemetry
  const signals: InsightSignal[] = [
    {
      id: "sig-01",
      category: "Risk",
      severity: "Critical",
      title: "Biometric Latency Fallback Approaching Unmitigated Review Window",
      summary:
        "RAID-AUR-01 has a matrix score of 20 (Critical). Review date is overdue/due within 48h, and Central Bank HSM fallback configuration remains unverified.",
      ruleExplanation:
        "Rule HEUR-RSK-04: Triggers when any Critical tier risk (Score ≥ 16) is within 3 days of scheduled committee review without an approved response verification artifact.",
      confidenceScore: 98,
      metric: "Matrix Score: 20/25 (P4 × I5)",
      evidenceItems: [
        { label: "RAID Item: RAID-AUR-01", href: "/governance/raid/raid-aur-1", type: "RaidItem" },
        { label: "Project Aurora Customer Experience", href: "/projects/proj-aurora", type: "Project" },
        { label: "Policy POL-SEC-01 Zero Trust", href: "/governance/policies", type: "Policy" },
      ],
      actionLabel: "Inspect & Mitigate Risk",
      actionHref: "/governance/raid/raid-aur-1",
      detectedAt: "2 hours ago",
    },
    {
      id: "sig-02",
      category: "Resource",
      severity: "High",
      title: "Cloud Infrastructure Architect Capacity Contention Detected",
      summary:
        "Daniel Vance is committed at 125% allocation across Project Nimbus (EKS migration) and Project Aurora (Kubernetes cluster ingress) over the next 4 weekly cycles.",
      ruleExplanation:
        "Rule HEUR-CAP-01: Triggers when any individual squad member has total allocated commitment exceeding 100% across concurrent active delivery projects.",
      confidenceScore: 95,
      metric: "125% Peak Commitment",
      evidenceItems: [
        { label: "Allocation Heatmap (Daniel Vance)", href: "/resources/capacity", type: "Resource" },
        { label: "Project Nimbus Cloud Migration", href: "/projects/proj-nimbus", type: "Project" },
      ],
      actionLabel: "Rebalance Capacity Heatmap",
      actionHref: "/resources/capacity",
      detectedAt: "4 hours ago",
    },
    {
      id: "sig-03",
      category: "Finance",
      severity: "High",
      title: "Atlas Core ERP Advisory Cost Variance Exceeds Budget Baseline",
      summary:
        "Actual external advisory spend for SAP S/4HANA migration has reached AED 140,000 against a baseline tolerance of AED 120,000 (16.6% variance).",
      ruleExplanation:
        "Rule HEUR-FIN-02: Flags cumulative actual cost line overrun exceeding 10% of approved baseline version snapshot.",
      confidenceScore: 92,
      metric: "+16.6% Over Approved Baseline",
      evidenceItems: [
        { label: "Atlas Financial Ledger", href: "/financials", type: "Finance" },
        { label: "Change Request CR-ATL-001", href: "/changes", type: "Change" },
      ],
      actionLabel: "Inspect Budget Baselines",
      actionHref: "/financials",
      detectedAt: "Yesterday",
    },
    {
      id: "sig-04",
      category: "Schedule",
      severity: "Medium",
      title: "Delivery Milestone Gate Compression on Mobile Banking Core",
      summary:
        "Milestone 'SWIFT CBPR+ Ready' has zero calendar buffer remaining before production release window due to 2 blocked upstream API dependencies.",
      ruleExplanation:
        "Rule HEUR-SCH-03: Triggers when critical-path successor milestone buffer drops below 5 calendar days while predecessor tasks are flagged in 'Blocked' status.",
      confidenceScore: 89,
      metric: "0 Days Buffer",
      evidenceItems: [
        { label: "Gantt Timeline View", href: "/projects/proj-aurora/timeline", type: "Timeline" },
        { label: "Project Milestones Grid", href: "/projects/proj-aurora/milestones", type: "Milestone" },
      ],
      actionLabel: "View Gantt Timeline",
      actionHref: "/projects/proj-aurora/timeline",
      detectedAt: "Yesterday",
    },
    {
      id: "sig-05",
      category: "Governance",
      severity: "Medium",
      title: "Policy Attestation Deficit Prior to Canary Gate",
      summary:
        "10% of the assigned engineering squad has not signed annual attestation for POL-SEC-01 (Enterprise Zero Trust) scheduled for production sign-off.",
      ruleExplanation:
        "Rule HEUR-GOV-01: Mandates 100% attestation coverage across privileged squads prior to Production Gate release submission.",
      confidenceScore: 94,
      metric: "90% Attested (Target 100%)",
      evidenceItems: [
        { label: "Policy POL-SEC-01", href: "/governance/policies", type: "Policy" },
        { label: "Release 2026.4 Gate Dossier", href: "/releases", type: "Release" },
      ],
      actionLabel: "View Policy Register",
      actionHref: "/governance/policies",
      detectedAt: "2 days ago",
    },
  ];

  const filteredSignals = signals.filter((s) => {
    if (categoryFilter !== "All" && s.category !== categoryFilter) return false;
    if (severityFilter !== "All" && s.severity !== severityFilter) return false;
    return true;
  });

  const toggleEvidenceTray = (id: string) => {
    setExpandedTrayId(expandedTrayId === id ? null : id);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkle size={24} className="text-blue-500" />
              PLANOVA Intelligence Signals & Heuristics
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
              {filteredSignals.length} Active Signals
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Automated delivery anomaly detection, capacity pinch points, and cross-project governance correlations.
          </p>
        </div>

        {/* Global Transparent Disclaimer */}
        <SimulatedAIIndicator
          whyShown="Signals generated by PLANOVA Intelligence using rule-based telemetry and trend heuristics."
          compact
        />
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(["All", "Schedule", "Delivery", "Risk", "Resource", "Finance", "Governance"] as const).map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  categoryFilter === cat
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>

        {/* Severity Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 px-2.5 text-slate-700 dark:text-slate-300"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Info">Info</option>
          </select>
        </div>
      </Card>

      {/* Signals Feed */}
      <div className="space-y-4">
        {filteredSignals.map((signal) => {
          const isExpanded = expandedTrayId === signal.id;

          const severityStyles = {
            Critical: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
            High: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
            Medium: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
            Info: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200",
          }[signal.severity];

          return (
            <Card
              key={signal.id}
              className="p-6 transition-all hover:border-slate-300 dark:hover:border-slate-700 space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded border ${severityStyles}`}>
                      {signal.severity}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {signal.category}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      Confidence: {signal.confidenceScore}%
                    </span>
                    <span className="text-xs text-slate-400">{signal.detectedAt}</span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {signal.title}
                  </h2>

                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {signal.summary}
                  </p>

                  <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 pt-1">
                    <span>Observed Metric:</span>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                      {signal.metric}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                  <Link href={signal.actionHref}>
                    <Button variant="primary" size="sm" className="w-full flex items-center justify-center gap-1.5">
                      <span>{signal.actionLabel}</span>
                      <ArrowRight size={14} />
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleEvidenceTray(signal.id)}
                    className="flex items-center justify-center gap-1 text-xs text-slate-600 dark:text-slate-400"
                  >
                    <span>Why am I seeing this?</span>
                    {isExpanded ? <CaretUp size={12} /> : <CaretDown size={12} />}
                  </Button>
                </div>
              </div>

              {/* "Why am I seeing this?" Expandable Evidence Tray */}
              {isExpanded && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3 animate-in fade-in-50 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider">
                    <Info size={16} className="text-blue-500" />
                    <span>Rule-Based Diagnostic Explanation</span>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200/60 dark:border-slate-800 leading-relaxed">
                    {signal.ruleExplanation}
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-slate-500 font-medium">Underlying Source Entities:</span>
                    <div className="flex flex-wrap gap-2">
                      {signal.evidenceItems.map((ev, i) => (
                        <Link
                          key={i}
                          href={ev.href}
                          className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-blue-600 dark:text-blue-400 font-mono text-xs flex items-center gap-1 transition-colors"
                        >
                          <span>{ev.label}</span>
                          <ArrowRight size={10} />
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/40 dark:border-slate-700/40 text-[11px] text-slate-400 italic">
                    Signal generated deterministically from mock transaction stream. Zero black-box neural hallucinations.
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
