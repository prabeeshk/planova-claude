"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ROLES, PERMISSIONS, type RoleCode, type Permission, evaluate, PERSONAS } from "@/lib/access/permissions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ShieldCheck,
  Shield,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Info,
  Lightning,
  Funnel,
  Sparkle,
} from "@phosphor-icons/react";

const PERMISSION_DOMAINS: Record<string, Permission[]> = {
  Projects: ["project.view", "project.create", "project.edit", "project.archive"],
  Tasks: ["task.view", "task.create", "task.edit", "milestone.manage"],
  RAID: ["raid.view", "raid.create", "raid.escalate", "raid.close"],
  "Changes & Approvals": ["change.view", "change.submit", "approval.view", "approval.decide"],
  Governance: ["governance.view", "governance.manage"],
  Resources: ["resource.view", "allocation.manage"],
  Financials: ["budget.view", "budget.edit", "cost.view", "forecast.edit", "actual.import"],
  Workforce: ["time.enter", "time.approve", "leave.request", "leave.approve"],
  Portfolio: ["portfolio.view", "portfolio.manage"],
  Releases: ["release.view", "release.manage"],
  "Reports & Audit": ["report.run", "report.export", "audit.view", "audit.export"],
  Administration: ["user.manage", "role.manage", "settings.manage"],
};

export default function RolesAdministrationPage() {
  const [selectedRole, setSelectedRole] = useState<RoleCode>("PROJECT_MANAGER");
  const [testPermission, setTestPermission] = useState<Permission>("forecast.edit");
  const [domainFilter, setDomainFilter] = useState<string>("ALL");

  const roleList = Object.values(ROLES);

  // Effective evaluation test
  const testEval = useMemo(() => {
    return evaluate(selectedRole, testPermission);
  }, [selectedRole, testPermission]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/administration" className="hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              Administration
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Roles & Capabilities</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-indigo-500" />
            Role Catalogue & Permission Matrix
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Explore 10 enterprise role definitions, 40+ permission verbs, and hierarchical scope assignments.
          </p>
        </div>
      </div>

      {/* Role Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {roleList.map((r) => (
          <button
            key={r.code}
            onClick={() => setSelectedRole(r.code)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedRole === r.code
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card text-muted-foreground border-border hover:bg-muted/40"
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      {/* Active Role Definition & Capability Inspector */}
      {ROLES[selectedRole] && (
        <Card className="p-5 border-border bg-card space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-500" />
                <h3 className="text-base font-bold text-foreground">{ROLES[selectedRole].name}</h3>
                <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                  {selectedRole}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                {ROLES[selectedRole].description}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Explicit Grants:</span>
              <div className="font-mono text-lg font-bold text-foreground">
                {ROLES[selectedRole].grants.length} permissions
              </div>
            </div>
          </div>

          {/* Interactive Effective Capability Preview */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Lightning className="h-4 w-4 text-amber-400" />
                Effective Capability Explainer
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Test Permission Verb:</span>
                <select
                  value={testPermission}
                  onChange={(e) => setTestPermission(e.target.value as Permission)}
                  className="bg-background border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none font-mono text-xs"
                >
                  {PERMISSIONS.map((perm) => (
                    <option key={perm} value={perm}>
                      {perm}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs p-3 rounded-lg bg-background border border-border">
              {testEval.allowed ? (
                <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-rose-400 shrink-0" />
              )}
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {testEval.allowed ? "ACCESS GRANTED" : "ACCESS DENIED"}
                  </span>
                  {testEval.scope && (
                    <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Scope: {testEval.scope}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground">{testEval.reason}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Comprehensive Permission Matrix */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Enterprise Permission Matrix (40+ Verbs × 10 Roles)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Green badges indicate authorized scope hierarchy (ORGANISATION, DEPARTMENT, PROJECT, TEAM, ASSIGNED, SELF).
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Funnel className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="bg-background border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none"
            >
              <option value="ALL">All Domains</option>
              {Object.keys(PERMISSION_DOMAINS).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="py-3 px-4 sticky left-0 bg-muted/80 z-10 min-w-[200px]">
                  Permission Verb
                </th>
                <th className="py-3 px-2 text-center min-w-[70px]">PM</th>
                <th className="py-3 px-2 text-center min-w-[70px]">Member</th>
                <th className="py-3 px-2 text-center min-w-[70px]">Scrum</th>
                <th className="py-3 px-2 text-center min-w-[70px]">Gov Anl</th>
                <th className="py-3 px-2 text-center min-w-[70px]">Gov Appr</th>
                <th className="py-3 px-2 text-center min-w-[70px]">Exec</th>
                <th className="py-3 px-2 text-center min-w-[70px]">Res Mgr</th>
                <th className="py-3 px-2 text-center min-w-[70px]">Finance</th>
                <th className="py-3 px-2 text-center min-w-[70px]">Admin</th>
                <th className="py-3 px-2 text-center min-w-[70px]">Auditor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {Object.entries(PERMISSION_DOMAINS)
                .filter(([domain]) => domainFilter === "ALL" || domainFilter === domain)
                .map(([domain, perms]) => (
                  <React.Fragment key={domain}>
                    <tr className="bg-muted/20">
                      <td
                        colSpan={11}
                        className="py-1.5 px-4 font-sans font-bold text-[11px] text-primary uppercase tracking-wider"
                      >
                        {domain}
                      </td>
                    </tr>
                    {perms.map((perm) => (
                      <tr key={perm} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-4 sticky left-0 bg-card z-10 font-mono text-[11px] text-foreground">
                          {perm}
                        </td>
                        {roleList.map((r) => {
                          const ev = evaluate(r.code, perm);

                          return (
                            <td key={r.code} className="py-2.5 px-2 text-center text-[10px]">
                              {ev.allowed ? (
                                <span className="font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                  {ev.scope === "ORGANISATION"
                                    ? "ORG"
                                    : ev.scope === "DEPARTMENT"
                                    ? "DEPT"
                                    : ev.scope === "PORTFOLIO"
                                    ? "PORT"
                                    : ev.scope === "PROJECT"
                                    ? "PROJ"
                                    : ev.scope === "TEAM"
                                    ? "TEAM"
                                    : ev.scope === "ASSIGNED"
                                    ? "ASGN"
                                    : "SELF"}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/30 font-sans">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
