import type { Severity } from "./types";

/**
 * Seeded 5×5 policy risk matrix (demo assumption, see docs/assumptions.md).
 * Score = probability × impact; severity is looked up from the matrix cell,
 * not typed in by users.
 */
export const RISK_MATRIX_POLICY = {
  id: "matrix-std-5x5",
  name: "Enterprise standard 5×5",
  version: "2026.1",
  thresholds: { critical: 15, high: 10, medium: 5 },
  /** Critical items require simulated approval to close. */
  criticalClosureNeedsApproval: true,
} as const;

export const PROBABILITY_LABELS = ["Rare", "Unlikely", "Possible", "Likely", "Almost certain"] as const;
export const IMPACT_LABELS = ["Minimal", "Minor", "Moderate", "Major", "Severe"] as const;

export function riskScore(probability: number, impact: number): number {
  const p = clamp(Math.round(probability), 1, 5);
  const i = clamp(Math.round(impact), 1, 5);
  return p * i;
}

export function severityFromScore(score: number): Severity {
  const t = RISK_MATRIX_POLICY.thresholds;
  if (score >= t.critical) return "Critical";
  if (score >= t.high) return "High";
  if (score >= t.medium) return "Medium";
  return "Low";
}

export function deriveRisk(probability: number, impact: number) {
  const score = riskScore(probability, impact);
  return { score, severity: severityFromScore(score) };
}

export interface MatrixCell {
  probability: number;
  impact: number;
  score: number;
  severity: Severity;
}

/** Rows from probability 5 (top) to 1 (bottom) for display. */
export function buildMatrix(): MatrixCell[][] {
  const rows: MatrixCell[][] = [];
  for (let p = 5; p >= 1; p--) {
    const row: MatrixCell[] = [];
    for (let i = 1; i <= 5; i++) {
      const score = p * i;
      row.push({ probability: p, impact: i, score, severity: severityFromScore(score) });
    }
    rows.push(row);
  }
  return rows;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
