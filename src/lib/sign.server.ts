import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Every answer the server hands the browser is signed, so a saved painting can only contain
 * what Jev really returned through these routes. The secret never leaves the server.
 */
function secret(): string {
  const s = process.env.PAINT_SIGNING_SECRET;
  if (s) return s;
  // Local dev without the secret still works; the signatures are just not portable.
  const fallback = process.env.TYPESAFE_AI_API_KEY;
  if (!fallback) throw new Error('PAINT_SIGNING_SECRET is not set');
  return `dev:${fallback}`;
}

/** Stable JSON: keys sorted, so the same object always signs the same way. */
export function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`)
    .join(',')}}`;
}

export function sign(payload: unknown): string {
  return createHmac('sha256', secret()).update(canonical(payload)).digest('base64url');
}

export function verify(payload: unknown, sig: string | undefined): boolean {
  if (!sig) return false;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function newSessionId(): string {
  return randomBytes(12).toString('base64url');
}

export function newSeed(): number {
  return randomBytes(4).readUInt32BE(0) >>> 1;
}
