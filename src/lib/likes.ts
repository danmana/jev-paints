/** Which paintings this browser has liked: a fast local hint, corrected by the server on each page. */
const KEY = 'jev-paints-liked';
export const LIKES_SYNCED = 'jev-likes-synced';

export function likedIds(): Set<string> {
  try {
    const raw = window.localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function write(ids: Set<string>) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch {
    // storage blocked: the heart still works for this page view
  }
}

export function setLiked(id: string, liked: boolean): void {
  const ids = likedIds();
  if (liked) ids.add(id);
  else ids.delete(id);
  write(ids);
  window.dispatchEvent(new Event(LIKES_SYNCED));
}

/** Replaces the local answer for `ids` with the server's, then tells mounted hearts to re-read. */
export function syncLiked(ids: string[], likedOnServer: string[]): void {
  const current = likedIds();
  for (const id of ids) current.delete(id);
  for (const id of likedOnServer) current.add(id);
  write(current);
  window.dispatchEvent(new Event(LIKES_SYNCED));
}
