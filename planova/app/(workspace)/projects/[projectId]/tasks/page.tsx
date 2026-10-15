"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { PriorityPill } from "@/components/ui/PriorityPill";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/formatting/format";
import {
  MagnifyingGlass,
  Plus,
  CheckSquare,
  Clock,
  ArrowRight,
} from "@phosphor-icons/react";

export default function ProjectTasksListPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const router = useRouter();
  const { projectId } = use(params);
  const organisationId = useSessionStore((s) => s.organisationId);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: projectData } = useQuery({
    queryKey: ["project", projectId, organisationId],
    queryFn: () => apiClient.getProject(projectId),
  });

  const { data: tasksData } = useQuery({
    queryKey: ["tasks", projectId, organisationId],
    queryFn: () => apiClient.getTasks({ projectId }),
  });

  const project = projectData?.data;
  const tasks = tasksData?.data || [];

  const filtered = tasks.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (!project) return null;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <ProjectHeader project={project} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--surface)] border border-[var(--surface-border)]">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <MagnifyingGlass className="w-4 h-4 text-[var(--muted)] ml-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks by code, keyword or title..."
              className="w-full bg-transparent text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2.5 rounded-xl border border-[var(--surface-border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Blocked">Blocked</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <Link href={`/projects/${project.id}/board`}>
              <Button size="xs" variant="outline">
                Board View
              </Button>
            </Link>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-elevated)] text-[var(--muted)] font-semibold border-b border-[var(--surface-border)]">
                <tr>
                  <th className="px-4 py-3">Task Code & Title</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Checklist</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Estimate</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--surface-border)]">
                {filtered.map((t) => {
                  const doneChecks = t.checklist.filter((c) => c.done).length;
                  return (
                    <tr
                      key={t.id}
                      onClick={() => router.push(`/projects/${projectId}/tasks/${t.id}`)}
                      className="hover:bg-[var(--surface-elevated)]/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-[11px] text-[var(--primary)]">
                          {t.code}
                        </div>
                        <div className="font-medium text-[var(--foreground)] mt-0.5">{t.title}</div>
                        {t.blockedReason && (
                          <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1">
                            Blocker: {t.blockedReason}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusChip status={t.status} size="sm" />
                      </td>
                      <td className="px-4 py-3.5">
                        <PriorityPill priority={t.priority} size="sm" />
                      </td>
                      <td className="px-4 py-3.5 text-[var(--muted)]">
                        <span className="flex items-center gap-1">
                          <CheckSquare className="w-3.5 h-3.5 text-[var(--primary)]" />
                          <span>
                            {doneChecks}/{t.checklist.length}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[var(--muted)]">
                        {formatDate(t.dueDate)}
                      </td>
                      <td className="px-4 py-3.5 text-[var(--muted)]">{t.estimateHours}h</td>
                      <td className="px-4 py-3.5 text-right">
                        <Button variant="ghost" size="xs">
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
