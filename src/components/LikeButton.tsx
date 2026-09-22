'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { likedIds, setLiked } from '@/lib/likes';

interface Props {
  id: string;
  likes: number;
  /** overlay: white heart on top of an image. button: the pill on the painting page. */
  variant: 'overlay' | 'button';
}

export default function LikeButton({ id, likes: initial, variant }: Props) {
  const [likes, setLikes] = useState(initial);
  const [liked, setLikedState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Read after mount: localStorage is not available on the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLikedState(likedIds().has(id));
    setReady(true);
  }, [id]);

  const toggle = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!ready) return;
    const next = !liked;
    setLikedState(next);
    setLiked(id, next);
    setLikes((n) => Math.max(0, n + (next ? 1 : -1)));
    try {
      const res = await fetch(`/api/paintings/${id}/like`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ liked: next }) });
      const data = (await res.json()) as { likes?: number };
      if (typeof data.likes === 'number') setLikes(data.likes);
    } catch {
      // the optimistic count stands
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
