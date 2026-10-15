"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { PriorityPill } from "@/components/ui/PriorityPill";
import { Modal } from "@/components/ui/Modal";
import {
  Sparkle,
  PaintBrush,
  TextT,
  CheckCircle,
  Warning,
  RocketLaunch,
  CursorClick,
  SquaresFour,
  ArrowRight,
  ShieldCheck,
} from "@phosphor-icons/react";

export default function DesignSystemShowcasePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [counter, setCounter] = useState(0);

  return (
    <div className="space-y-10 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Link href="/home" className="hover:text-foreground transition-colors">
            Workspace
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Design System</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <PaintBrush className="h-7 w-7 text-indigo-500" />
          PLANOVA Design System & UI Token Showcase
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Standardized visual components, semantic color tokens, typography scales, and interaction guidelines.
        </p>
      </div>

      {/* Typography Scale */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
          <TextT className="h-5 w-5 text-indigo-500" />
          <span>Typography Hierarchy (Geist Sans & Geist Mono)</span>
        </h2>

        <Card className="p-6 border-border bg-card space-y-6">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase">Heading 1 — 2xl Bold (24px)</span>
            <h1 className="text-2xl font-bold text-foreground">
              Strategic Portfolio Delivery & Architecture
            </h1>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase">Heading 2 — xl Bold (20px)</span>
            <h2 className="text-xl font-bold text-foreground">
              Governance Review & Quorum Approval Ledger
            </h2>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase">Heading 3 — sm Semibold (14px)</span>
            <h3 className="text-sm font-semibold text-foreground">
              Automated QA Regression (100% Passed Evidence Verification)
            </h3>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase">Body Text — sm Regular (14px / 1.5)</span>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              PLANOVA coordinates high-consequence technology delivery across multi-tenant banking environments,
              enforcing strict separation between in-memory mock repositories and production data boundaries.
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase">Monospace Code — xs Mono (12px)</span>
            <div className="font-mono text-xs text-primary bg-muted/60 p-2.5 rounded-lg border border-border inline-block">
              const correlationId = &quot;corr-aud-9812-sha256&quot;;
            </div>
          </div>
        </Card>
      </section>

      {/* Color Tokens Palette */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
          <SquaresFour className="h-5 w-5 text-indigo-500" />
          <span>Semantic Color Tokens</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { name: "Primary Brand", hex: "#6366f1", bg: "bg-indigo-600", text: "text-white" },
            { name: "Success / On Track", hex: "#10b981", bg: "bg-emerald-600", text: "text-white" },
            { name: "Warning / At Risk", hex: "#f59e0b", bg: "bg-amber-600", text: "text-white" },
            { name: "Critical / Blocked", hex: "#f43f5e", bg: "bg-rose-600", text: "text-white" },
            { name: "Governance Purple", hex: "#a855f7", bg: "bg-purple-600", text: "text-white" },
            { name: "Cyan Technical", hex: "#06b6d4", bg: "bg-cyan-600", text: "text-white" },
          ].map((token) => (
            <div key={token.name} className="p-3 bg-card border border-border rounded-xl space-y-2">
              <div className={`h-12 w-full rounded-lg ${token.bg}`} />
              <div>
                <span className="font-semibold text-xs text-foreground block">{token.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{token.hex}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Button Components */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
          <CursorClick className="h-5 w-5 text-indigo-500" />
          <span>Buttons & Interactive Actions</span>
        </h2>

        <Card className="p-6 border-border bg-card space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={() => setCounter((c) => c + 1)}>
              Primary Action ({counter})
            </Button>
            <Button variant="outline" onClick={() => setModalOpen(true)}>
              Open Modal Preview
            </Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="destructive">Destructive Action</Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="primary" size="sm">
              Small Button (sm)
            </Button>
            <Button variant="primary" size="md">
              Medium Button (md)
            </Button>
            <Button variant="primary" size="lg">
              Large Button (lg)
            </Button>
            <Button variant="outline" size="sm" disabled>
              Disabled State
            </Button>
          </div>
        </Card>
      </section>

      {/* Badges, StatusChips, & PriorityPills */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
          <ShieldCheck className="h-5 w-5 text-indigo-500" />
          <span>Status Chips & Priority Indicators</span>
        </h2>

        <Card className="p-6 border-border bg-card space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground block uppercase">
              Standard StatusChip States
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusChip status="On Track" />
              <StatusChip status="At Risk" />
              <StatusChip status="Critical" />
              <StatusChip status="Active" />
              <StatusChip status="Draft" />
              <StatusChip status="In Review" />
              <StatusChip status="Approved" />
              <StatusChip status="Completed" />
              <StatusChip status="Archived" />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <span className="text-xs font-semibold text-muted-foreground block uppercase">
              PriorityPill Severity Tokens
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              <PriorityPill priority="Low" />
              <PriorityPill priority="Medium" />
              <PriorityPill priority="High" />
              <PriorityPill priority="Critical" />
              <PriorityPill priority="Critical" size="sm" />
            </div>
          </div>
        </Card>
      </section>

      {/* Modal Preview */}
      <Modal
        open={modalOpen}
        onOpenChange={(open: boolean) => setModalOpen(open)}
        title="Interactive Design System Modal"
      >
        <div className="space-y-4 text-xs">
          <p className="text-muted-foreground leading-relaxed">
            Standard accessible modal dialog utilizing Radix UI dialog primitives with spring focus trap,
            backdrop blur, and keyboard escape handling.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Close Modal
            </Button>
            <Button variant="primary" size="sm" onClick={() => setModalOpen(false)}>
              Understood
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
