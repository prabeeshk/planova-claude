import React from "react";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { MobileNav } from "@/components/shell/MobileNav";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { CopilotDrawer } from "@/components/shell/CopilotDrawer";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 pb-16 md:pb-8">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Global Overlays */}
      <CommandPalette />
      <CopilotDrawer />
    </div>
  );
}
