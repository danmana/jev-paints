/** Which paintings this browser has liked. Local only: there are no accounts. */
const KEY = 'jev-paints-liked';

export function likedIds(): Set<string> {
  try {
    const raw = window.localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function setLiked(id: string, liked: boolean): void {
  try {
    const ids = likedIds();
    if (liked) ids.add(id);
    else ids.delete(id);
    window.localStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch {
    // storage blocked: the heart still works for this page view
  }
}
