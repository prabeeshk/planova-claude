import React from "react";
import { Sparkle, Info } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface SimulatedAIIndicatorProps {
  sourceEvidence?: string[];
  whyShown?: string;
  className?: string;
  compact?: boolean;
}

export function SimulatedAIIndicator({
  sourceEvidence,
  whyShown,
  className,
  compact = false,
}: SimulatedAIIndicatorProps) {
  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20",
          className
        )}
        title="Simulated AI demonstration response based on deterministic demo fixtures. No ML model inference was run."
      >
        <Sparkle weight="fill" className="w-3 h-3 text-purple-500" />
        <span>Demo insight / Simulated AI</span>
      </span>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-xs space-y-1.5",
        className
      )}
    >
      <div className="flex items-center gap-1.5 font-medium text-purple-700 dark:text-purple-300">
        <Sparkle weight="fill" className="w-3.5 h-3.5 text-purple-500" />
        <span>Demo insight / Simulated AI</span>
      </div>
      {whyShown && (
        <p className="text-[11px] text-[var(--muted)]">
          <strong className="text-[var(--foreground)] font-medium">Why you are seeing this: </strong>
          {whyShown}
        </p>
      )}
      {sourceEvidence && sourceEvidence.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] text-[var(--muted)]">Traceable sources:</span>
          {sourceEvidence.map((ev, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--surface-border)] text-[11px] text-[var(--foreground)]"
            >
              <Info className="w-3 h-3 text-[var(--primary)]" />
              {ev}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
