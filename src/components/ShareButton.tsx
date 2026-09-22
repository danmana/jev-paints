'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';

interface Props {
  id: string;
  prompt: string;
  /** overlay: white icon on top of an image. button: the pill next to the like button. */
  variant: 'overlay' | 'button';
}

/** Shares the painting's page: the system share sheet where there is one, otherwise the link is copied. */
export default function ShareButton({ id, prompt, variant }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const share = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/p/${id}`;
    const title = `Jev painted “${prompt}”`;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        // fall through to the clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy this link', url);
    }
  };

  return (
    <button type="button" className={`share ${variant} ${copied ? 'copied' : ''}`} onClick={share} aria-label="Share this painting">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12" />
        <path d="M7.5 7.5 12 3l4.5 4.5" />
        <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
      </svg>
      {variant === 'button' && <span>{copied ? 'Link copied' : 'Share'}</span>}
      {variant === 'overlay' && copied && <span className="share-toast">Link copied</span>}
    </button>
  );
}
