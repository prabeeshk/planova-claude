"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { User, ResourceAllocation, Project } from "@/lib/domain/types";
import {
  ChartBar,
  ArrowLeft,
  Warning,
  CheckCircle,
  FolderSimple,
  Table,
  SquaresFour,
  Info,
} from "@phosphor-icons/react";

const WEEKS = [
  { code: "W42", label: "Oct 12 – 18" },
  { code: "W43", label: "Oct 19 – 25" },
  { code: "W44", label: "Oct 26 – Nov 01" },
  { code: "W45", label: "Nov 02 – 08" },
  { code: "W46", label: "Nov 09 – 15" },
  { code: "W47", label: "Nov 16 – 22" },
];

export default function CapacityHeatmapPage() {
  const organisationId = useSessionStore((s) => s.organisationId);

  const [projectFilter, setProjectFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"heatmap" | "table">("heatmap");

  const { data: peopleRes, isLoading: loadingPeople } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const { data: allocationsRes, isLoading: loadingAllocations } = useQuery({
    queryKey: ["allocations", "all", organisationId],
    queryFn: () => apiClient.getAllocations(),
  });

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const people = peopleRes?.data || [];
  const allocations = allocationsRes?.data || [];
  const projects = projectsRes?.data || [];

  // Filter allocations if project filter selected
  const activeAllocations = projectFilter === "all"
    ? allocations
    : allocations.filter((a) => a.projectId === projectFilter);

  // Group allocations by person
  const personAllocMap: Record<string, { percent: number; projects: string[] }> = {};
  people.forEach((p) => {
    const userAllocs = activeAllocations.filter((a) => a.userId === p.id);
    const totalPct = userAllocs.reduce((acc, a) => acc + a.percent, 0);
    const assignedProjects = Array.from(new Set(userAllocs.map((a) => a.projectId)));
    personAllocMap[p.id] = { percent: totalPct, projects: assignedProjects };
  });

  // Calculate cell color and badge
  const getCapacityStyle = (percent: number) => {
    if (percent > 100) {
      return {
        bg: "bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-400 font-bold",
        indicator: "Overallocated",
      };
    }
    if (percent >= 80) {
      return {
        bg: "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-semibold",
        indicator: "Optimal",
      };
    }
    if (percent >= 40) {
      return {
        bg: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400 font-medium",
        indicator: "Available",
      };
    }
    return {
      bg: "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500",
      indicator: "Underallocated",
    };
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/resources" className="hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1">
          <ArrowLeft size={16} />
          Workforce & Capacity
        </Link>
        <span>/</span>
        <span className="text-slate-700 dark:text-slate-300 font-medium">Weekly Capacity Heatmap</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ChartBar size={26} className="text-emerald-500" />
            Weekly Capacity Heatmap & Workload Balance
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Weekly commitment ratios against 40-hour standard baseline. Over-allocations (&gt;100%) flag contention risk.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode("heatmap")}
              className={`p-1.5 rounded transition-all ${
                viewMode === "heatmap" ? "bg-white dark:bg-slate-900 shadow-xs" : "text-slate-400"
              }`}
              title="Heatmap Grid View"
            >
              <SquaresFour size={16} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded transition-all ${
                viewMode === "table" ? "bg-white dark:bg-slate-900 shadow-xs" : "text-slate-400"
              }`}
              title="Accessible Table View"
            >
              <Table size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Legend Bar */}
      <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Filter Project:
          </span>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 px-3 text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Projects Combined</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-500/20 border border-rose-500/50" />
            <span className="text-slate-700 dark:text-slate-300">&gt;100% Overallocated</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500/50" />
            <span className="text-slate-700 dark:text-slate-300">80–100% Optimal</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-blue-500/15 border border-blue-500/40" />
            <span className="text-slate-700 dark:text-slate-300">40–79% Available</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            <span className="text-slate-500">&lt;40% Under</span>
          </span>
        </div>
      </Card>

      {/* Heatmap Matrix */}
      <Card className="overflow-x-auto p-4">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-mono uppercase text-slate-500">
              <th className="py-3 px-3 min-w-[200px]">Team Member & Role</th>
              <th className="py-3 px-3 min-w-[120px]">Projects</th>
              {WEEKS.map((w) => (
                <th key={w.code} className="py-3 px-3 text-center min-w-[110px]">
                  <div>{w.code}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{w.label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {people.map((person) => {
              const allocData = personAllocMap[person.id] || { percent: 0, projects: [] };
              const percent = allocData.percent;
              const hours = (percent * 0.4).toFixed(0);
              const style = getCapacityStyle(percent);

              const assignedProjectNames = allocData.projects
                .map((pid) => projects.find((p) => p.id === pid)?.code)
                .filter(Boolean);

              return (
                <tr key={person.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {person.name}
                    </div>
                    <div className="text-xs text-slate-500">{person.title}</div>
                  </td>

                  <td className="py-3 px-3 text-xs font-mono text-slate-600 dark:text-slate-400">
                    {assignedProjectNames.length > 0 ? assignedProjectNames.join(", ") : "—"}
                  </td>

                  {/* Heatmap cells across 6 weeks */}
                  {WEEKS.map((w, idx) => {
                    // Introduce slight realistic deterministic variance for week 44/45
                    const weekPercent =
                      idx === 2 || idx === 3 ? percent : Math.max(0, percent - (idx % 2 === 0 ? 0 : 10));
                    const weekHours = (weekPercent * 0.4).toFixed(0);
                    const weekStyle = getCapacityStyle(weekPercent);

                    return (
                      <td key={w.code} className="py-2.5 px-2 text-center">
                        <div
                          className={`p-2 rounded-lg border text-xs font-mono transition-all ${weekStyle.bg}`}
                        >
                          <div>{weekHours}h / 40h</div>
                          <div className="text-[10px] font-bold mt-0.5">
                            {weekPercent}% • {weekStyle.indicator}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
