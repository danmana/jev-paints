import type { Metadata } from 'next';
import Link from 'next/link';
import { Cormorant_Garamond, Figtree } from 'next/font/google';
import './globals.css';

const serif = Cormorant_Garamond({ variable: '--font-serif', subsets: ['latin'], weight: ['300', '400', '500'], style: ['normal', 'italic'] });
const sans = Figtree({ variable: '--font-sans', subsets: ['latin'], weight: ['400', '500'] });

export const metadata: Metadata = {
  title: 'Jev Paints',
  description: 'Tell Jev what to paint and watch it happen, one gesture at a time.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <div className="wash" aria-hidden="true" />
        <header className="top">
          <Link href="/" className="brand">
            Jev Paints
          </Link>
          <nav>
            <Link href="/gallery">Gallery</Link>
            <Link href="/how-it-works">How it works</Link>
            <a href="https://typesafe.ai" target="_blank" rel="noreferrer">
              Jev, by TypeSafe
            </a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
