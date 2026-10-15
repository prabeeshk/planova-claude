"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { sessionFor, can } from "@/lib/access/permissions";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/formatting/format";
import type { AuditEvent, EntityType } from "@/lib/domain/types";
import {
  Scroll,
  ArrowLeft,
  MagnifyingGlass,
  Funnel,
  DownloadSimple,
  CheckCircle,
  Lock,
  CaretDown,
  CaretUp,
  Fingerprint,
} from "@phosphor-icons/react";

export default function AuditLogAdministrationPage() {
  const organisationId = useSessionStore((s) => s.organisationId);
  const personaId = useSessionStore((s) => s.personaId);
  const session = sessionFor(personaId, organisationId);

  const canExportAudit = can(session, "audit.export");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<string>("ALL");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const { data: auditRes, isLoading } = useQuery({
    queryKey: ["auditEvents", organisationId],
    queryFn: () => apiClient.getAuditEvents(),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const auditEvents = auditRes?.data || [];
  const people = peopleRes?.data || [];

  const filteredEvents = useMemo(() => {
    return auditEvents.filter((ev) => {
      if (selectedEntity !== "ALL" && ev.entityType !== selectedEntity) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const actor = people.find((p) => p.id === ev.actorId);
        return (
          ev.action.toLowerCase().includes(q) ||
          ev.correlationId.toLowerCase().includes(q) ||
          ev.entityId.toLowerCase().includes(q) ||
          (actor?.name.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [auditEvents, selectedEntity, searchQuery, people]);

  const handleExportCsv = () => {
    if (!canExportAudit) return;

    const header = "Event ID,Timestamp,Actor,Action,Entity Type,Entity ID,Correlation ID\n";
    const rows = filteredEvents
      .map(
        (e) =>
          `"${e.id}","${e.at}","${e.actorId}","${e.action}","${e.entityType}","${e.entityId}","${e.correlationId}"`
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `planova_audit_trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${filteredEvents.length} audit records to CSV.`);
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
            <span className="text-foreground font-medium">Compliance Audit Log</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Scroll className="h-7 w-7 text-indigo-500" />
            Immutable Compliance Audit Trail
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cryptographic correlation IDs, actor attributions, and redacted delta changes across enterprise records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={!canExportAudit}
            title={!canExportAudit ? "Requires audit.export permission" : undefined}
          >
            <DownloadSimple className="h-4 w-4 mr-1.5" />
            Export Audit Trail (CSV)
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30 p-3.5 rounded-xl border border-border">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 sm:w-72">
            <MagnifyingGlass className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by action, correlation ID, or actor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Funnel className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Entity:</span>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="bg-background border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none"
            >
              <option value="ALL">All Entity Types</option>
              <option value="Project">Project</option>
              <option value="Approval">Approval</option>
              <option value="Budget">Budget</option>
              <option value="Change">Change</option>
              <option value="Release">Release</option>
              <option value="Policy">Policy</option>
              <option value="RaidItem">RAID Item</option>
            </select>
          </div>
        </div>

        <span className="text-xs font-mono text-muted-foreground">
          Showing {filteredEvents.length} events
        </span>
      </div>

      {/* Audit Log Table */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-3">Actor Principal</th>
                <th className="py-3 px-3">Action Verb</th>
                <th className="py-3 px-3">Target Entity</th>
                <th className="py-3 px-3">Correlation ID</th>
                <th className="py-3 px-4 text-right">Field Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEvents.map((ev) => {
                const actor = people.find((p) => p.id === ev.actorId);
                const isExpanded = expandedEventId === ev.id;

                return (
                  <React.Fragment key={ev.id}>
                    <tr
                      className="hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                    >
                      <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">
                        {formatDate(ev.at)}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px]">
                            {actor?.name.charAt(0) || "U"}
                          </div>
                          <span className="font-medium text-foreground">{actor?.name || ev.actorId}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-xs font-bold text-primary">
                        {ev.action}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="text-muted-foreground">{ev.entityType}:</span>
                          <span className="text-foreground font-semibold">{ev.entityId}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-muted-foreground">
                        {ev.correlationId}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                          <span>{ev.changes.length} fields</span>
                          {isExpanded ? <CaretUp size={12} /> : <CaretDown size={12} />}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Changes Diff View */}
                    {isExpanded && (
                      <tr className="bg-muted/30">
                        <td colSpan={6} className="p-4">
                          <div className="rounded-lg border border-border bg-card p-3 space-y-2 text-xs">
                            <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                              <Fingerprint className="h-4 w-4 text-indigo-400" />
                              <span>State Delta & Field Modifications:</span>
                            </h4>
                            <div className="space-y-1.5 divide-y divide-border/60">
                              {ev.changes.map((ch, idx) => (
                                <div
                                  key={idx}
                                  className="pt-1.5 first:pt-0 flex items-center justify-between gap-4 font-mono text-[11px]"
                                >
                                  <span className="text-foreground font-medium">{ch.field}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="line-through text-rose-400/80">
                                      {ch.before ?? "null"}
                                    </span>
                                    <span className="text-muted-foreground">&rarr;</span>
                                    <span className="text-emerald-400 font-semibold">
                                      {ch.after ?? "null"}
                                    </span>
                                    {ch.redacted && (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30">
                                        <Lock className="h-2.5 w-2.5" /> REDACTED
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
