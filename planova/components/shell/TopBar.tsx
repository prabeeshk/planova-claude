"use client";

import React, { useState } from "react";
import { useSessionStore } from "@/stores/useSessionStore";
import { PERSONAS, PersonaId } from "@/lib/access/permissions";
import {
  MagnifyingGlass,
  Sparkle,
  Sun,
  Moon,
  Wrench,
  Buildings,
  UserSwitch,
  CaretDown,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { DevToolsModal } from "./DevToolsModal";

export function TopBar() {
  const {
    personaId,
    setPersona,
    organisationId,
    setOrganisation,
    theme,
    toggleTheme,
    toggleCopilot,
    setCommandPaletteOpen,
    faultConfig,
  } = useSessionStore();

  const [devToolsOpen, setDevToolsOpen] = useState(false);

  const activePersona = PERSONAS.find((p) => p.id === personaId) || PERSONAS[0];

  const orgs = [
    { id: "org-meridian", name: "Meridian Global Enterprises", currency: "AED" },
    { id: "org-northwind", name: "Northwind Global Holdings", currency: "USD" },
  ];

  const hasFaultActive =
    faultConfig.forceErrorStatus !== null || !faultConfig.simulateLatency;

  return (
    <>
      <header className="h-16 border-b border-[var(--surface-border)] bg-[var(--surface)] px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
        {/* Left: Global Search trigger */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between h-9 px-3 rounded-xl border border-[var(--surface-border)] bg-[var(--background)] text-xs text-[var(--muted)] hover:border-[var(--primary)]/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MagnifyingGlass className="w-3.5 h-3.5 text-[var(--muted)]" />
              <span>Search projects, tasks, RAID, people...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-[var(--surface)] border border-[var(--surface-border)] font-mono text-[var(--muted)]">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Switchers and utility actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Organisation Switcher */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[var(--surface-elevated)] px-2.5 py-1 rounded-xl border border-[var(--surface-border)]">
            <Buildings className="w-3.5 h-3.5 text-[var(--primary)]" />
            <select
              value={organisationId}
              onChange={(e) => setOrganisation(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[var(--foreground)] border-none focus:outline-none cursor-pointer"
              aria-label="Demo Organisation Switcher"
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id} className="bg-[var(--surface)] text-[var(--foreground)]">
                  {o.name} ({o.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Demo Persona Switcher */}
          <div className="flex items-center gap-1.5 bg-[var(--surface-elevated)] px-2.5 py-1 rounded-xl border border-[var(--surface-border)]">
            <UserSwitch className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span className="text-[10px] text-[var(--muted)] font-medium hidden sm:inline">Role:</span>
            <select
              value={personaId}
              onChange={(e) => setPersona(e.target.value as PersonaId)}
              className="bg-transparent text-xs font-semibold text-[var(--foreground)] border-none focus:outline-none cursor-pointer max-w-[130px] sm:max-w-none truncate"
              aria-label="Demo Role Switcher (Not Login)"
            >
              {PERSONAS.map((p) => (
                <option key={p.id} value={p.id} className="bg-[var(--surface)] text-[var(--foreground)]">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* DevTools Fault Injector Button */}
          <button
            type="button"
            onClick={() => setDevToolsOpen(true)}
            className="relative h-9 w-9 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-elevated)] transition-colors"
            title="Demo DevTools & Fault Injection"
            aria-label="Open DevTools & Fault Injection"
          >
            <Wrench className="w-4 h-4" />
            {hasFaultActive && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-elevated)] transition-colors"
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Copilot Launcher */}
          <Button
            variant="subtle"
            size="sm"
            onClick={toggleCopilot}
            className="hidden sm:inline-flex gap-1.5"
          >
            <Sparkle weight="fill" className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Copilot</span>
          </Button>
        </div>
      </header>

      {/* DevTools Modal */}
      <DevToolsModal open={devToolsOpen} onOpenChange={setDevToolsOpen} />
    </>
  );
}
