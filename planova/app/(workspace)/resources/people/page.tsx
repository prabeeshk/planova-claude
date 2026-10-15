"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { sessionFor, can } from "@/lib/access/permissions";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/formatting/format";
import type { User, ResourceAllocation } from "@/lib/domain/types";
import {
  Users,
  ArrowLeft,
  MagnifyingGlass,
  Lock,
  Coins,
  CheckCircle,
  Warning,
  Tag,
  Briefcase,
} from "@phosphor-icons/react";

export default function PeopleDirectoryPage() {
  const organisationId = useSessionStore((s) => s.organisationId);
  const personaId = useSessionStore((s) => s.personaId);
  const session = sessionFor(personaId, organisationId);

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const { data: peopleRes, isLoading } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const { data: allocationsRes } = useQuery({
    queryKey: ["allocations", "all", organisationId],
    queryFn: () => apiClient.getAllocations(),
  });

  const people = peopleRes?.data || [];
  const allocations = allocationsRes?.data || [];

  // Permission check for sensitive cost rate
  const hasCostPermission = can(session, "cost.view");

  // Compute allocation per user
  const userAllocMap: Record<string, number> = {};
  allocations.forEach((a) => {
    userAllocMap[a.userId] = (userAllocMap[a.userId] || 0) + a.percent;
  });

  const getDepartment = (unitId: string) => {
    const map: Record<string, string> = {
      "unit-exec": "Executive Office",
      "unit-tech": "Technology & Engineering",
      "unit-digital": "Digital Product Delivery",
      "unit-cloud": "Cloud Architecture",
      "unit-gov": "Governance & Compliance",
      "unit-fin": "Finance & Control",
      "unit-core": "Core Banking",
    };
    return map[unitId] || "Technology & Delivery";
  };

  // Extract departments
  const departments = Array.from(new Set(people.map((p) => getDepartment(p.unitId))));

  const filteredPeople = people.filter((p) => {
    const dept = getDepartment(p.unitId);
    if (departmentFilter !== "all" && dept !== departmentFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchSkills = p.skills?.some((s) => s.toLowerCase().includes(q));
      if (!matchName && !matchTitle && !matchSkills) return false;
    }
    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/resources" className="hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1">
          <ArrowLeft size={16} />
          Workforce & Capacity
        </Link>
        <span>/</span>
        <span className="text-slate-700 dark:text-slate-300 font-medium">People & Skills Directory</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            People & Skills Directory
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Enterprise technical staff inventory with validated skills, capacity commitments, and permissioned billing rates.
          </p>
        </div>

        {!hasCostPermission && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
            <Lock size={14} className="shrink-0" />
            <span>Commercial cost rates redacted for current persona.</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, role title, or technical skill (e.g. Kubernetes, React, SAP)..."
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-2.5 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {(departmentFilter !== "all" || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDepartmentFilter("all");
                setSearch("");
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </Card>

      {/* People Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredPeople.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          No team members match the search and department filter.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeople.map((person) => {
            const allocationPct = userAllocMap[person.id] || 0;
            const isOverallocated = allocationPct > 100;

            return (
              <Card
                key={person.id}
                className="p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                          {person.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {person.name}
                          </h3>
                          <p className="text-xs text-slate-500">{person.title}</p>
                        </div>
                      </div>
                    </div>

                    <span className="font-mono text-[10px] text-slate-400">
                      {getDepartment(person.unitId)}
                    </span>
                  </div>

                  {/* Skills chips */}
                  {person.skills && person.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {person.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Allocation Status Indicator */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Committed Allocation</span>
                      <span
                        className={`font-mono font-bold ${
                          isOverallocated
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {allocationPct}% ({allocationPct > 0 ? (allocationPct * 0.4).toFixed(0) : 0}h / 40h)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverallocated ? "bg-rose-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(allocationPct, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Sensitive Rate Footer */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Hourly Cost Rate:</span>
                  {hasCostPermission && person.costRate ? (
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatMoney(person.costRate)}/hr
                    </span>
                  ) : (
                    <span className="font-mono text-slate-400 italic text-[11px] flex items-center gap-1">
                      <Lock size={12} /> Redacted
                    </span>
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
