/**
 * Currency-safe arithmetic on decimal string amounts.
 * Works in integer minor units (2 dp) via BigInt to avoid float drift.
 */
import type { Money } from "@/lib/domain/types";

export function toMinor(amount: string): bigint {
  const negative = amount.trim().startsWith("-");
  const clean = amount.replace(/[^0-9.]/g, "");
  const [whole = "0", frac = ""] = clean.split(".");
  const minor = BigInt(whole || "0") * 100n + BigInt((frac + "00").slice(0, 2));
  return negative ? -minor : minor;
}

export function fromMinor(minor: bigint): string {
  const negative = minor < 0n;
  const abs = negative ? -minor : minor;
  const whole = abs / 100n;
  const frac = (abs % 100n).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${whole}.${frac}`;
}

export function money(amount: string | number, currencyCode: string): Money {
  return { amount: typeof amount === "number" ? amount.toFixed(2) : amount, currencyCode };
}

export function sumMoney(values: Money[], currencyCode: string): Money {
  let total = 0n;
  for (const v of values) {
    if (v.currencyCode !== currencyCode) {
      throw new Error(`Currency mismatch: expected ${currencyCode}, received ${v.currencyCode}`);
    }
    total += toMinor(v.amount);
  }
  return { amount: fromMinor(total), currencyCode };
}

export function subtractMoney(a: Money, b: Money): Money {
  if (a.currencyCode !== b.currencyCode) throw new Error("Currency mismatch");
  return { amount: fromMinor(toMinor(a.amount) - toMinor(b.amount)), currencyCode: a.currencyCode };
}

export function moneyToNumber(m: Money): number {
  return Number(toMinor(m.amount)) / 100;
}

export function percentOf(part: Money, whole: Money): number {
  const w = toMinor(whole.amount);
  if (w === 0n) return 0;
  return Number((toMinor(part.amount) * 10000n) / w) / 100;
}
