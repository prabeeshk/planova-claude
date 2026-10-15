import React from "react";
import Link from "next/link";
import {
  Sparkle,
  ArrowRight,
  ShieldCheck,
  Lightning,
  TreeStructure,
  Pulse,
  Kanban,
  Coins,
} from "@phosphor-icons/react/dist/ssr";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col justify-between">
      {/* Top bar */}
      <header className="h-20 px-6 sm:px-12 flex items-center justify-between border-b border-[var(--surface-border)] bg-[var(--surface)]/70 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#6558E8] to-[#4F46E5] flex items-center justify-center text-white font-bold text-lg shadow-sm">
            P
          </div>
          <div>
            <span className="font-bold text-base tracking-tight">PLANOVA</span>
            <span className="ml-2 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
              Enterprise Preview
            </span>
          </div>
        </div>

        <Link
          href="/home"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary-hover)] transition-all shadow-sm active:scale-95"
        >
          <span>Explore Demo Workspace</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 sm:py-24 text-center space-y-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Sparkle weight="fill" className="w-4 h-4 text-purple-600" />
          <span>Intelligent Project Delivery & Enterprise Oversight</span>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[var(--foreground)] leading-tight">
            Plan smarter. <br />
            <span className="bg-gradient-to-r from-[#6558E8] via-[#7C70F2] to-[#3B82F6] bg-clip-text text-transparent">
              Deliver together.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed">
            PLANOVA combines intelligent project management, effortless agile execution, and comprehensive enterprise governance in one connected, beautifully calm workspace.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary-hover)] transition-all shadow-md active:scale-95"
          >
            <span>Enter Demo Environment</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/pulse"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-elevated)] transition-all"
          >
            <span>View Needs Your Attention</span>
          </Link>
        </div>

        {/* 3 Pillars: Pulse, Flow, Intelligence */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-12">
          {/* Pulse */}
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--surface-border)] space-y-3 shadow-xs hover:border-[var(--primary)]/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Pulse className="w-5 h-5" weight="bold" />
            </div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              PLANOVA Pulse — Understand
            </h2>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              A Project Command Centre where health, trends, RAID items, upcoming milestones, capacity, and budget deltas lead to actionable decisions, not arbitrary dashboards.
            </p>
          </div>

          {/* Flow */}
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--surface-border)] space-y-3 shadow-xs hover:border-[var(--primary)]/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Kanban className="w-5 h-5" weight="bold" />
            </div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              PLANOVA Flow — Execute
            </h2>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Lightning-fast task execution across Board, List, and Timeline views with keyboard actions, optimistic updates, milestones, and real-time dependency checks.
            </p>
          </div>

          {/* Intelligence */}
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--surface-border)] space-y-3 shadow-xs hover:border-[var(--primary)]/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Sparkle className="w-5 h-5" weight="bold" />
            </div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              PLANOVA Intelligence — Anticipate
            </h2>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Traceable AI-assisted briefings, early delivery risk warnings, and the globally accessible PLANOVA Copilot that connects every insight to underlying source evidence.
            </p>
          </div>
        </div>

        {/* Demo Disclaimer notice */}
        <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--surface-border)] max-w-2xl mx-auto text-xs text-[var(--muted)] text-center">
          <p>
            <strong className="text-[var(--foreground)] font-semibold">Phase 1 Frontend Demonstration: </strong>
            This is an interactive browser application seeded with 12 enterprise projects, 100+ tasks, and 35+ RAID items. All operations persist in your browser session with mock API latency.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 px-6 sm:px-12 border-t border-[var(--surface-border)] flex items-center justify-between text-xs text-[var(--muted)] bg-[var(--surface)]">
        <div>© 2026 PLANOVA Inc. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <Link href="/home" className="hover:text-[var(--foreground)]">Workspace</Link>
          <Link href="/pulse" className="hover:text-[var(--foreground)]">Pulse</Link>
          <Link href="/governance" className="hover:text-[var(--foreground)]">Governance</Link>
        </div>
      </footer>
    </div>
  );
}
