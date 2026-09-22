'use client';

import { useState, useSyncExternalStore, type MouseEvent } from 'react';
import { LIKES_SYNCED, likedIds, setLiked } from '@/lib/likes';
import { userHeaders } from '@/lib/user';

interface Props {
  id: string;
  likes: number;
  /** overlay: white heart on top of an image. button: the pill on the painting page. */
  variant: 'overlay' | 'button';
}

function subscribe(onChange: () => void) {
  window.addEventListener(LIKES_SYNCED, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(LIKES_SYNCED, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/**
 * Local storage answers "did I like this?" instantly (and on the server render the answer is no);
 * the server is the truth, one like per anonymous user and painting, and its answer wins.
 */
export default function LikeButton({ id, likes: initial, variant }: Props) {
  const [likes, setLikes] = useState(initial);
  const liked = useSyncExternalStore(
    subscribe,
    () => likedIds().has(id),
    () => false,
  );

  const toggle = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !liked;
    setLiked(id, next);
    setLikes((n) => Math.max(0, n + (next ? 1 : -1)));
    try {
      const res = await fetch(`/api/paintings/${id}/like`, { method: 'POST', headers: { 'content-type': 'application/json', ...userHeaders() }, body: JSON.stringify({ liked: next }) });
      const data = (await res.json()) as { liked?: boolean; likes?: number };
      if (typeof data.likes === 'number') setLikes(data.likes);
      if (typeof data.liked === 'boolean') setLiked(id, data.liked);
    } catch {
      // the optimistic state stands until the next sync
    }
  };

  return (
    <button type="button" className={`like ${variant} ${liked ? 'liked' : ''}`} onClick={toggle} aria-pressed={liked} aria-label={liked ? 'Unlike this painting' : 'Like this painting'}>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M12 21s-7.2-4.6-9.6-9A5.6 5.6 0 0 1 12 6.3 5.6 5.6 0 0 1 21.6 12c-2.4 4.4-9.6 9-9.6 9z" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      <span className="like-count">{likes}</span>
    </button>
  );
}
