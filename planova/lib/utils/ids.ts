/** Deterministic, non-cryptographic FNV-1a hash used for demo version references. */
export function shortHash(input: unknown): string {
  const str = typeof input === "string" ? input : JSON.stringify(input);
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

let counter = 0;
/** Unique-enough client ID for records created during a demo session. */
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}`;
}

export function correlationId(): string {
  return `corr-${Math.random().toString(36).slice(2, 10)}`;
}
