"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { StatusChip } from "@/components/ui/StatusChip";
import { PriorityPill } from "@/components/ui/PriorityPill";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDate, formatMoney } from "@/lib/formatting/format";
import type { SavedReport, Project, RaidItem, ActualCost, Budget } from "@/lib/domain/types";
import {
  FileText,
  FileCsv,
  Printer,
  ArrowLeft,
  CheckCircle,
  DownloadSimple,
  Clock,
  ChartBar,
  TrendUp,
  Table,
  Info,
  Calendar,
} from "@phosphor-icons/react";

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params.reportId as string;
  const organisationId = useSessionStore((s) => s.organisationId);

  const [printMode, setPrintMode] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const { data: reportRes, isLoading } = useQuery({
    queryKey: ["report", reportId, organisationId],
    queryFn: () => apiClient.getReport(reportId),
  });

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const { data: raidRes } = useQuery({
    queryKey: ["raidItems", organisationId],
    queryFn: () => apiClient.getRaidItems(),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const report = reportRes?.data;
  const projects = projectsRes?.data || [];
  const raidItems = raidRes?.data || [];
  const people = peopleRes?.data || [];

  const curator = people.find((p) => p.id === report?.ownerId);

  // Simulated export trigger
  const handleSimulateExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      showToast(
        `Report export job EX-${Math.floor(
          Math.random() * 9000 + 1000
        )} queued successfully. SHA-256 signed snapshot ready.`
      );
    }, 1200);
  };

  if (isLoading || !report) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        <div className="h-12 w-96 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`space-y-8 pb-16 ${printMode ? "bg-white text-slate-900 p-8" : ""}`}>
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-emerald-900 border border-emerald-700 px-4 py-3 text-sm text-emerald-100 shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Link href="/reports" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Reports Gallery
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium font-mono">{report.id}</span>
        </nav>

        {/* Report Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded border border-primary/20">
                {report.dataset}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{report.name}</h1>
              {report.template && (
                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                  Standard Template
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">{report.description}</p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 flex-wrap">
              <span>
                Target Audience: <strong className="text-foreground">{report.audience}</strong>
              </span>
              <span>•</span>
              <span>
                Schedule: <strong className="text-foreground">{report.schedule || "On Demand"}</strong>
              </span>
              <span>•</span>
              <span>
                Curator: <strong className="text-foreground">{curator?.name || report.ownerId}</strong>
              </span>
              <span>•</span>
              <span>
                Refreshed: <strong className="text-foreground font-mono">{formatDate(report.lastRefreshed)}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrintMode(!printMode)}
            >
              <Printer className="h-4 w-4 mr-1.5" />
              {printMode ? "Exit Print Mode" : "Executive View"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSimulateExport}
              disabled={exporting}
            >
              <DownloadSimple className="h-4 w-4 mr-1.5" />
              {exporting ? "Queuing Export..." : "Run Export Job"}
            </Button>
          </div>
        </div>
      </div>

      {/* Executive Callout Summary */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs space-y-1">
        <div className="flex items-center gap-2 font-semibold text-indigo-400">
          <Info className="h-4 w-4" />
          <span>Executive Takeaways & Strategic Summary</span>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          This report is grounded in deterministically reconciled mock records for Meridian Global Enterprises.
          All visual indicators obey institutional data access policies, masking confidential figures for
          unauthorized viewer personas and preserving mathematical integrity.
        </p>
      </div>

      {/* Dynamic Data Content depending on report dataset */}
      {report.dataset === "Projects" && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 border-border bg-card">
              <span className="text-xs text-muted-foreground">Monitored Projects</span>
              <div className="text-2xl font-bold text-foreground mt-1">{projects.length}</div>
            </Card>
            <Card className="p-4 border-border bg-card">
              <span className="text-xs text-muted-foreground">On Track Deliverables</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {projects.filter((p) => p.health === "On Track").length}
              </div>
            </Card>
            <Card className="p-4 border-border bg-card">
              <span className="text-xs text-muted-foreground">At Risk / Critical Attention</span>
              <div className="text-2xl font-bold text-rose-400 mt-1">
                {projects.filter((p) => p.health === "Critical" || p.health === "At Risk").length}
              </div>
            </Card>
          </div>

          {/* Detailed Data Table */}
          <Card className="border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Table className="h-4 w-4 text-primary" />
                <span>Constituent Projects Dataset</span>
              </h3>
              <span className="text-xs font-mono text-muted-foreground">
                {projects.length} rows
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                    <th className="py-3 px-4 font-semibold">Code</th>
                    <th className="py-3 px-3 font-semibold">Project Name</th>
                    <th className="py-3 px-3 font-semibold">Methodology</th>
                    <th className="py-3 px-3 font-semibold">Target Date</th>
                    <th className="py-3 px-3 font-semibold">Health</th>
                    <th className="py-3 px-4 font-semibold text-right">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {projects.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-primary">
                        <Link href={`/projects/${p.id}`} className="hover:underline">
                          {p.code}
                        </Link>
                      </td>
                      <td className="py-3 px-3 font-medium text-foreground">{p.name}</td>
                      <td className="py-3 px-3 text-muted-foreground font-mono">{p.method}</td>
                      <td className="py-3 px-3 text-muted-foreground font-mono">
                        {formatDate(p.targetDate)}
                      </td>
                      <td className="py-3 px-3">
                        <StatusChip status={p.health} />
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                        {p.progress}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {report.dataset === "RAID" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4 border-border bg-card">
              <span className="text-xs text-muted-foreground">Total RAID Items</span>
              <div className="text-2xl font-bold text-foreground mt-1">{raidItems.length}</div>
            </Card>
            <Card className="p-4 border-border bg-card">
              <span className="text-xs text-muted-foreground">Critical Severity</span>
              <div className="text-2xl font-bold text-rose-400 mt-1">
                {raidItems.filter((r) => r.severity === "Critical").length}
              </div>
            </Card>
            <Card className="p-4 border-border bg-card">
              <span className="text-xs text-muted-foreground">High Severity</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {raidItems.filter((r) => r.severity === "High").length}
              </div>
            </Card>
            <Card className="p-4 border-border bg-card">
              <span className="text-xs text-muted-foreground">Escalated Items</span>
              <div className="text-2xl font-bold text-purple-400 mt-1">
                {raidItems.filter((r) => r.status === "Escalated").length}
              </div>
            </Card>
          </div>

          <Card className="border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">RAID Registry Items</h3>
              <span className="text-xs font-mono text-muted-foreground">
                {raidItems.length} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                    <th className="py-3 px-4 font-semibold">ID</th>
                    <th className="py-3 px-3 font-semibold">Type</th>
                    <th className="py-3 px-3 font-semibold">Title</th>
                    <th className="py-3 px-3 font-semibold text-right">Risk Score</th>
                    <th className="py-3 px-3 font-semibold">Severity</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {raidItems.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-primary">{item.id}</td>
                      <td className="py-3 px-3 font-mono font-semibold text-muted-foreground">
                        {item.type}
                      </td>
                      <td className="py-3 px-3 font-medium text-foreground">{item.title}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                        {item.score}
                      </td>
                      <td className="py-3 px-3">
                        <PriorityPill priority={item.severity} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <StatusChip status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {report.dataset !== "Projects" && report.dataset !== "RAID" && (
        <Card className="p-8 border-border bg-card text-center space-y-2">
          <ChartBar className="h-10 w-10 mx-auto text-primary mb-2" />
          <h3 className="text-sm font-semibold text-foreground">
            {report.name} Analysis Ready
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Dynamic dataset table prepared for {report.dataset} audience. Run the export job to extract
            untruncated snapshot records.
          </p>
        </Card>
      )}
    </div>
  );
}
