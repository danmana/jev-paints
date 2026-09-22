'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const path = usePathname();
  return (
    <nav>
      {path !== '/' && (
        <Link href="/" className="nav-paint">
          Start painting
        </Link>
      )}
      <Link href="/gallery">Gallery</Link>
      <Link href="/how-it-works">How it works</Link>
      <a href="https://typesafe.ai" target="_blank" rel="noreferrer">
        Jev, by TypeSafe
      </a>
    </nav>
  );
}
