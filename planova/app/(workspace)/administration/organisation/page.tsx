"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Organisation, OrganisationUnit } from "@/lib/domain/types";
import {
  Buildings,
  ArrowLeft,
  CheckCircle,
  CurrencyDollar,
  Clock,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  TreeStructure,
  FloppyDisk,
  Warning,
} from "@phosphor-icons/react";

export default function OrganisationAdministrationPage() {
  const queryClient = useQueryClient();
  const organisationId = useSessionStore((s) => s.organisationId);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const { data: orgRes, isLoading } = useQuery({
    queryKey: ["organisation", organisationId],
    queryFn: () => apiClient.getOrganisation(),
  });

  const org = orgRes?.data;

  // Local state for editing
  const [orgName, setOrgName] = useState(org?.name || "Meridian Global Enterprises");
  const [currencyCode, setCurrencyCode] = useState(org?.currencyCode || "AED");
  const [timezone, setTimezone] = useState(org?.timezone || "Asia/Dubai");
  const [flags, setFlags] = useState<Record<string, boolean>>({
    copilotIntelligence: true,
    capacityHeatmap: true,
    costRateMasking: true,
    strictApprovals: true,
    governanceAttestation: true,
    ...(org?.featureFlags || {}),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Organisation>) => apiClient.updateOrganisation(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organisation", organisationId] });
      showToast("Organisation settings saved successfully.");
    },
  });

  const handleToggleFlag = (key: string) => {
    const updated = { ...flags, [key]: !flags[key] };
    setFlags(updated);
    updateMutation.mutate({ featureFlags: updated });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: orgName,
      currencyCode,
      timezone,
      featureFlags: flags,
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-emerald-900 border border-emerald-700 px-4 py-3 text-sm text-emerald-100 shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/administration" className="hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              Administration
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Organisation & Governance</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Buildings className="h-7 w-7 text-indigo-500" />
            Institutional Organisation & Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Operating units hierarchy, standard currency, regional timezone, and enterprise feature flags.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 col): Settings & Feature Flags */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Organisation Settings Card */}
          <Card className="p-5 border-border bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Enterprise Parameters</h3>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Legal Entity Name</label>
                  <input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground block mb-1">Organisation Code</label>
                  <input
                    disabled
                    value={org?.code || "MERIDIAN"}
                    className="w-full bg-muted border border-border rounded-lg p-2 text-muted-foreground font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Base Reporting Currency</label>
                  <select
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  >
                    <option value="AED">AED — United Arab Emirates Dirham</option>
                    <option value="USD">USD — United States Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound Sterling</option>
                    <option value="SAR">SAR — Saudi Riyal</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Institutional Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  >
                    <option value="Asia/Dubai">Asia/Dubai (UTC+04:00)</option>
                    <option value="UTC">UTC (Universal Coordinated Time)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="America/New_York">America/New_York (EST/EDT)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-border">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={updateMutation.isPending}
                >
                  <FloppyDisk className="h-4 w-4 mr-1.5" />
                  Save Organization Settings
                </Button>
              </div>
            </form>
          </Card>

          {/* Feature Flags Card */}
          <Card className="border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Active Governance Feature Flags</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Toggle platform capabilities and enforcement policies in real-time.
              </p>
            </div>

            <div className="divide-y divide-border">
              {[
                {
                  key: "copilotIntelligence",
                  name: "Copilot Intelligence Signals",
                  desc: "Heuristic and rule-based diagnostic signals with transparent evidence disclosures.",
                },
                {
                  key: "capacityHeatmap",
                  name: "Capacity & Contention Heatmaps",
                  desc: "Visualise weekly commitment ratios against the 40-hour baseline across all squad members.",
                },
                {
                  key: "costRateMasking",
                  name: "Confidential Cost Rate Masking",
                  desc: "Enforce cost.view permission to conceal sensitive contractor and internal hourly pay rates.",
                },
                {
                  key: "strictApprovals",
                  name: "Strict Approvals & Self-Approval Prevention",
                  desc: "Prevent creators from self-approving changes (POL-DEL-02) and verify SHA-256 version payloads.",
                },
                {
                  key: "governanceAttestation",
                  name: "Periodic Governance Attestations",
                  desc: "Require formal sign-off attestation for audit reviews and versioned compliance policies.",
                },
              ].map((flag) => {
                const isEnabled = flags[flag.key] ?? true;

                return (
                  <div
                    key={flag.key}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground">{flag.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {flag.key}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{flag.desc}</p>
                    </div>

                    <button
                      onClick={() => handleToggleFlag(flag.key)}
                      className="text-primary hover:opacity-80 transition-opacity p-1"
                    >
                      {isEnabled ? (
                        <ToggleRight className="h-7 w-7 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column (1 col): Department Hierarchy Tree & Admin Guard */}
        <div className="space-y-6">
          {/* Department Hierarchy Card */}
          <Card className="p-5 border-border bg-card space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TreeStructure className="h-4 w-4 text-indigo-500" />
              <span>Organisation Hierarchy Tree</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-muted/40 rounded-lg border border-border">
                <span className="font-semibold text-foreground block">Executive Office (unit-exec)</span>
                <span className="text-[11px] text-muted-foreground">Top-level steering & sponsor board</span>
              </div>

              <div className="pl-4 space-y-2 border-l-2 border-indigo-500/30 ml-2">
                <div className="p-2.5 bg-muted/40 rounded-lg border border-border">
                  <span className="font-semibold text-foreground block">
                    Technology & Engineering (unit-tech)
                  </span>
                  <div className="pl-3 mt-1.5 space-y-1.5 border-l border-border text-[11px] text-muted-foreground">
                    <div>&bull; Digital Product Delivery (unit-digital)</div>
                    <div>&bull; Cloud Architecture (unit-cloud)</div>
                    <div>&bull; Core Banking (unit-core)</div>
                  </div>
                </div>

                <div className="p-2.5 bg-muted/40 rounded-lg border border-border">
                  <span className="font-semibold text-foreground block">
                    Finance & Operations (unit-fin)
                  </span>
                  <span className="text-[11px] text-muted-foreground">Group Controllership & Budgets</span>
                </div>

                <div className="p-2.5 bg-muted/40 rounded-lg border border-border">
                  <span className="font-semibold text-foreground block">
                    Governance & Compliance (unit-gov)
                  </span>
                  <span className="text-[11px] text-muted-foreground">Risk, Audit, and CAB Reviews</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Emergency Safety Protocol Info */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Emergency Admin Guard (POL-ADM-01)</span>
            </div>
            <p>
              PLANOVA prevents the removal or deactivation of the last active emergency platform administrator to
              ensure uninterrupted institutional management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
