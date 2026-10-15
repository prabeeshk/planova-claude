"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSessionStore } from "@/stores/useSessionStore";
import { PERSONAS, type PersonaId } from "@/lib/access/permissions";
import { MockApiClient } from "@/lib/mock-api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  Gear,
  UserSwitch,
  Buildings,
  Bug,
  ArrowsClockwise,
  CheckCircle,
  Warning,
  Sliders,
  ShieldCheck,
  Lightning,
} from "@phosphor-icons/react";

export default function SettingsPage() {
  const personaId = useSessionStore((s) => s.personaId);
  const organisationId = useSessionStore((s) => s.organisationId);
  const setPersona = useSessionStore((s) => s.setPersona);
  const setOrganisation = useSessionStore((s) => s.setOrganisation);

  const [faultConfig, setFaultConfig] = useState(MockApiClient.getFaultConfig());
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpdateFaultConfig = (updates: Partial<typeof faultConfig>) => {
    const updated = { ...faultConfig, ...updates };
    setFaultConfig(updated);
    MockApiClient.setFaultConfig(updated);
    showToast("Fault injection parameters updated.");
  };

  const handleResetData = () => {
    MockApiClient.resetAllData();
    setResetModalOpen(false);
    showToast("All demo records reset to initial deterministic seeds.");
    window.location.reload();
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
      <div>
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Link href="/home" className="hover:text-foreground transition-colors">
            Workspace
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Platform & Demo Settings</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <Gear className="h-7 w-7 text-indigo-500" />
          Settings & Simulation Controls
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Switch active demo personas, test multi-tenant organization isolation, and inject network faults.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 col): Persona & Organisation Switcher */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Persona Lens */}
          <Card className="p-5 border-border bg-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <UserSwitch className="h-5 w-5 text-indigo-500" />
                <h3 className="text-sm font-semibold text-foreground">Active Impersonation Persona</h3>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                Current Role: {PERSONAS.find((p) => p.id === personaId)?.roleCode}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PERSONAS.map((p) => {
                const isSelected = p.id === personaId;

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setPersona(p.id);
                      showToast(`Switched active persona lens to ${p.label}.`);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary ring-1 ring-primary"
                        : "bg-muted/20 border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground">{p.label}</span>
                      {isSelected && (
                        <CheckCircle className="h-4 w-4 text-primary" weight="fill" />
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground block mt-0.5">
                      {p.roleCode}
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                      {p.blurb}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Active Demo Organisation Switcher */}
          <Card className="p-5 border-border bg-card space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Buildings className="h-5 w-5 text-indigo-500" />
              <h3 className="text-sm font-semibold text-foreground">Multi-Tenant Organization</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: "org-meridian",
                  name: "Meridian Global Enterprises",
                  code: "MERIDIAN",
                  currency: "AED",
                  timezone: "Asia/Dubai",
                  desc: "Primary scenario: Aurora mobile banking, Atlas SAP migration, 12 projects, 35+ RAID items.",
                },
                {
                  id: "org-northwind",
                  name: "Northwind Financial Holdings",
                  code: "NORTHWIND",
                  currency: "GBP",
                  timezone: "Europe/London",
                  desc: "Secondary scenario: Strict tenant boundary demonstration, isolated portfolios and teams.",
                },
              ].map((org) => {
                const isSelected = org.id === organisationId;

                return (
                  <div
                    key={org.id}
                    onClick={() => {
                      setOrganisation(org.id);
                      showToast(`Switched active tenant to ${org.name}.`);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary ring-1 ring-primary"
                        : "bg-muted/20 border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground">{org.name}</span>
                      {isSelected && (
                        <CheckCircle className="h-4 w-4 text-primary" weight="fill" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground mt-1">
                      <span>{org.currency}</span>
                      <span>•</span>
                      <span>{org.timezone}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                      {org.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column (1 col): Fault Injection & Seed Reset */}
        <div className="space-y-6">
          {/* Fault Injection Panel */}
          <Card className="p-5 border-border bg-card space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Bug className="h-5 w-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Fault Injection Controls</h3>
                <span className="text-[11px] text-muted-foreground">Test resiliency & error boundaries</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* Simulate Transport Latency */}
              <div className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg border border-border">
                <div>
                  <span className="font-semibold text-foreground block">Simulate Latency</span>
                  <span className="text-[11px] text-muted-foreground">
                    120ms – 320ms synthetic delay
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={faultConfig.simulateLatency}
                  onChange={(e) =>
                    handleUpdateFaultConfig({ simulateLatency: e.target.checked })
                  }
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
              </div>

              {/* Force Error Status */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">Force Mock Error Status</label>
                <select
                  value={faultConfig.forceErrorStatus || "none"}
                  onChange={(e) =>
                    handleUpdateFaultConfig({
                      forceErrorStatus: e.target.value === "none" ? null : parseInt(e.target.value),
                    })
                  }
                  className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none font-mono text-xs"
                >
                  <option value="none">None (Normal Healthy Operation)</option>
                  <option value="403">403 Forbidden (RBAC Scope Error)</option>
                  <option value="404">404 Not Found (Missing Entity)</option>
                  <option value="409">409 Conflict (Optimistic Lock Collision)</option>
                  <option value="500">500 Server Error (Internal Mock Failure)</option>
                </select>
              </div>

              {/* Optimistic Locking Conflict */}
              <div className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg border border-border">
                <div>
                  <span className="font-semibold text-foreground block">RowVersion Checks</span>
                  <span className="text-[11px] text-muted-foreground">
                    Reject stale client mutations
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={faultConfig.simulateConflictOnVersionMismatch}
                  onChange={(e) =>
                    handleUpdateFaultConfig({
                      simulateConflictOnVersionMismatch: e.target.checked,
                    })
                  }
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
              </div>
            </div>
          </Card>

          {/* Seed Reset Card */}
          <Card className="p-5 border-border bg-card space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ArrowsClockwise className="h-4 w-4 text-primary" />
              <span>Reset Demo Seed Data</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Restore all mock records (projects, tasks, RAID, changes, allocations, budgets) to the fresh master
              fixtures. Any local edits or additions will be cleared.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-rose-400 hover:text-rose-300 border-rose-800"
              onClick={() => setResetModalOpen(true)}
            >
              Reset Seed Data to Baseline
            </Button>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      <Modal
        open={resetModalOpen}
        onOpenChange={(open: boolean) => setResetModalOpen(open)}
        title="Confirm Fixture Reset"
      >
        <div className="space-y-4 text-xs">
          <p className="text-muted-foreground leading-relaxed">
            Are you sure you want to reset all mock data to the initial factory seed? All draft budgets, edited
            allocations, newly created tasks, and submitted approvals will be reset.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setResetModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleResetData}
            >
              Confirm Reset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
