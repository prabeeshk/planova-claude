"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/formatting/format";
import type { SavedReport } from "@/lib/domain/types";
import {
  FileText,
  FileCsv,
  ArrowRight,
  MagnifyingGlass,
  Funnel,
  Clock,
  Users,
  CheckCircle,
  ChartBar,
  Star,
  DownloadSimple,
} from "@phosphor-icons/react";

export default function ReportsGalleryPage() {
  const organisationId = useSessionStore((s) => s.organisationId);

  const [selectedDataset, setSelectedDataset] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const { data: reportsRes, isLoading } = useQuery({
    queryKey: ["reports", organisationId],
    queryFn: () => apiClient.getReports(),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const reports = reportsRes?.data || [];
  const people = peopleRes?.data || [];

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (selectedDataset !== "ALL" && r.dataset !== selectedDataset) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.audience.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reports, selectedDataset, searchQuery]);

  // Simulated CSV Export of visible filtered reports
  const handleExportCsv = () => {
    const header = "Report ID,Name,Dataset,Audience,Schedule,Last Refreshed\n";
    const rows = filteredReports
      .map(
        (r) =>
          `"${r.id}","${r.name}","${r.dataset}","${r.audience}","${r.schedule || "On Demand"}","${r.lastRefreshed}"`
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `planova_reports_catalog_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${filteredReports.length} visible report definitions to CSV.`);
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
            <Link href="/insights" className="hover:text-foreground transition-colors">
              Insights
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Enterprise Reports</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-indigo-500" />
            Saved Reports & Analytics Gallery
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Curated reporting templates, scheduled audit exports, and executive data visualisations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <DownloadSimple className="h-4 w-4 mr-1.5" />
            Export Filtered CSV
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30 p-3.5 rounded-xl border border-border">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 sm:w-64">
            <MagnifyingGlass className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search reports by title or audience..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Funnel className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Dataset:</span>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="bg-background border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none"
            >
              <option value="ALL">All Datasets</option>
              <option value="Projects">Projects</option>
              <option value="RAID">RAID</option>
              <option value="Financials">Financials</option>
              <option value="Resources">Resources</option>
              <option value="Approvals">Approvals</option>
              <option value="Timesheets">Timesheets</option>
            </select>
          </div>
        </div>

        <span className="text-xs font-mono text-muted-foreground">
          Showing {filteredReports.length} reports
        </span>
      </div>

      {/* Reports Gallery Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredReports.map((report) => {
          const owner = people.find((p) => p.id === report.ownerId);

          return (
            <Card
              key={report.id}
              className="p-5 border-border bg-card hover:border-primary/50 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {report.dataset}
                    </span>
                    {report.template && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                        Template
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatDate(report.lastRefreshed)}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-foreground">
                    <Link href={`/reports/${report.id}`} className="hover:text-primary transition-colors">
                      {report.name}
                    </Link>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {report.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground space-y-1">
                  <div>
                    Audience: <strong className="text-foreground">{report.audience}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>
                      Schedule:{" "}
                      <strong className="text-foreground">{report.schedule || "On-Demand"}</strong>
                    </span>
                    <span>Curator: {owner?.name || report.ownerId}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-border flex items-center justify-between">
                <Link href={`/reports/${report.id}`} className="w-full">
                  <Button variant="outline" size="sm" className="w-full justify-between">
                    <span>Inspect Report & Visualisations</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
