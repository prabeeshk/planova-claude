"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { ProjectHealthBadge } from "@/components/ui/ProjectHealthBadge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/formatting/format";
import {
  Plus,
  MagnifyingGlass,
  SquaresFour,
  Table,
  SlidersHorizontal,
  ArrowRight,
  FolderSimple,
} from "@phosphor-icons/react";

export default function ProjectsDirectoryPage() {
  const router = useRouter();
  const organisationId = useSessionStore((s) => s.organisationId);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const allProjects = data?.data || [];

  const filtered = allProjects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.summary.toLowerCase().includes(search.toLowerCase());
    const matchMethod = methodFilter === "all" || p.method === methodFilter;
    const matchHealth = healthFilter === "all" || p.health === healthFilter;
    return matchSearch && matchMethod && matchHealth;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in-50 duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Projects Directory
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Enterprise delivery initiatives, status trends, and milestones for {organisationId === "org-meridian" ? "Meridian Global" : "Northwind Holdings"}.
          </p>
        </div>

        <Link href="/projects/new">
          <Button size="sm" className="gap-1.5">
            <Plus weight="bold" className="w-3.5 h-3.5" />
            <span>Create Project</span>
          </Button>
        </Link>
      </div>

      {/* Filter and View Toggle Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--surface)] border border-[var(--surface-border)]">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <MagnifyingGlass className="w-4 h-4 text-[var(--muted)] ml-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name, code or keyword..."
            className="w-full bg-transparent text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="h-8 px-2.5 rounded-xl border border-[var(--surface-border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none cursor-pointer"
            aria-label="Filter by delivery method"
          >
            <option value="all">All Methods</option>
            <option value="Agile">Agile</option>
            <option value="Waterfall">Waterfall</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Operational">Operational</option>
          </select>

          {/* Health Filter */}
          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value)}
            className="h-8 px-2.5 rounded-xl border border-[var(--surface-border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none cursor-pointer"
            aria-label="Filter by health"
          >
            <option value="all">All Health</option>
            <option value="On Track">On Track</option>
            <option value="At Risk">At Risk</option>
            <option value="Critical">Critical</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-[var(--surface-border)] bg-[var(--background)] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs" : "text-[var(--muted)]"
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <SquaresFour className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "table" ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs" : "text-[var(--muted)]"
              }`}
              title="Table View"
              aria-label="Table View"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((proj) => (
            <div
              key={proj.id}
              onClick={() => router.push(`/projects/${proj.id}`)}
              className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--surface-border)] hover:border-[var(--primary)]/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono font-bold text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors">
                      {proj.code}
                    </span>
                    <h3 className="font-semibold text-sm text-[var(--foreground)] line-clamp-1">
                      {proj.name}
                    </h3>
                  </div>
                  <ProjectHealthBadge health={proj.health} size="sm" />
                </div>

                <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
                  {proj.summary}
                </p>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--muted)]">Progress</span>
                    <span className="font-semibold text-[var(--foreground)]">{proj.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--primary)] transition-all"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--surface-border)] flex items-center justify-between text-[11px] text-[var(--muted)]">
                <span>Target: {formatDate(proj.targetDate)}</span>
                <span className="font-semibold text-[var(--foreground)]">{proj.method}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-elevated)] text-[var(--muted)] font-semibold border-b border-[var(--surface-border)]">
                <tr>
                  <th className="px-4 py-3">Code & Name</th>
                  <th className="px-4 py-3">Health</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Target Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--surface-border)]">
                {filtered.map((proj) => (
                  <tr
                    key={proj.id}
                    onClick={() => router.push(`/projects/${proj.id}`)}
                    className="hover:bg-[var(--surface-elevated)]/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-bold font-mono text-[11px] text-[var(--primary)]">
                        {proj.code}
                      </div>
                      <div className="font-medium text-[var(--foreground)] mt-0.5">{proj.name}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <ProjectHealthBadge health={proj.health} size="sm" />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-[var(--foreground)]">{proj.status}</span>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted)]">{proj.method}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{proj.progress}%</span>
                        <div className="w-16 h-1.5 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                          <div
                            className="h-full bg-[var(--primary)]"
                            style={{ width: `${proj.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted)]">
                      {formatDate(proj.targetDate)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button variant="ghost" size="xs">
                        Open
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl space-y-2">
          <FolderSimple className="w-10 h-10 text-[var(--muted)] mx-auto opacity-50" />
          <h3 className="text-sm font-semibold text-[var(--foreground)]">No projects found</h3>
          <p className="text-xs text-[var(--muted)]">Try adjusting your search query or filters.</p>
        </div>
      )}
    </div>
  );
}
