"use client";

import React, { useState } from "react";
import { buildMatrix, PROBABILITY_LABELS, IMPACT_LABELS, severityFromScore } from "@/lib/domain/risk";
import type { RaidItem } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

interface RiskMatrixProps {
  items: RaidItem[];
  onSelectCell?: (probability: number, impact: number) => void;
  className?: string;
}

export function RiskMatrix({ items, onSelectCell, className }: RiskMatrixProps) {
  const [selected, setSelected] = useState<{ p: number; i: number } | null>(null);
  const matrix = buildMatrix();

  // Count items per cell
  const counts: Record<string, number> = {};
  items.forEach((item) => {
    const key = `${item.probability}-${item.impact}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  const getCellBg = (score: number) => {
    const sev = severityFromScore(score);
    switch (sev) {
      case "Critical":
        return "bg-red-500/20 hover:bg-red-500/30 text-red-700 dark:text-red-300 border-red-500/30";
      case "High":
        return "bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border-amber-500/30";
      case "Medium":
        return "bg-blue-500/15 hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 border-blue-500/25";
      case "Low":
      default:
        return "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span className="font-medium text-[var(--foreground)]">5×5 Risk Matrix Heatmap</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500/60" /> Critical (≥15)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/60" /> High (≥10)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500/60" /> Medium (≥5)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/60" /> Low
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-1.5 text-center text-xs">
        {/* Header row: Impact */}
        <div className="flex items-center justify-center font-medium text-[var(--muted)] text-[11px]">
          Prob \ Impact
        </div>
        {IMPACT_LABELS.map((lbl, idx) => (
          <div key={idx} className="font-medium text-[var(--muted)] py-1 truncate text-[11px]" title={lbl}>
            {idx + 1} · {lbl}
          </div>
        ))}

        {/* Matrix rows */}
        {matrix.map((row, rowIdx) => {
          const p = 5 - rowIdx;
          const pLabel = PROBABILITY_LABELS[p - 1];
          return (
            <React.Fragment key={p}>
              <div
                className="flex items-center justify-start text-left font-medium text-[var(--muted)] text-[11px] pr-2 truncate"
                title={pLabel}
              >
                {p} · {pLabel}
              </div>
              {row.map((cell) => {
                const count = counts[`${cell.probability}-${cell.impact}`] || 0;
                const isSelected = selected?.p === cell.probability && selected?.i === cell.impact;

                return (
                  <button
                    key={`${cell.probability}-${cell.impact}`}
                    type="button"
                    onClick={() => {
                      setSelected({ p: cell.probability, i: cell.impact });
                      onSelectCell?.(cell.probability, cell.impact);
                    }}
                    className={cn(
                      "h-12 rounded-xl border flex flex-col items-center justify-center transition-all p-1",
                      getCellBg(cell.score),
                      isSelected && "ring-2 ring-[var(--primary)] shadow-md"
                    )}
                    aria-label={`Probability ${cell.probability}, Impact ${cell.impact}: ${count} items`}
                  >
                    <span className="text-xs font-semibold">{cell.score}</span>
                    {count > 0 && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--surface)] text-[var(--foreground)] shadow-xs">
                        {count} item{count > 1 ? "s" : ""}
                      </span>
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
