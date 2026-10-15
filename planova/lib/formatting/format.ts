import { format, parseISO } from "date-fns";
import type { Money, LocalDate, ISODateTime } from "@/lib/domain/types";

export function formatMoney(money: Money | null | undefined, locale = "en-US"): string {
  if (!money) return "—";
  const num = Number(money.amount);
  if (isNaN(num)) return `${money.currencyCode} ${money.amount}`;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: money.currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${money.currencyCode} ${num.toLocaleString(locale)}`;
  }
}

export function formatCompactMoney(money: Money | null | undefined, locale = "en-US"): string {
  if (!money) return "—";
  const num = Number(money.amount);
  if (isNaN(num)) return `${money.currencyCode} ${money.amount}`;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: money.currencyCode,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(num);
  } catch {
    return `${money.currencyCode} ${num.toLocaleString(locale)}`;
  }
}

export function formatDate(date: LocalDate | ISODateTime | null | undefined, fmt = "MMM d, yyyy"): string {
  if (!date) return "—";
  try {
    const d = date.includes("T") ? parseISO(date) : new Date(`${date}T00:00:00Z`);
    return format(d, fmt);
  } catch {
    return String(date);
  }
}

export function formatDateTime(iso: ISODateTime | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "MMM d, yyyy h:mm a");
  } catch {
    return String(iso);
  }
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatHours(hours: number): string {
  return `${hours} hrs`;
}
