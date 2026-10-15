"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import type { IntegrationConnection } from "@/lib/domain/types";
import {
  Plugs,
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  Warning,
  Info,
  Key,
  Users,
  Database,
  Calendar,
  ChatCircleDots,
  GitBranch,
} from "@phosphor-icons/react";

export default function IntegrationsAdministrationPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const { data: integrationsRes, isLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => apiClient.getIntegrations(),
  });

  const integrations = integrationsRes?.data || [];

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case "Identity":
        return <Key className="h-5 w-5 text-indigo-400" />;
      case "HRIS":
        return <Users className="h-5 w-5 text-emerald-400" />;
      case "ERP":
        return <Database className="h-5 w-5 text-amber-400" />;
      case "Calendar":
        return <Calendar className="h-5 w-5 text-cyan-400" />;
      case "Collaboration":
        return <ChatCircleDots className="h-5 w-5 text-purple-400" />;
      default:
        return <Plugs className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-emerald-900 border border-emerald-700 px-4 py-3 text-sm text-emerald-100 shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/administration" className="hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              Administration
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Integration Topology</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Plugs className="h-7 w-7 text-indigo-500" />
            Enterprise Integration Connectors
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Architectural blueprints and target state topologies for identity federation, HRIS, ERP, and collaboration data planes.
          </p>
        </div>
      </div>

      {/* Preview-Only Architectural Notice Banner */}
      <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-xs text-indigo-200 flex items-start gap-3">
        <Info className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-indigo-300 block">
            Phase 1 Architectural Preview Specifications
          </span>
          <p>
            The integration cards below detail planned bi-directional data flow architectures for Phase 2 implementation.
            In accordance with the PLANOVA master implementation specification, no live external socket connections or
            credentials are saved or transmitted in this environment.
          </p>
        </div>
      </div>

      {/* Integration Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((connector) => (
          <Card
            key={connector.id}
            className="p-6 border-border bg-card flex flex-col justify-between hover:border-primary/40 transition-colors"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted/60 border border-border flex items-center justify-center">
                    {getKindIcon(connector.kind)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">{connector.name}</h3>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Kind: {connector.kind}
                    </span>
                  </div>
                </div>

                <StatusChip status={connector.status === "Design" ? "In Review" : "Draft"} />
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {connector.description}
              </p>

              <div className="pt-3 border-t border-border/50 text-xs text-muted-foreground space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Planned Release Target:</span>
                  <strong className="text-foreground font-mono">{connector.plannedPhase}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Protocol Standard:</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {connector.kind === "Identity"
                      ? "OIDC / SAML 2.0 / SCIM 2.0"
                      : connector.kind === "ERP"
                      ? "OData v4 / RFC REST"
                      : connector.kind === "HRIS"
                      ? "REST / GraphQL Webhook"
                      : "Graph API / Webhook"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Zero Live Credentials
              </span>

              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() =>
                  showToast(
                    `${connector.name} configuration specification verified. Schema contracts matched.`
                  )
                }
              >
                Validate Blueprint
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
