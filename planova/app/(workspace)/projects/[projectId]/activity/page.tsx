"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { Card } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/formatting/format";
import {
  Pulse,
  ChatCircleText,
  Clock,
  CheckCircle,
  FileText,
  ShieldCheck,
  Flag,
} from "@phosphor-icons/react";

export default function ProjectActivityPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const organisationId = useSessionStore((s) => s.organisationId);

  const [entityFilter, setEntityFilter] = useState<string>("all");

  const { data: projectRes } = useQuery({
    queryKey: ["project", projectId, organisationId],
    queryFn: () => apiClient.getProject(projectId),
  });

  const { data: activityRes, isLoading } = useQuery({
    queryKey: ["activity", projectId, organisationId],
    queryFn: () => apiClient.getActivityEvents(projectId),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const project = projectRes?.data;
  const events = activityRes?.data || [];
  const people = peopleRes?.data || [];

  const filteredEvents = events.filter((e) => {
    if (entityFilter !== "all" && e.entityType !== entityFilter) return false;
    return true;
  });

  if (!project) return null;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <ProjectHeader project={project} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Strip & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Collaborative Activity Stream
            </h1>
            <p className="text-xs text-[var(--muted)] mt-1">
              Chronological log of day-to-day team updates, task transitions, and governance events.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] px-3 py-2 text-[var(--foreground)]"
            >
              <option value="all">All Events ({events.length})</option>
              <option value="Task">Tasks Only</option>
              <option value="RaidItem">RAID Only</option>
              <option value="Change">Changes Only</option>
              <option value="Project">Health & Project Only</option>
            </select>
          </div>
        </div>

        {/* Timeline Stream */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-[var(--surface-raised)] animate-pulse" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <Pulse className="w-10 h-10 text-[var(--muted)] mx-auto opacity-50" />
            <h3 className="text-base font-bold text-[var(--foreground)]">No Activity Recorded</h3>
            <p className="text-xs text-[var(--muted)]">No collaborative events match the current filter.</p>
          </Card>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:inset-y-0 before:left-2.5 before:w-0.5 before:bg-[var(--border)]">
            {filteredEvents.map((evt) => {
              const actor = people.find((p) => p.id === evt.actorId);

              return (
                <div key={evt.id} className="relative flex items-start gap-4 group">
                  {/* Dot */}
                  <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-[var(--surface)] border-2 border-[var(--color-brand)] flex items-center justify-center shrink-0 z-10 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)]" />
                  </div>

                  <Card className="flex-1 p-4 space-y-2 hover:border-[var(--color-brand)]/30 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--foreground)]">
                          {actor?.name || evt.actorId}
                        </span>
                        <span className="text-[var(--muted)]">{evt.verb}</span>
                        <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--color-brand)]">
                          {evt.entityType}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[var(--muted)] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDateTime(evt.at)}</span>
                      </span>
                    </div>

                    <p className="text-xs text-[var(--foreground)] leading-relaxed bg-[var(--surface-raised)]/40 p-2.5 rounded-lg border border-[var(--border)]/50">
                      {evt.summary}
                    </p>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
