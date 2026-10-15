import type { LocalDate } from "@/lib/domain/types";

/**
 * Demo reference date. All fixtures are anchored here so due-soon / overdue
 * indicators are deterministic. Configurable via NEXT_PUBLIC_DEMO_TODAY.
 */
export const DEMO_TODAY: LocalDate = process.env.NEXT_PUBLIC_DEMO_TODAY ?? "2026-10-14";

/** Fixed "now" timestamp used for generated metadata (keeps tests stable). */
export const DEMO_NOW_ISO = `${DEMO_TODAY}T09:30:00.000Z`;

const DAY_MS = 86_400_000;

export function parseLocal(date: LocalDate): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toLocal(date: Date): LocalDate {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return toLocal(new Date(parseLocal(date).getTime() + days * DAY_MS));
}

/** Offset relative to DEMO_TODAY. */
export function rel(days: number): LocalDate {
  return addDays(DEMO_TODAY, days);
}

export function relIso(days: number, hour = 9, minute = 0): string {
  const d = parseLocal(rel(days));
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function daysBetween(a: LocalDate, b: LocalDate): number {
  return Math.round((parseLocal(b).getTime() - parseLocal(a).getTime()) / DAY_MS);
}

export function daysFromToday(date: LocalDate): number {
  return daysBetween(DEMO_TODAY, date);
}

export function isOverdue(due: LocalDate, done = false): boolean {
  return !done && daysFromToday(due) < 0;
}

export function isDueSoon(due: LocalDate, withinDays = 7, done = false): boolean {
  const d = daysFromToday(due);
  return !done && d >= 0 && d <= withinDays;
}

/** Monday of the week containing date. */
export function weekStart(date: LocalDate): LocalDate {
  const d = parseLocal(date);
  const day = d.getUTCDay(); // 0 Sun
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(date, diff);
}

export function eachWeek(start: LocalDate, count: number): LocalDate[] {
  const first = weekStart(start);
  return Array.from({ length: count }, (_, i) => addDays(first, i * 7));
}

export function eachDay(start: LocalDate, count: number): LocalDate[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

export function rangesOverlap(aStart: LocalDate, aEnd: LocalDate, bStart: LocalDate, bEnd: LocalDate): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function isWeekend(date: LocalDate): boolean {
  const day = parseLocal(date).getUTCDay();
  return day === 0 || day === 6;
}

export function monthKey(date: LocalDate): string {
  return date.slice(0, 7);
}
