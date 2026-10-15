"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { StatusChip } from "@/components/ui/StatusChip";
import { PriorityPill } from "@/components/ui/PriorityPill";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/formatting/format";
import type { Release, Project } from "@/lib/domain/types";
import {
  RocketLaunch,
  CheckCircle,
  Warning,
  Clock,
  ShieldCheck,
  Funnel,
  ArrowRight,
  Plus,
  Flame,
  Calendar,
} from "@phosphor-icons/react";

export default function ReleasesDirectoryPage() {
  const organisationId = useSessionStore((s) => s.organisationId);

  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: releasesRes, isLoading: loadingReleases } = useQuery({
    queryKey: ["releases", organisationId],
    queryFn: () => apiClient.getReleases(),
  });

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const releases = releasesRes?.data || [];
  const projects = projectsRes?.data || [];
  const people = peopleRes?.data || [];

  const filteredReleases = useMemo(() => {
    return releases.filter((r) => {
      if (projectFilter !== "all" && r.projectId !== projectFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
  }, [releases, projectFilter, statusFilter]);

  // Aggregate metrics
  const inReviewCount = releases.filter((r) => r.status === "In Review").length;
  const approvedCount = releases.filter((r) => r.status === "Approved").length;
  const highRiskCount = releases.filter((r) => r.riskLevel === "High" || r.riskLevel === "Critical").length;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/projects" className="hover:text-foreground transition-colors">
              Delivery
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Releases & Governance Gates</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <RocketLaunch className="h-7 w-7 text-indigo-500" />
            Release Management & CAB Gates
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Deployment windows, quality gate verifications, CAB audit sign-offs, and risk controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/governance/reviews">
            <Button variant="outline" size="sm">
              <ShieldCheck className="h-4 w-4 mr-1.5" />
              Governance Reviews
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Releases</span>
            <RocketLaunch className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{releases.length}</div>
          <span className="text-xs text-muted-foreground mt-1 block">Scheduled production windows</span>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">In CAB Review</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400">{inReviewCount}</div>
          <span className="text-xs text-muted-foreground mt-1 block">Pending required gate evidence</span>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">CAB Approved</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{approvedCount}</div>
          <span className="text-xs text-muted-foreground mt-1 block">Cleared for deployment execution</span>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">High / Critical Risk</span>
            <Warning className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-400">{highRiskCount}</div>
          <span className="text-xs text-muted-foreground mt-1 block">Requires executive CAB quorum</span>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30 p-3.5 rounded-xl border border-border">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <Funnel className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Project:</span>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-background border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Planned">Planned</option>
              <option value="In Review">In Review</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <span className="text-xs font-mono text-muted-foreground">
          Showing {filteredReleases.length} releases
        </span>
      </div>

      {/* Releases List / Cards */}
      <div className="space-y-4">
        {filteredReleases.length === 0 ? (
          <Card className="p-12 text-center border-border bg-card">
            <RocketLaunch className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">No Releases Found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Adjust your filter criteria or check back once release candidates are tagged.
            </p>
          </Card>
        ) : (
          filteredReleases.map((release) => {
            const project = projects.find((p) => p.id === release.projectId);
            const owner = people.find((p) => p.id === release.ownerId);

            const passedGates = release.gates.filter((g) => g.status === "Passed").length;
            const totalGates = release.gates.length;
            const allGatesPassed = totalGates > 0 && passedGates === totalGates;

            return (
              <Card
                key={release.id}
                className="p-5 border-border bg-card hover:border-primary/50 transition-all duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                        {release.code}
                      </span>
                      <h3 className="text-base font-bold text-foreground hover:text-primary transition-colors">
                        <Link href={`/releases/${release.id}`}>{release.name}</Link>
                      </h3>
                      <StatusChip status={release.status} />
                      <PriorityPill priority={release.riskLevel} size="sm" />
                      {release.emergency && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">
                          <Flame className="h-3 w-3" /> Emergency Release
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span>
                        Project: <strong className="text-foreground">{project?.name || release.projectId}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Release Owner: <strong className="text-foreground">{owner?.name || release.ownerId}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Deployment Window:{" "}
                        <strong className="text-foreground font-mono">
                          {formatDate(release.windowStart)} &rarr; {formatDate(release.windowEnd)}
                        </strong>
                      </span>
                    </div>

                    {/* Included Deliverable Items */}
                    <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Items ({release.items.length}):</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {release.items.map((item) => (
                          <span
                            key={item.id}
                            className="bg-muted/50 px-2 py-0.5 rounded text-[11px] text-muted-foreground border border-border"
                          >
                            {item.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Gates Status & Drill Through */}
                  <div className="flex items-center gap-4 shrink-0 lg:border-l lg:border-border lg:pl-6">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Governance Gates</div>
                      <div className="flex items-center justify-end gap-1.5 mt-0.5">
                        <span
                          className={`font-mono text-sm font-bold ${
                            allGatesPassed ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {passedGates} / {totalGates} Passed
                        </span>
                        {allGatesPassed ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Warning className="h-4 w-4 text-amber-400" />
                        )}
                      </div>
                    </div>

                    <Link href={`/releases/${release.id}`}>
                      <Button variant="primary" size="sm">
                        <span>Review Gates</span>
                        <ArrowRight className="h-4 w-4 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
