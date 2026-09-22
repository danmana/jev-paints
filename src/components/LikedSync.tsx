'use client';

import { useEffect } from 'react';
import { syncLiked } from '@/lib/likes';
import { userHeaders } from '@/lib/user';

/** Asks the server which of the paintings on this page the current user has liked, once per page load. */
export default function LikedSync({ ids }: { ids: string[] }) {
  const key = ids.join(',');
  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    fetch(`/api/likes?ids=${encodeURIComponent(key)}`, { headers: userHeaders(), signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { liked?: string[] } | null) => {
        if (data?.liked) syncLiked(key.split(','), data.liked);
      })
      .catch(() => {
        // offline or aborted: local storage stays as it was
      });
    return () => controller.abort();
  }, [key]);
  return null;
}
