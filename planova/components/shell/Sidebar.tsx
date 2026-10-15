"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSessionStore, useCurrentSession } from "@/stores/useSessionStore";
import { evaluate } from "@/lib/access/permissions";
import {
  House,
  Briefcase,
  FolderSimple,
  Flag,
  Pulse,
  Lightbulb,
  SquaresFour,
  ShieldCheck,
  Users,
  Coins,
  CalendarCheck,
  RocketLaunch,
  CheckSquareOffset,
  ChartBar,
  GearSix,
  Bell,
  Sliders,
  Sparkle,
} from "@phosphor-icons/react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission?: any;
  badge?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const session = useCurrentSession();
  const toggleCopilot = useSessionStore((s) => s.toggleCopilot);

  const groups: NavGroup[] = [
    {
      group: "Core",
      items: [
        { label: "Home", href: "/home", icon: <House className="w-4 h-4" /> },
        { label: "Needs Attention", href: "/pulse", icon: <Pulse className="w-4 h-4" />, badge: "Pulse" },
      ],
    },
    {
      group: "Workspace",
      items: [
        { label: "My Work", href: "/work", icon: <Briefcase className="w-4 h-4" /> },
        { label: "Projects", href: "/projects", icon: <FolderSimple className="w-4 h-4" /> },
        { label: "Milestones", href: "/milestones", icon: <Flag className="w-4 h-4" /> },
        { label: "Intelligence", href: "/insights", icon: <Lightbulb className="w-4 h-4" /> },
      ],
    },
    {
      group: "Enterprise",
      items: [
        { label: "Portfolio", href: "/portfolio", icon: <SquaresFour className="w-4 h-4" />, permission: "portfolio.view" },
        { label: "Governance & RAID", href: "/governance", icon: <ShieldCheck className="w-4 h-4" />, permission: "governance.view" },
        { label: "Resources", href: "/resources", icon: <Users className="w-4 h-4" />, permission: "resource.view" },
        { label: "Financials", href: "/financials", icon: <Coins className="w-4 h-4" />, permission: "budget.view" },
        { label: "Workforce", href: "/workforce", icon: <CalendarCheck className="w-4 h-4" /> },
        { label: "Releases", href: "/releases", icon: <RocketLaunch className="w-4 h-4" />, permission: "release.view" },
      ],
    },
    {
      group: "Management",
      items: [
        { label: "Decisions & Approvals", href: "/approvals", icon: <CheckSquareOffset className="w-4 h-4" />, permission: "approval.view", badge: "1" },
        { label: "Reports", href: "/reports", icon: <ChartBar className="w-4 h-4" />, permission: "report.run" },
        { label: "Administration", href: "/administration", icon: <GearSix className="w-4 h-4" />, permission: "user.manage" },
      ],
    },
    {
      group: "Personal",
      items: [
        { label: "Notifications", href: "/notifications", icon: <Bell className="w-4 h-4" /> },
        { label: "Settings", href: "/settings", icon: <Sliders className="w-4 h-4" /> },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col w-64 bg-[var(--surface)] border-r border-[var(--surface-border)] shrink-0 select-none h-screen sticky top-0",
        className
      )}
    >
      {/* Brand logo & tagline */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--surface-border)]">
        <Link href="/home" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6558E8] to-[#4F46E5] flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
            P
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-[var(--foreground)] flex items-center gap-1.5">
              <span>PLANOVA</span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded-md bg-[var(--primary-soft)] text-[var(--primary)]">
                Enterprise
              </span>
            </div>
            <div className="text-[10px] text-[var(--muted)] font-medium leading-none">
              Plan smarter. Deliver together.
            </div>
          </div>
        </Link>
      </div>

      {/* Nav list */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {groups.map((grp) => {
          // Filter items based on active role capabilities
          const visibleItems = grp.items.filter((item) => {
            if (!item.permission) return true;
            return evaluate(session.roleCode, item.permission).allowed;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={grp.group} className="space-y-1">
              <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                {grp.group}
              </div>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group",
                        isActive
                          ? "bg-[var(--primary-soft)] text-[var(--primary)] font-semibold"
                          : "text-[var(--foreground)] hover:bg-[var(--surface-elevated)] text-opacity-80"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "transition-colors",
                            isActive ? "text-[var(--primary)]" : "text-[var(--muted)] group-hover:text-[var(--foreground)]"
                          )}
                        >
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                            isActive
                              ? "bg-[var(--primary)] text-white"
                              : "bg-[var(--surface-elevated)] text-[var(--muted)] border border-[var(--surface-border)]"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Copilot quick launch banner */}
      <div className="p-3 border-t border-[var(--surface-border)] bg-[var(--surface-elevated)]/50">
        <button
          type="button"
          onClick={toggleCopilot}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 text-xs font-medium text-purple-700 dark:text-purple-300 hover:border-purple-500/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkle weight="fill" className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>PLANOVA Copilot</span>
          </div>
          <span className="text-[10px] font-semibold bg-purple-600 text-white px-1.5 py-0.5 rounded-md">
            Demo
          </span>
        </button>
      </div>
    </aside>
  );
}
