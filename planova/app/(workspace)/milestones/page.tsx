"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DEMO_TODAY, isOverdue } from "@/lib/demo-data/clock";
import {
  Flag,
  Star,
  CalendarCheck,
  Funnel,
  FolderSimple,
} from "@phosphor-icons/react";

export default function GlobalMilestonesPage() {
  const organisationId = useSessionStore((s) => s.organisationId);
  const [filterProject, setFilterProject] = useState<string>("all");
  const [keyOnly, setKeyOnly] = useState<boolean>(false);

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const { data: milestonesRes, isLoading } = useQuery({
    queryKey: ["milestones", "all", organisationId],
    queryFn: () => apiClient.getMilestones(),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const projects = projectsRes?.data || [];
  const milestones = milestonesRes?.data || [];
  const people = peopleRes?.data || [];

  const filtered = milestones.filter((m) => {
    if (filterProject !== "all" && m.projectId !== filterProject) return false;
    if (keyOnly && !m.isKey) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold">
            <Flag weight="fill" className="w-3.5 h-3.5" />
            <span>Delivery Commitments</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-1.5">
            Enterprise Milestones
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1 max-w-2xl">
            Portfolio-wide view of critical delivery dates, baseline comparisons, and strategic gates across all accessible programs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] px-3 py-2 text-[var(--foreground)]"
          >
            <option value="all">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <Button
            variant={keyOnly ? "primary" : "secondary"}
            size="sm"
            onClick={() => setKeyOnly(!keyOnly)}
          >
            <Star weight={keyOnly ? "fill" : "regular"} className="w-4 h-4 mr-1.5 text-amber-500" />
            Key Gates Only
          </Button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-[var(--surface-raised)] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <Flag className="w-12 h-12 text-[var(--muted)] mx-auto opacity-50" />
          <h3 className="text-base font-bold text-[var(--foreground)]">No Milestones Found</h3>
          <p className="text-xs text-[var(--muted)]">
            No milestones match your selected project or key gate filters.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => {
            const project = projects.find((p) => p.id === m.projectId);
            const owner = people.find((p) => p.id === m.ownerId);
            const overdue = isOverdue(m.targetDate) && !m.achievedAt;

            return (
              <Card
                key={m.id}
                className={`p-5 flex flex-col justify-between space-y-4 transition-all hover:border-[var(--color-brand)]/40 ${
                  m.isKey ? "border-amber-500/40 bg-amber-500/5" : ""
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {m.isKey && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                          <Star weight="fill" className="w-3 h-3 text-amber-500" />
                          <span>Key Gate</span>
                        </span>
                      )}
                      {project && (
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-[10px] font-medium text-[var(--muted)] hover:text-[var(--color-brand)] flex items-center gap-1 truncate max-w-[140px]"
                        >
                          <FolderSimple className="w-3 h-3" />
                          <span>{project.name}</span>
                        </Link>
                      )}
                    </div>
                    <StatusChip status={m.achievedAt ? "Completed" : overdue ? "Critical" : "Not Started"} />
                  </div>

                  <h3 className="text-sm font-bold text-[var(--foreground)] line-clamp-2">
                    {m.name}
                  </h3>
                </div>

                <div className="space-y-2 pt-3 border-t border-[var(--border)] text-xs text-[var(--muted)]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>Target Date</span>
                    </span>
                    <span className={`font-mono font-bold ${overdue ? "text-red-500" : "text-[var(--foreground)]"}`}>
                      {m.targetDate}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Baseline Date</span>
                    <span className="font-mono text-[var(--muted)]">{m.baselineDate}</span>
                  </div>

                  {owner && (
                    <div className="flex items-center justify-between pt-1">
                      <span>Owner</span>
                      <span className="font-medium text-[var(--foreground)] truncate max-w-[140px]">
                        {owner.name}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
