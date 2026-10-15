"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/formatting/format";
import {
  ShieldCheck,
  Warning,
  Scales,
  FileText,
  CheckCircle,
  ArrowRight,
  ListChecks,
  Clock,
  User,
  FolderSimple,
  ShieldWarning,
  Buildings,
  Eye,
} from "@phosphor-icons/react";

export default function GovernanceOverviewPage() {
  const organisationId = useSessionStore((s) => s.organisationId);

  const { data: reviewsRes, isLoading: loadingReviews } = useQuery({
    queryKey: ["governanceReviews", organisationId],
    queryFn: () => apiClient.getReviews(),
  });

  const { data: exceptionsRes, isLoading: loadingExceptions } = useQuery({
    queryKey: ["governanceExceptions", organisationId],
    queryFn: () => apiClient.getExceptions(),
  });

  const { data: policiesRes, isLoading: loadingPolicies } = useQuery({
    queryKey: ["governancePolicies", organisationId],
    queryFn: () => apiClient.getPolicies(),
  });

  const { data: raidRes } = useQuery({
    queryKey: ["raidItems", "all", organisationId],
    queryFn: () => apiClient.getRaidItems(),
  });

  const { data: approvalsRes } = useQuery({
    queryKey: ["approvals", organisationId],
    queryFn: () => apiClient.getApprovals(),
  });

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const reviews = reviewsRes?.data || [];
  const exceptions = exceptionsRes?.data || [];
  const policies = policiesRes?.data || [];
  const raidItems = raidRes?.data || [];
  const approvals = approvalsRes?.data || [];
  const projects = projectsRes?.data || [];
  const people = peopleRes?.data || [];

  // Metrics
  const criticalRaidCount = raidItems.filter((r) => r.severity === "Critical" && r.status !== "Closed" && r.status !== "Resolved").length;
  const openExceptionsCount = exceptions.filter((e) => e.remediationStatus !== "Remediated" && e.remediationStatus !== "Accepted").length;
  const criticalExceptionsCount = exceptions.filter((e) => e.severity === "Critical" && e.remediationStatus !== "Remediated").length;
  const activeReviews = reviews.filter((r) => r.status === "In Review" || r.status === "Planned");
  const pendingApprovalsCount = approvals.filter((a) => a.status === "Pending" || a.status === "In Progress").length;

  const totalAttestationRequired = policies.reduce((acc, p) => acc + (p.attestationRequired ? p.audienceCount : 0), 0);
  const totalAttested = policies.reduce((acc, p) => acc + (p.attestationRequired ? p.attestedCount : 0), 0);
  const attestationPercentage = totalAttestationRequired > 0 ? Math.round((totalAttested / totalAttestationRequired) * 100) : 100;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Enterprise Governance & Compliance
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-800">
              Posture: Attested
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Executive control framework synthesizing regulatory policies, audit review cycles, active exceptions, and enterprise RAID.
          </p>
        </div>

        {/* Quick subsurface jump links */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/governance/raid">
            <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
              <ShieldWarning size={14} />
              RAID Register
            </Button>
          </Link>
          <Link href="/governance/reviews">
            <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
              <ListChecks size={14} />
              Review Cycles
            </Button>
          </Link>
          <Link href="/governance/exceptions">
            <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
              <Warning size={14} />
              Exceptions
            </Button>
          </Link>
          <Link href="/governance/policies">
            <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
              <Scales size={14} />
              Policies
            </Button>
          </Link>
        </div>
      </div>

      {/* Governance KPI Posture Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Policy Attestation</span>
            <CheckCircle size={20} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {attestationPercentage}%
          </div>
          <div className="text-xs text-slate-500">
            {totalAttested} of {totalAttestationRequired} sign-offs recorded
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Critical Exceptions</span>
            <Warning size={20} className="text-rose-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {criticalExceptionsCount}
          </div>
          <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
            {openExceptionsCount} active exceptions under remediation
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Pending Approvals</span>
            <Clock size={20} className="text-blue-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {pendingApprovalsCount}
          </div>
          <div className="text-xs text-slate-500">
            <Link href="/approvals" className="text-blue-600 dark:text-blue-400 hover:underline">
              View decision queue →
            </Link>
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Unmitigated Critical Risks</span>
            <ShieldWarning size={20} className="text-amber-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {criticalRaidCount}
          </div>
          <div className="text-xs text-slate-500">
            <Link href="/governance/raid" className="text-amber-600 dark:text-amber-400 hover:underline">
              Inspect RAID matrix →
            </Link>
          </div>
        </Card>
      </div>

      {/* Main Governance Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Active Review Cycles & Open Exceptions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Review Spotlight */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ListChecks size={20} className="text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                  Current Governance Review Period
                </h3>
              </div>
              <Link
                href="/governance/reviews"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                All Review Cycles →
              </Link>
            </div>

            {activeReviews.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4">No active review cycles currently open.</p>
            ) : (
              <div className="space-y-4">
                {activeReviews.map((rev) => {
                  const chair = people.find((p) => p.id === rev.chairId);

                  return (
                    <div
                      key={rev.id}
                      className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-slate-900 dark:text-slate-100">
                              {rev.name}
                            </span>
                            <StatusChip status={rev.status} />
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">Scope: {rev.scope}</p>
                        </div>
                        <div className="text-xs text-slate-500 font-mono text-right">
                          <span>Period: {formatDate(rev.periodStart)} – {formatDate(rev.periodEnd)}</span>
                        </div>
                      </div>

                      {/* Review Findings Summary */}
                      <div className="space-y-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <span>Audit Findings ({rev.findings.length})</span>
                          <span className="text-slate-500 font-normal">Chair: {chair?.name || "Governance Officer"}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {rev.findings.map((fnd) => (
                            <div
                              key={fnd.id}
                              className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                  fnd.severity === "Critical"
                                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                }`}>
                                  {fnd.severity}
                                </span>
                                <StatusChip status={fnd.status} />
                              </div>
                              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                                {fnd.title}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono">
                                Due {formatDate(fnd.dueDate)} • Ref: {fnd.source.label}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Active Exceptions Attention Queue */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Warning size={20} className="text-amber-500" />
                <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                  Governed Policy Exceptions
                </h3>
              </div>
              <Link
                href="/governance/exceptions"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                All Exceptions ({exceptions.length}) →
              </Link>
            </div>

            <div className="space-y-3">
              {exceptions.map((exc) => {
                const policy = policies.find((p) => p.id === exc.policyId);
                const project = projects.find((p) => p.id === exc.projectId);
                const owner = people.find((p) => p.id === exc.ownerId);

                return (
                  <div
                    key={exc.id}
                    className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          exc.severity === "Critical"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}>
                          {exc.severity}
                        </span>
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {exc.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Policy: <span className="font-medium text-slate-700 dark:text-slate-300">{policy?.name || exc.policyId}</span>
                        {project && ` • Project: ${project.name}`}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                        <span>Owner: {owner?.name || "Governance Lead"}</span>
                        <span>Expires: {formatDate(exc.effectiveTo)}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        exc.remediationStatus === "Remediated"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : exc.remediationStatus === "In Progress"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                      }`}>
                        {exc.remediationStatus}
                      </span>
                      <Link href="/governance/exceptions">
                        <Button variant="ghost" size="sm">
                          <Eye size={14} />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Policies & Governance Standards Catalogue */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Scales size={20} className="text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                  Regulatory Policies
                </h3>
              </div>
              <Link
                href="/governance/policies"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Catalogue →
              </Link>
            </div>

            <div className="space-y-4">
              {policies.map((pol) => {
                const pct = pol.audienceCount > 0 ? Math.round((pol.attestedCount / pol.audienceCount) * 100) : 100;

                return (
                  <div
                    key={pol.id}
                    className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {pol.code}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">v{pol.version}</span>
                        </div>
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mt-1">
                          {pol.name}
                        </h4>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {pol.summary}
                    </p>

                    {pol.attestationRequired && (
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Attestation Sign-off</span>
                          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {pol.attestedCount}/{pol.audienceCount} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Governance Authority Disclaimer */}
          <Card className="p-5 space-y-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <ShieldCheck size={16} className="text-blue-500" />
              <span>Statutory Compliance Baseline</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Policies reflect UAE Central Bank operational resilience guidelines, ISO 27001 ISMS standards, and corporate delegation authorities. All audits are cryptographically stamped and preserved in the append-only ledger.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
