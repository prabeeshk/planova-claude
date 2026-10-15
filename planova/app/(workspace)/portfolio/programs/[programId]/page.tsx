"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/formatting/format";
import {
  GitBranch,
  ArrowLeft,
  FolderSimple,
  CalendarBlank,
  Flag,
  User,
  CheckCircle,
  Warning,
  ArrowRight,
} from "@phosphor-icons/react";

export default function ProgramDetailPage() {
  const params = useParams<{ programId: string }>();
  const organisationId = useSessionStore((s) => s.organisationId);

  const { data: programRes, isLoading: loadingProgram } = useQuery({
    queryKey: ["program", params.programId, organisationId],
    queryFn: () => apiClient.getProgram(params.programId),
    enabled: !!params.programId,
  });

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const { data: milestonesRes } = useQuery({
    queryKey: ["milestones", "all", organisationId],
    queryFn: () => apiClient.getMilestones(),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const program = programRes?.data;
  const allProjects = projectsRes?.data || [];
  const allMilestones = milestonesRes?.data || [];
  const people = peopleRes?.data || [];

  const manager = people.find((p) => p.id === program?.managerId);

  // Projects associated with this program (matching portfolioId or program scope)
  const relatedProjects = allProjects.filter((p) => p.portfolioId === program?.portfolioId);
  const projectIds = relatedProjects.map((p) => p.id);
  const programMilestones = allMilestones.filter((m) => projectIds.includes(m.projectId));

  // Program Aggregate Health
  const hasCritical = relatedProjects.some((p) => p.health === "Critical");
  const hasAtRisk = relatedProjects.some((p) => p.health === "At Risk");
  const aggregateHealth = hasCritical ? "Critical" : hasAtRisk ? "At Risk" : "On Track";

  if (loadingProgram || !program) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-12 w-96 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href={`/portfolio/${program.portfolioId}`} className="hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1">
          <ArrowLeft size={16} />
          Parent Portfolio
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-700 dark:text-slate-300">{program.name}</span>
      </div>

      {/* Program Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
              {program.id}
            </span>
            <StatusChip status={aggregateHealth} />
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <User size={14} />
              Program Director: <strong className="text-slate-800 dark:text-slate-200">{manager?.name || "Program Manager"}</strong>
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{program.name}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{program.purpose}</p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Portfolio Code: <strong className="font-mono text-slate-700 dark:text-slate-300">{program.portfolioId}</strong></span>
            <span>Managed Projects: <strong className="text-slate-700 dark:text-slate-300">{relatedProjects.length}</strong></span>
            <span>Aligned Key Gates: <strong className="text-slate-700 dark:text-slate-300">{programMilestones.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Related Projects */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FolderSimple size={20} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Constituent Projects & Delivery Status
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {relatedProjects.map((p) => (
            <div
              key={p.id}
              className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                    {p.code}
                  </span>
                  <StatusChip status={p.health} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                  {p.name}
                </h3>
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Progress</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{p.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
                <span>Target: {formatDate(p.targetDate)}</span>
                <Link href={`/projects/${p.id}`}>
                  <Button variant="ghost" size="sm">
                    <ArrowRight size={14} />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Cross-Project Milestone Alignment Grid */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Flag size={20} className="text-purple-600 dark:text-purple-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Program Milestone Alignment & Key Gates
          </h2>
        </div>

        {programMilestones.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No key gate milestones registered for constituent projects.</p>
        ) : (
          <div className="space-y-3">
            {programMilestones.map((m) => {
              const project = relatedProjects.find((p) => p.id === m.projectId);

              return (
                <div
                  key={m.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Flag size={14} className="text-purple-500 shrink-0" />
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {m.name}
                      </span>
                      {m.isKey && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                          Zero-Duration Key Gate
                        </span>
                      )}
                    </div>
                    {project && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <FolderSimple size={12} />
                        Project: {project.name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
                    <span className="text-slate-500">Target Date:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 px-2 py-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                      {formatDate(m.targetDate)}
                    </span>
                    <StatusChip status={m.achievedAt ? "Completed" : "Pending"} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
