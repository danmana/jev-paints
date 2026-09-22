import 'server-only';
import { db, hasDb } from './db.server';

/**
 * Two layers of fixed-window limits, both stored in Postgres. Per IP stops one abusive client;
 * the global caps put a hard ceiling on Jev spend whatever the traffic looks like. Likes and the
 * gallery are never limited. Without a database (local dev) everything is allowed.
 */
export const LIMITS = {
  ipSetupPerHour: 200,
  ipStepsPerHour: 5000,
  globalStepsPerHour: 30_000,
  globalStepsPerDay: 100_000,
};

const HOUR = '1 hour';
const DAY = '1 day';

export function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  const ip = (fwd ? fwd.split(',')[0] : request.headers.get('x-real-ip')) ?? 'unknown';
  return ip.trim() || 'unknown';
}

async function hit(key: string, limit: number, window: string): Promise<boolean> {
  const { data, error } = await db().rpc('hit_rate_limit', { p_key: key, p_limit: limit, p_window: window });
  if (error) {
    console.error('[ratelimit]', error.message);
    return true; // a broken limiter must not take the site down
  }
  return data !== false;
}

async function count(key: string, window: string): Promise<number> {
  const { data } = await db().rpc('rate_limit_count', { p_key: key, p_window: window });
  return typeof data === 'number' ? data : 0;
}

export class RateLimited extends Error {
  status = 429;
}

/** Called once per new painting. Refuses when this IP started too many, or when the global step budget is nearly spent. */
export async function checkSetup(request: Request): Promise<void> {
  if (!hasDb()) return;
  const ip = clientIp(request);
  if (!(await hit(`ip:${ip}:setup`, LIMITS.ipSetupPerHour, HOUR))) throw new RateLimited('Too many paintings started from your network this hour. Try again a bit later.');
  const [hour, day] = await Promise.all([count('global:steps:hour', HOUR), count('global:steps:day', DAY)]);
  if (hour >= LIMITS.globalStepsPerHour * 0.9 || day >= LIMITS.globalStepsPerDay * 0.9) throw new RateLimited('Jev is taking a break: the whole site has painted a lot in the last while. Try again later.');
}

/** Called once per gesture. The global caps are a hard ceiling; paintings already running only stop when they are truly exhausted. */
export async function checkStep(request: Request): Promise<void> {
  if (!hasDb()) return;
  const ip = clientIp(request);
  const [ipOk, hourOk, dayOk] = await Promise.all([
    hit(`ip:${ip}:step`, LIMITS.ipStepsPerHour, HOUR),
    hit('global:steps:hour', LIMITS.globalStepsPerHour, HOUR),
    hit('global:steps:day', LIMITS.globalStepsPerDay, DAY),
  ]);
  if (!ipOk) throw new RateLimited('Too many gestures from your network this hour. Try again a bit later.');
  if (!hourOk || !dayOk) throw new RateLimited('Jev is taking a break: the whole site has painted a lot today. Try again later.');
}
