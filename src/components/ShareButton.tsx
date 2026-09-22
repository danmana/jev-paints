'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';

interface Props {
  id: string;
  /** overlay: white icon on top of an image. button: the pill next to the like button. */
  variant: 'overlay' | 'button';
}

/** Copies the painting's link. No system share sheet: a copied link works the same everywhere. */
export default function ShareButton({ id, variant }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const share = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/p/${id}`;
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
    <button type="button" className={`share ${variant} ${copied ? 'copied' : ''}`} onClick={share} aria-label="Copy a link to this painting">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 14a4 4 0 0 1 0-5.7l2.3-2.3a4 4 0 0 1 5.7 5.7l-1.1 1.1" />
        <path d="M14 10a4 4 0 0 1 0 5.7l-2.3 2.3a4 4 0 0 1-5.7-5.7l1.1-1.1" />
      </svg>
      {variant === 'button' && <span>{copied ? 'Link copied' : 'Copy link'}</span>}
      {variant === 'overlay' && copied && <span className="share-toast">Link copied</span>}
    </button>
  );
}
