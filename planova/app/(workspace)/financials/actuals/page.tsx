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
import { Modal } from "@/components/ui/Modal";
import { formatMoney, formatDate } from "@/lib/formatting/format";
import type { ActualCost, CostCategory } from "@/lib/domain/types";
import { toast } from "sonner";
import {
  Receipt,
  ArrowLeft,
  FileCsv,
  UploadSimple,
  Warning,
  CheckCircle,
  FolderSimple,
  Lock,
  Building,
  CalendarBlank,
  Sparkle,
} from "@phosphor-icons/react";

export default function ActualsLedgerPage() {
  const organisationId = useSessionStore((s) => s.organisationId);
  const personaId = useSessionStore((s) => s.personaId);
  const session = sessionFor(personaId, organisationId);

  const hasCostPermission = can(session, "cost.view");

  const [projectFilter, setProjectFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedDemoFile, setSelectedDemoFile] = useState<"clean" | "duplicate">("clean");

  const { data: actualsRes, isLoading } = useQuery({
    queryKey: ["actuals", organisationId],
    queryFn: () => apiClient.getActuals(),
  });

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const actuals = actualsRes?.data || [];
  const projects = projectsRes?.data || [];

  const filteredActuals = actuals.filter((a) => {
    if (projectFilter !== "all" && a.projectId !== projectFilter) return false;
    if (sourceFilter !== "all" && a.source !== sourceFilter) return false;
    if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
    return true;
  });

  const totalFilteredAmount = filteredActuals.reduce(
    (acc, a) => acc + (parseFloat(a.amount.amount) || 0),
    0
  );
  const currencyCode = actuals[0]?.amount.currencyCode || "AED";

  const handleSimulateImport = () => {
    if (selectedDemoFile === "duplicate") {
      toast.warning("Simulated Import Complete: 8 rows posted, 2 duplicate keys rejected");
    } else {
      toast.success("Simulated Import Complete: 12 rows validated and posted to mock ledger");
    }
    setImportModalOpen(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/financials" className="hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1">
          <ArrowLeft size={16} />
          Financial Control
        </Link>
        <span>/</span>
        <span className="text-slate-700 dark:text-slate-300 font-medium">ERP Actual Expenditure Ledger</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Receipt size={26} className="text-emerald-500" />
            Posted Actual Expenditure Ledger
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            General ledger postings integrated from Oracle Fusion and SAP S/4HANA with automated duplicate reconciliation.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setImportModalOpen(true)}
          className="flex items-center gap-2"
        >
          <FileCsv size={18} />
          Simulate CSV Ingestion
        </Button>
      </div>

      {/* Filter and Metric Toolbar */}
      <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 px-2.5 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 px-2.5 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Sources</option>
            <option value="ERP">Oracle / SAP ERP</option>
            <option value="Timesheet">Timesheets Labour</option>
            <option value="Expenses">Corporate Card</option>
            <option value="Manual">Manual Journal</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 px-2.5 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Categories</option>
            <option value="Labour">Labour</option>
            <option value="Software">Software</option>
            <option value="Hardware">Hardware</option>
            <option value="Vendors">Vendors</option>
            <option value="Travel">Travel</option>
            <option value="Contingency">Contingency</option>
          </select>

          {(projectFilter !== "all" || sourceFilter !== "all" || categoryFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setProjectFilter("all");
                setSourceFilter("all");
                setCategoryFilter("all");
              }}
            >
              Reset
            </Button>
          )}
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">
            Filtered Expenditure Sum
          </span>
          <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
            {hasCostPermission
              ? formatMoney({ amount: totalFilteredAmount.toFixed(2), currencyCode })
              : "[Redacted]"}
          </span>
        </div>
      </Card>

      {/* Ledger Table */}
      <Card className="overflow-x-auto p-4">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-mono uppercase text-slate-500">
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">External Key</th>
              <th className="py-3 px-3">Source</th>
              <th className="py-3 px-3">Project</th>
              <th className="py-3 px-3">Vendor / Payee</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Description</th>
              <th className="py-3 px-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredActuals.map((item) => {
              const project = projects.find((p) => p.id === item.projectId);

              return (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-mono text-xs text-slate-500">
                    {formatDate(item.date)}
                  </td>
                  <td className="py-3 px-3 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                    {item.externalKey}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold">
                      {item.source}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {project ? (
                      <Link href={`/projects/${project.id}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        {project.code}
                      </Link>
                    ) : (
                      <span className="font-mono text-xs">{item.projectId}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-xs font-medium text-slate-800 dark:text-slate-200">
                    {item.vendor}
                  </td>
                  <td className="py-3 px-3 text-xs font-mono text-slate-600 dark:text-slate-400">
                    {item.category}
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {item.description}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                    {hasCostPermission ? formatMoney(item.amount) : "[Redacted]"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Simulate CSV Ingestion Modal */}
      <Modal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        title="Simulated ERP Actuals Ingestion"
        maxWidth="lg"
      >
        <div className="space-y-4 text-sm">
          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              <Sparkle size={16} />
              <span>ERP Validation Sandbox</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Select a demo export file to run schema validation, duplicate external key detection, and general ledger reconciliation preview without database mutations.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Select Sample CSV Payload:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedDemoFile("clean")}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedDemoFile === "clean"
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" />
                  oracle_q3_actuals_clean.csv
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  12 valid rows • 0 reconciliation errors
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDemoFile("duplicate")}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedDemoFile === "duplicate"
                    ? "border-amber-600 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  <Warning size={14} className="text-amber-500" />
                  oracle_q3_actuals_duplicate.csv
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  10 rows • 2 duplicate external keys flagged
                </div>
              </button>
            </div>
          </div>

          {/* Validation Preview Box */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-700 dark:text-slate-300">Ingestion Schema: ISO Ledger v2</span>
              <span className="text-slate-500 font-mono">Encoding: UTF-8</span>
            </div>

            {selectedDemoFile === "duplicate" ? (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <Warning size={14} /> Deterministic Duplicate Warning:
                </p>
                <p className="text-[11px] leading-relaxed">
                  Row 4 (<code>SAP-INV-89102</code>: AED 45,000) and Row 7 (<code>SAP-INV-89102</code>) match existing posted transactions in Project Atlas ledger. Duplicate rows will be quarantined.
                </p>
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded text-emerald-800 dark:text-emerald-300">
                <p className="font-semibold flex items-center gap-1">
                  <CheckCircle size={14} /> Schema Validation Passed
                </p>
                <p className="text-[11px]">
                  All 12 cost rows verified against Chart of Accounts and project allocations.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setImportModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSimulateImport}>
              Confirm Ingestion (Simulated)
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
