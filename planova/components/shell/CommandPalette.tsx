"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useSessionStore } from "@/stores/useSessionStore";
import { apiClient } from "@/lib/mock-api/client";
import { useQuery } from "@tanstack/react-query";
import {
  MagnifyingGlass,
  FolderSimple,
  CheckCircle,
  Warning,
  Users,
  Flag,
  X,
} from "@phosphor-icons/react";

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen, organisationId } = useSessionStore();
  const [search, setSearch] = useState("");

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  // Fetch search data scoped to current organisation
  const { data: projectsData } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
    enabled: commandPaletteOpen,
  });

  const { data: tasksData } = useQuery({
    queryKey: ["tasks", organisationId],
    queryFn: () => apiClient.getTasks(),
    enabled: commandPaletteOpen,
  });

  const { data: raidData } = useQuery({
    queryKey: ["raid", organisationId],
    queryFn: () => apiClient.getRaidItems(),
    enabled: commandPaletteOpen,
  });

  const { data: peopleData } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
    enabled: commandPaletteOpen,
  });

  if (!commandPaletteOpen) return null;

  const navigateTo = (href: string) => {
    setCommandPaletteOpen(false);
    router.push(href);
  };

  const projects = projectsData?.data || [];
  const tasks = tasksData?.data || [];
  const raidItems = raidData?.data || [];
  const people = peopleData?.data || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-xl bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
        <Command className="w-full" loop>
          <div className="flex items-center px-4 border-b border-[var(--surface-border)]">
            <MagnifyingGlass className="w-5 h-5 text-[var(--muted)] mr-2 shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type to search projects, tasks, RAID, people..."
              className="w-full h-12 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(false)}
              className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2 text-xs space-y-2">
            <Command.Empty className="py-6 text-center text-[var(--muted)]">
              No results found for &quot;{search}&quot;.
            </Command.Empty>

            {/* Projects */}
            {projects.length > 0 && (
              <Command.Group heading={<span className="px-2 font-semibold text-[var(--muted)] uppercase text-[10px]">Projects</span>}>
                {projects.slice(0, 5).map((p) => (
                  <Command.Item
                    key={p.id}
                    value={`${p.code} ${p.name}`}
                    onSelect={() => navigateTo(`/projects/${p.id}`)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-[var(--surface-elevated)] cursor-pointer text-[var(--foreground)]"
                  >
                    <div className="flex items-center gap-2">
                      <FolderSimple className="w-4 h-4 text-[var(--primary)]" />
                      <span className="font-semibold">{p.code}</span>
                      <span>{p.name}</span>
                    </div>
                    <span className="text-[10px] text-[var(--muted)]">{p.status}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Tasks */}
            {tasks.length > 0 && (
              <Command.Group heading={<span className="px-2 font-semibold text-[var(--muted)] uppercase text-[10px]">Tasks</span>}>
                {tasks.slice(0, 5).map((t) => (
                  <Command.Item
                    key={t.id}
                    value={`${t.code} ${t.title}`}
                    onSelect={() => navigateTo(`/projects/${t.projectId}/tasks/${t.id}`)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-[var(--surface-elevated)] cursor-pointer text-[var(--foreground)]"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold">{t.code}</span>
                      <span className="truncate max-w-xs">{t.title}</span>
                    </div>
                    <span className="text-[10px] text-[var(--muted)]">{t.status}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* RAID */}
            {raidItems.length > 0 && (
              <Command.Group heading={<span className="px-2 font-semibold text-[var(--muted)] uppercase text-[10px]">RAID Items</span>}>
                {raidItems.slice(0, 5).map((r) => (
                  <Command.Item
                    key={r.id}
                    value={`${r.code} ${r.title}`}
                    onSelect={() => navigateTo(`/governance/raid/${r.id}`)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-[var(--surface-elevated)] cursor-pointer text-[var(--foreground)]"
                  >
                    <div className="flex items-center gap-2">
                      <Warning className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold">{r.code}</span>
                      <span className="truncate max-w-xs">{r.title}</span>
                    </div>
                    <span className="text-[10px] font-bold text-red-500">{r.severity}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* People */}
            {people.length > 0 && (
              <Command.Group heading={<span className="px-2 font-semibold text-[var(--muted)] uppercase text-[10px]">People</span>}>
                {people.slice(0, 4).map((u) => (
                  <Command.Item
                    key={u.id}
                    value={`${u.name} ${u.title}`}
                    onSelect={() => navigateTo(`/resources/people?search=${encodeURIComponent(u.name)}`)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-[var(--surface-elevated)] cursor-pointer text-[var(--foreground)]"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[var(--primary)]" />
                      <span className="font-medium">{u.name}</span>
                      <span className="text-[10px] text-[var(--muted)]">({u.title})</span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className="px-4 py-2 border-t border-[var(--surface-border)] bg-[var(--surface-elevated)]/50 flex items-center justify-between text-[11px] text-[var(--muted)]">
            <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
            <span>Organisation: {organisationId === "org-meridian" ? "Meridian" : "Northwind"}</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
