"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useSessionStore } from "@/stores/useSessionStore";
import { toast } from "sonner";
import { Warning, ArrowClockwise, Lightning } from "@phosphor-icons/react";

interface DevToolsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DevToolsModal({ open, onOpenChange }: DevToolsModalProps) {
  const { faultConfig, setFaultConfig, resetAllSeedData } = useSessionStore();

  const handleReset = () => {
    resetAllSeedData();
    toast.success("Demo fixtures reset to factory seed. Reloading...");
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Developer Tools & Fault Injection"
      description="Simulate realistic enterprise edge cases: optimistic concurrency conflicts, permission denials, latency spikes, and server errors."
      maxWidth="md"
    >
      <div className="space-y-5 text-xs">
        {/* Error Injection */}
        <div className="space-y-2">
          <label className="font-semibold text-[var(--foreground)] block">
            Inject Deterministic HTTP Error
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Normal (200 OK)", value: null },
              { label: "403 Forbidden", value: 403 },
              { label: "404 Not Found", value: 404 },
              { label: "409 Conflict", value: 409 },
              { label: "422 Validation", value: 422 },
              { label: "500 Server Error", value: 500 },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  setFaultConfig({ forceErrorStatus: opt.value });
                  toast.info(opt.value ? `Injected Status ${opt.value}` : "Cleared error injection");
                }}
                className={`py-2 px-3 rounded-xl border text-center transition-all ${
                  faultConfig.forceErrorStatus === opt.value
                    ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] font-semibold shadow-xs"
                    : "border-[var(--surface-border)] bg-[var(--surface-elevated)] text-[var(--foreground)] hover:border-gray-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Latency Simulator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-[var(--foreground)]">
              Simulate Network Transport Latency (120ms – 320ms)
            </label>
            <input
              type="checkbox"
              checked={faultConfig.simulateLatency}
              onChange={(e) => setFaultConfig({ simulateLatency: e.target.checked })}
              className="w-4 h-4 rounded text-[var(--primary)] cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-[var(--muted)]">
            When enabled, mock repository methods simulate realistic WAN delay, loading skeletons, and optimistic mutations.
          </p>
        </div>

        {/* Optimistic Concurrency */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-[var(--foreground)]">
              Simulate 409 on rowVersion Mismatch
            </label>
            <input
              type="checkbox"
              checked={faultConfig.simulateConflictOnVersionMismatch}
              onChange={(e) => setFaultConfig({ simulateConflictOnVersionMismatch: e.target.checked })}
              className="w-4 h-4 rounded text-[var(--primary)] cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-[var(--muted)]">
            Simulates mid-air edit collisions when updating a stale task or baseline version.
          </p>
        </div>

        {/* Seed Reset */}
        <div className="pt-3 border-t border-[var(--surface-border)] flex items-center justify-between">
          <div>
            <div className="font-semibold text-[var(--foreground)]">Reset Demo Data</div>
            <div className="text-[11px] text-[var(--muted)]">
              Restores all projects, tasks, RAID, and changes to factory seed.
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-red-600 dark:text-red-400">
            <ArrowClockwise className="w-3.5 h-3.5" />
            <span>Reset Fixtures</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
