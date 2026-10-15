import type {
  BaseRecord,
  BudgetLine,
  BudgetVersion,
  CostCategory,
  DimensionHealth,
  Health,
  HealthDimension,
  ID,
  Money,
  Priority,
  Task,
  TaskStatus,
} from "@/lib/domain/types";
import { fromMinor, toMinor } from "@/lib/domain/money";
import { addDays, DEMO_TODAY, monthKey, parseLocal, rel, relIso } from "./clock";

export function base(orgId: ID, id: ID, createdDaysAgo = -150, by: ID = "system"): BaseRecord {
  return {
    id,
    organisationId: orgId,
    rowVersion: 1,
    createdAt: relIso(createdDaysAgo, 8),
    createdBy: by,
    updatedAt: relIso(Math.min(createdDaysAgo + 30, -1), 10),
    updatedBy: by,
    deletedAt: null,
  };
}

export const STATUS_CODES: Record<string, TaskStatus> = {
  N: "Not Started",
  P: "In Progress",
  B: "Blocked",
  C: "Completed",
  X: "Cancelled",
};

export const PRIORITY_CODES: Record<string, Priority> = { L: "Low", M: "Medium", H: "High", "!": "Critical" };

/** Compact authoring tuple: title, status, priority, assignee, startOffset, dueOffset, estimateHours, extra */
export type TaskTuple = [string, keyof typeof STATUS_CODES, keyof typeof PRIORITY_CODES, string, number, number, number, string?];

export function buildTasks(
  orgId: ID,
  projectId: ID,
  projectCode: string,
  userPrefix: string,
  tuples: TaskTuple[],
  managerId: ID,
): Task[] {
  return tuples.map(([title, s, p, assignee, start, due, est, blocked], idx) => {
    const status = STATUS_CODES[s];
    const done = status === "Completed";
    const progress = done ? 100 : status === "In Progress" ? 25 + ((idx * 17) % 55) : status === "Blocked" ? 40 : 0;
    const checklistDone = done ? 3 : status === "In Progress" ? 1 : 0;
    return {
      ...base(orgId, `${projectId}-t${idx + 1}`, start - 7, managerId),
      projectId,
      parentTaskId: null,
      milestoneId: null,
      code: `${projectCode}-${101 + idx}`,
      title,
      description: describe(title),
      status,
      priority: PRIORITY_CODES[p],
      assigneeId: `${userPrefix}${assignee}`,
      startDate: rel(start),
      dueDate: rel(due),
      progress,
      estimateHours: est,
      order: idx,
      checklist: [
        { id: `${projectId}-t${idx + 1}-c1`, label: "Scope and acceptance criteria agreed", done: checklistDone >= 1 },
        { id: `${projectId}-t${idx + 1}-c2`, label: "Peer review completed", done: checklistDone >= 2 },
        { id: `${projectId}-t${idx + 1}-c3`, label: "Evidence attached for sign-off", done: checklistDone >= 3 },
      ],
      completedAt: done ? relIso(Math.min(due, -1), 16) : null,
      completedBy: done ? `${userPrefix}${assignee}` : null,
      blockedReason: status === "Blocked" ? blocked : undefined,
    };
  });
}

function describe(title: string): string {
  return `${title}. Deliverable is reviewed in the weekly delivery stand-up; acceptance requires the checklist to be complete and evidence linked to this task.`;
}

export function dims(
  schedule: [Health, string],
  cost: [Health, string],
  scope: [Health, string],
  resource: [Health, string],
): Record<HealthDimension, DimensionHealth> {
  return {
    schedule: { health: schedule[0], rationale: schedule[1] },
    cost: { health: cost[0], rationale: cost[1] },
    scope: { health: scope[0], rationale: scope[1] },
    resource: { health: resource[0], rationale: resource[1] },
  };
}

export const CATEGORY_SPLIT: [CostCategory, number][] = [
  ["Labour", 55],
  ["Software", 15],
  ["Hardware", 5],
  ["Vendors", 15],
  ["Travel", 2],
  ["Contingency", 8],
];

/** List of YYYY-MM month keys from start to end inclusive. */
export function monthsBetween(start: string, end: string): string[] {
  const s = parseLocal(start);
  const e = parseLocal(end);
  const out: string[] = [];
  const d = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), 1));
  while (d <= e) {
    out.push(d.toISOString().slice(0, 7));
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out.length ? out : [monthKey(start)];
}

/** Split an integer minor amount into n parts with the remainder on the last part. Sums are exact. */
export function splitMinor(total: bigint, parts: number): bigint[] {
  if (parts <= 0) return [];
  const each = total / BigInt(parts);
  const arr = Array.from({ length: parts }, () => each);
  arr[parts - 1] += total - each * BigInt(parts);
  return arr;
}

export function buildBudgetLines(prefix: string, total: string, months: string[]): BudgetLine[] {
  const totalMinor = toMinor(total);
  const lines: BudgetLine[] = [];
  let allocated = 0n;
  CATEGORY_SPLIT.forEach(([category, pct], ci) => {
    const catMinor = ci === CATEGORY_SPLIT.length - 1 ? totalMinor - allocated : (totalMinor * BigInt(pct)) / 100n;
    allocated += catMinor;
    splitMinor(catMinor, months.length).forEach((amt, mi) => {
      lines.push({ id: `${prefix}-${category.toLowerCase()}-${months[mi]}`, category, period: months[mi], amount: fromMinor(amt) });
    });
  });
  return lines;
}

export function budgetVersion(
  prefix: string,
  version: number,
  status: BudgetVersion["status"],
  total: string,
  currency: string,
  months: string[],
  submittedDaysAgo: number | null,
  approvalId: ID | null,
  note: string,
): BudgetVersion {
  return {
    id: `${prefix}-v${version}`,
    version,
    status,
    total: { amount: toMinorString(total), currencyCode: currency },
    lines: buildBudgetLines(`${prefix}-v${version}`, total, months),
    submittedAt: submittedDaysAgo === null ? null : relIso(submittedDaysAgo, 11),
    approvedAt: status === "Approved" || status === "Superseded" ? relIso((submittedDaysAgo ?? -30) + 4, 15) : null,
    approvalId,
    note,
  };
}

function toMinorString(amount: string) {
  return fromMinor(toMinor(amount));
}

export function m(amount: string | number, currencyCode: string): Money {
  return { amount: typeof amount === "number" ? amount.toFixed(2) : toMinorString(amount), currencyCode };
}

export function pastMonths(startDate: string): string[] {
  const end = addDays(DEMO_TODAY, -1);
  return monthsBetween(startDate, end);
}
