"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Gear,
  Users,
  ShieldCheck,
  Buildings,
  Scroll,
  Plugs,
  ArrowRight,
  ShieldWarning,
  CheckCircle,
  Database,
  Lock,
} from "@phosphor-icons/react";

export default function AdministrationOverviewPage() {
  const organisationId = useSessionStore((s) => s.organisationId);

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const { data: orgRes } = useQuery({
    queryKey: ["organisation", organisationId],
    queryFn: () => apiClient.getOrganisation(),
  });

  const { data: auditRes } = useQuery({
    queryKey: ["auditEvents", organisationId],
    queryFn: () => apiClient.getAuditEvents(),
  });

  const { data: integrationsRes } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => apiClient.getIntegrations(),
  });

  const people = peopleRes?.data || [];
  const org = orgRes?.data;
  const auditEvents = auditRes?.data || [];
  const integrations = integrationsRes?.data || [];

  const activeUsers = people.filter((p) => p.active).length;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Link href="/home" className="hover:text-foreground transition-colors">
            Workspace
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Administration Hub</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <Gear className="h-7 w-7 text-indigo-500" />
          Enterprise Platform Administration
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage identity, role-based access control, institutional hierarchy, audit logs, and integration topology.
        </p>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Directory Users</span>
            <Users className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {activeUsers} / {people.length}
          </div>
          <span className="text-xs text-muted-foreground mt-1 block">Provisioned enterprise principals</span>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Role Definitions</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">10 Roles</div>
          <span className="text-xs text-muted-foreground mt-1 block">40+ scoped permission verbs</span>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Immutable Audit Logs</span>
            <Scroll className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{auditEvents.length} Events</div>
          <span className="text-xs text-muted-foreground mt-1 block">Cryptographically referenced trail</span>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Integration Connectors</span>
            <Plugs className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{integrations.length} Planned</div>
          <span className="text-xs text-muted-foreground mt-1 block">OIDC, HRIS, ERP, and Teams</span>
        </Card>
      </div>

      {/* Administration Subsurface Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Users & Principals */}
        <Card className="p-6 border-border bg-card hover:border-primary/50 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Users & Access Grants</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Manage user directories, assigned scopes, FTE capacity, skills, and emergency admin safeguards.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-border">
            <Link href="/administration/users">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>Manage Users</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Roles & Permissions */}
        <Card className="p-6 border-border bg-card hover:border-primary/50 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Role Permissions Matrix</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Inspect 40+ permission verbs across 7 hierarchy scopes and preview effective permissions by persona.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-border">
            <Link href="/administration/roles">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>View Permission Matrix</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Organisation & Settings */}
        <Card className="p-6 border-border bg-card hover:border-primary/50 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Buildings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Organisation Hierarchy</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Operating departments, base currency, corporate timezone, and platform feature toggles.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-border">
            <Link href="/administration/organisation">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>Configure Hierarchy</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Audit Trail */}
        <Card className="p-6 border-border bg-card hover:border-primary/50 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Scroll className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Compliance Audit Search</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Read-only query engine for actor decisions, correlation IDs, and redacted entity state modifications.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-border">
            <Link href="/administration/audit">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>Search Audit Trail</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Integrations */}
        <Card className="p-6 border-border bg-card hover:border-primary/50 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Plugs className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Integration Topology</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Informative architectural specifications for enterprise IdP, HRIS, SAP ERP, and collaboration sync.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-border">
            <Link href="/administration/integrations">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>Inspect Connectors</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
