"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  House,
  Briefcase,
  FolderSimple,
  Pulse,
  DotsThreeOutline,
  ShieldCheck,
  CheckSquareOffset,
  Users,
  Coins,
  RocketLaunch,
  ChartBar,
  GearSix,
  X,
  Sparkle,
} from "@phosphor-icons/react";
import { useSessionStore } from "@/stores/useSessionStore";

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const toggleCopilot = useSessionStore((s) => s.toggleCopilot);

  const mainTabs = [
    { label: "Home", href: "/home", icon: <House className="w-5 h-5" /> },
    { label: "Work", href: "/work", icon: <Briefcase className="w-5 h-5" /> },
    { label: "Projects", href: "/projects", icon: <FolderSimple className="w-5 h-5" /> },
    { label: "Pulse", href: "/pulse", icon: <Pulse className="w-5 h-5" /> },
  ];

  const moreItems = [
    { label: "Governance & RAID", href: "/governance", icon: <ShieldCheck className="w-5 h-5" /> },
    { label: "Approvals", href: "/approvals", icon: <CheckSquareOffset className="w-5 h-5" /> },
    { label: "Resources", href: "/resources", icon: <Users className="w-5 h-5" /> },
    { label: "Financials", href: "/financials", icon: <Coins className="w-5 h-5" /> },
    { label: "Releases", href: "/releases", icon: <RocketLaunch className="w-5 h-5" /> },
    { label: "Reports", href: "/reports", icon: <ChartBar className="w-5 h-5" /> },
    { label: "Administration", href: "/administration", icon: <GearSix className="w-5 h-5" /> },
  ];

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--surface-border)] px-2 py-1.5 flex items-center justify-around safe-bottom"
        aria-label="Mobile Bottom Navigation"
      >
        {mainTabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== "/home" && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-medium transition-colors",
                isActive ? "text-[var(--primary)] font-bold" : "text-[var(--muted)]"
              )}
            >
              <span>{tab.icon}</span>
              <span className="mt-0.5">{tab.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreOpen(!moreOpen)}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-medium transition-colors",
            moreOpen ? "text-[var(--primary)] font-bold" : "text-[var(--muted)]"
          )}
        >
          <DotsThreeOutline className="w-5 h-5" weight={moreOpen ? "fill" : "regular"} />
          <span className="mt-0.5">More</span>
        </button>
      </nav>

      {/* More Drawer */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-[var(--surface)] rounded-t-3xl p-5 border-t border-[var(--surface-border)] max-h-[80vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--surface-border)]">
              <span className="font-bold text-sm text-[var(--foreground)]">Enterprise Navigation</span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-[var(--surface-elevated)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                toggleCopilot();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 text-xs font-semibold text-purple-700 dark:text-purple-300"
            >
              <div className="flex items-center gap-2">
                <Sparkle weight="fill" className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Open PLANOVA Copilot</span>
              </div>
              <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-md">
                Simulated AI
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-elevated)] text-xs font-medium text-[var(--foreground)] hover:border-[var(--primary)]"
                >
                  <span className="text-[var(--primary)]">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
