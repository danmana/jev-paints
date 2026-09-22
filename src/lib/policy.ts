import type { Policy } from './types';

/** Turns one Choice distribution into one pick, without touching what Jev was asked. */
export function pick(probabilities: Record<string, number>, policy: Policy, random: () => number = Math.random): string {
  const keys = Object.keys(probabilities);
  if (!keys.length) throw new Error('empty distribution');
  if (policy === 'sample') {
    const total = keys.reduce((a, k) => a + probabilities[k], 0);
    if (total > 0) {
      let r = random() * total;
      for (const k of keys) {
        r -= probabilities[k];
        if (r <= 0) return k;
      }
      return keys[keys.length - 1];
    }
  }
  return keys.reduce((best, k) => (probabilities[k] > probabilities[best] ? k : best), keys[0]);
}
