"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Users,
  ChartBar,
  CalendarBlank,
  ArrowRight,
  Clock,
  Warning,
  CheckCircle,
  Sparkle,
} from "@phosphor-icons/react";

export default function ResourcesHubPage() {
  const organisationId = useSessionStore((s) => s.organisationId);

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const { data: allocationsRes } = useQuery({
    queryKey: ["allocations", "all", organisationId],
    queryFn: () => apiClient.getAllocations(),
  });

  const { data: requestsRes } = useQuery({
    queryKey: ["resourceRequests", organisationId],
    queryFn: () => apiClient.getResourceRequests(),
  });

  const people = peopleRes?.data || [];
  const allocations = allocationsRes?.data || [];
  const requests = requestsRes?.data || [];

  // Compute total capacity vs allocated
  const totalFte = people.reduce((acc, p) => acc + (p.fte || 1), 0);
  const totalAvailableHoursWeekly = totalFte * 40;

  // Group allocations by user
  const userAllocMap: Record<string, number> = {};
  allocations.forEach((a) => {
    userAllocMap[a.userId] = (userAllocMap[a.userId] || 0) + a.percent;
  });

  const overallocatedCount = Object.values(userAllocMap).filter((pct) => pct > 100).length;
  const avgAllocation = people.length > 0
    ? Math.round(Object.values(userAllocMap).reduce((a, b) => a + b, 0) / people.length)
    : 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users size={26} className="text-blue-500" />
            Enterprise Workforce & Capacity Hub
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Squad allocation management, weekly capacity heatmaps, skills inventory, and talent contention triage.
          </p>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Workforce Capacity</span>
            <Users size={20} className="text-blue-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {people.length} People
          </div>
          <div className="text-xs text-slate-500">{totalAvailableHoursWeekly} weekly productive hrs</div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Mean Allocation</span>
            <ChartBar size={20} className="text-emerald-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {avgAllocation}%
          </div>
          <div className="text-xs text-slate-500">Healthy squad band (80–95%)</div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Overallocated Peers</span>
            <Warning size={20} className="text-rose-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {overallocatedCount}
          </div>
          <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">Exceeding 100% capacity</div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Open Staffing Requests</span>
            <Clock size={20} className="text-purple-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {requests.length}
          </div>
          <div className="text-xs text-slate-500">Awaiting squad assignment</div>
        </Card>
      </div>

      {/* Navigation Subsurface Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Subsurface 1: People & Skills */}
        <Card className="p-6 flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition-all shadow-xs">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              People & Skills Directory
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Browse technical specialists, certified competencies, cross-project assignments, and role disciplines.
            </p>
          </div>
          <Link href="/resources/people">
            <Button variant="secondary" className="w-full flex items-center justify-center gap-1.5">
              <span>View People Directory</span>
              <ArrowRight size={14} />
            </Button>
          </Link>
        </Card>

        {/* Subsurface 2: Capacity Heatmap */}
        <Card className="p-6 flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition-all shadow-xs">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ChartBar size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Weekly Capacity Heatmap
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Visualize multi-week commitment percentages, identify over-allocated bottlenecks, and balance squad hours.
            </p>
          </div>
          <Link href="/resources/capacity">
            <Button variant="secondary" className="w-full flex items-center justify-center gap-1.5">
              <span>Open Capacity Heatmap</span>
              <ArrowRight size={14} />
            </Button>
          </Link>
        </Card>

        {/* Subsurface 3: Time-Grid Allocations Planner */}
        <Card className="p-6 flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition-all shadow-xs">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <CalendarBlank size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Allocations & Staffing Requests
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Adjust project commitment percentages, initiate formal staffing requests, and model capacity allocations.
            </p>
          </div>
          <Link href="/resources/allocations">
            <Button variant="secondary" className="w-full flex items-center justify-center gap-1.5">
              <span>Open Allocations Planner</span>
              <ArrowRight size={14} />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
