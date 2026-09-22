/**
 * Anonymous identity: a random UUID minted the first time the browser opens the site and kept in
 * local storage. It is a bearer token sent as a header to the server; it is never shown on a page.
 */
const KEY = 'jev-paints-user';
export const USER_HEADER = 'x-jev-user';

export function userId(): string {
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing && isUuid(existing)) return existing;
    const fresh = crypto.randomUUID();
    window.localStorage.setItem(KEY, fresh);
    return fresh;
  } catch {
    // Storage blocked: a per-page-load identity is the best we can do.
    return crypto.randomUUID();
  }
}

export function isUuid(s: unknown): s is string {
  return typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

export function userHeaders(): Record<string, string> {
  return { [USER_HEADER]: userId() };
}
