"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { StatusChip } from "@/components/ui/StatusChip";
import { PriorityPill } from "@/components/ui/PriorityPill";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/formatting/format";
import {
  MagnifyingGlass,
  FolderSimple,
  CheckSquare,
  Warning,
  GitPullRequest,
  CheckCircle,
  User,
  ShieldCheck,
  ArrowRight,
  Sparkle,
} from "@phosphor-icons/react";

interface SearchResult {
  id: string;
  category: "Project" | "Task" | "RAID" | "Change" | "Approval" | "Person" | "Policy";
  code?: string;
  title: string;
  subtitle: string;
  status?: string;
  severity?: string;
  href: string;
}

export default function GlobalSearchPage() {
  const organisationId = useSessionStore((s) => s.organisationId);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const { data: tasksRes } = useQuery({
    queryKey: ["tasks", organisationId],
    queryFn: () => apiClient.getTasks(),
  });

  const { data: raidRes } = useQuery({
    queryKey: ["raidItems", organisationId],
    queryFn: () => apiClient.getRaidItems(),
  });

  const { data: changesRes } = useQuery({
    queryKey: ["changes", organisationId],
    queryFn: () => apiClient.getChanges(),
  });

  const { data: approvalsRes } = useQuery({
    queryKey: ["approvals", organisationId],
    queryFn: () => apiClient.getApprovals(),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const { data: policiesRes } = useQuery({
    queryKey: ["policies", organisationId],
    queryFn: () => apiClient.getPolicies(),
  });

  const projects = projectsRes?.data || [];
  const tasks = tasksRes?.data || [];
  const raidItems = raidRes?.data || [];
  const changes = changesRes?.data || [];
  const approvals = approvalsRes?.data || [];
  const people = peopleRes?.data || [];
  const policies = policiesRes?.data || [];

  // Build unified index
  const allResults: SearchResult[] = useMemo(() => {
    const list: SearchResult[] = [];

    projects.forEach((p) => {
      list.push({
        id: p.id,
        category: "Project",
        code: p.code,
        title: p.name,
        subtitle: p.summary,
        status: p.health,
        href: `/projects/${p.id}`,
      });
    });

    tasks.forEach((t) => {
      list.push({
        id: t.id,
        category: "Task",
        code: t.code,
        title: t.title,
        subtitle: `Due ${formatDate(t.dueDate)} • Progress ${t.progress}%`,
        status: t.status,
        severity: t.priority,
        href: `/projects/${t.projectId}?task=${t.id}`,
      });
    });

    raidItems.forEach((r) => {
      list.push({
        id: r.id,
        category: "RAID",
        code: `${r.type.toUpperCase()}-${r.id}`,
        title: r.title,
        subtitle: `Score ${r.score} • ${r.response}`,
        status: r.status,
        severity: r.severity,
        href: `/projects/${r.projectId}?tab=raid`,
      });
    });

    changes.forEach((c) => {
      list.push({
        id: c.id,
        category: "Change",
        code: c.code,
        title: c.title,
        subtitle: c.reason,
        status: c.status,
        href: `/changes/${c.id}`,
      });
    });

    approvals.forEach((a) => {
      list.push({
        id: a.id,
        category: "Approval",
        code: `APPR-${a.id}`,
        title: a.title,
        subtitle: `Submitted by requester • Due ${formatDate(a.dueAt)}`,
        status: a.status,
        href: `/approvals/${a.id}`,
      });
    });

    people.forEach((u) => {
      list.push({
        id: u.id,
        category: "Person",
        code: u.email,
        title: u.name,
        subtitle: `${u.title} • FTE ${u.fte.toFixed(1)}`,
        status: u.active ? "Active" : "Archived",
        href: `/resources/people`,
      });
    });

    policies.forEach((pol) => {
      list.push({
        id: pol.id,
        category: "Policy",
        code: pol.code,
        title: pol.name,
        subtitle: pol.summary,
        status: "Approved",
        href: `/governance/policies`,
      });
    });

    return list;
  }, [projects, tasks, raidItems, changes, approvals, people, policies]);

  // Filtered
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allResults.filter((item) => {
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.code?.toLowerCase().includes(q) ?? false) ||
        item.subtitle.toLowerCase().includes(q)
      );
    });
  }, [allResults, query, categoryFilter]);

  const categories = ["ALL", "Project", "Task", "RAID", "Change", "Approval", "Person", "Policy"];

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Project":
        return <FolderSimple className="h-4 w-4 text-indigo-400" />;
      case "Task":
        return <CheckSquare className="h-4 w-4 text-emerald-400" />;
      case "RAID":
        return <Warning className="h-4 w-4 text-amber-400" />;
      case "Change":
        return <GitPullRequest className="h-4 w-4 text-purple-400" />;
      case "Approval":
        return <CheckCircle className="h-4 w-4 text-cyan-400" />;
      case "Person":
        return <User className="h-4 w-4 text-blue-400" />;
      case "Policy":
        return <ShieldCheck className="h-4 w-4 text-rose-400" />;
      default:
        return <Sparkle className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Header & Big Search Input */}
      <div className="space-y-4 pt-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <MagnifyingGlass className="h-7 w-7 text-indigo-500" />
            Global Enterprise Search
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time query engine across projects, deliverables, risks, change orders, approvals, and personnel.
          </p>
        </div>

        <div className="relative">
          <MagnifyingGlass className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by code, deliverable, title, policy, or name (e.g. Aurora, CR-ATL, Cloud, Biometric)..."
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = categoryFilter === cat;
          const count =
            cat === "ALL"
              ? allResults.length
              : allResults.filter((r) => r.category === cat).length;

          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground border-border hover:bg-muted/40"
              }`}
            >
              <span>{cat === "ALL" ? "All Results" : cat}</span>
              <span className="ml-1.5 opacity-75 font-mono text-[10px]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Suggested Queries if query is empty */}
      {!query.trim() && (
        <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
          <span className="text-xs font-semibold text-muted-foreground block">
            Suggested Search Queries:
          </span>
          <div className="flex flex-wrap gap-2">
            {["Aurora", "CR-ATL-001", "Biometric", "CBUAE", "EKS", "Cost Variance", "Overrun"].map(
              (term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-2.5 py-1 text-xs rounded-md bg-card border border-border text-foreground hover:border-primary/50 transition-colors font-mono"
                >
                  {term}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Results Feed */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Search Results ({filteredResults.length})</span>
          <span className="font-mono">Real-time mock index</span>
        </div>

        {filteredResults.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            <MagnifyingGlass className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <span>No records found matching &ldquo;{query}&rdquo;.</span>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredResults.slice(0, 50).map((result) => (
              <Link
                key={`${result.category}-${result.id}`}
                href={result.href}
                className="p-4 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors block group"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="h-8 w-8 rounded-lg bg-muted/60 border border-border flex items-center justify-center shrink-0 mt-0.5">
                    {getCategoryIcon(result.category)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-primary">
                        {result.code || result.id}
                      </span>
                      <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        {result.title}
                      </h4>
                      {result.status && <StatusChip status={result.status} />}
                      {result.severity && (
                        <PriorityPill priority={result.severity as any} size="sm" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{result.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-muted-foreground group-hover:text-foreground">
                  <span className="text-[11px] font-mono text-muted-foreground uppercase hidden sm:inline">
                    {result.category}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
