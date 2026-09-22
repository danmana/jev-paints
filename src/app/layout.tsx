import type { Metadata } from 'next';
import Link from 'next/link';
import { Cormorant_Garamond, Figtree } from 'next/font/google';
import Nav from '@/components/Nav';
import './globals.css';

const serif = Cormorant_Garamond({ variable: '--font-serif', subsets: ['latin'], weight: ['300', '400', '500'], style: ['normal', 'italic'] });
const sans = Figtree({ variable: '--font-sans', subsets: ['latin'], weight: ['400', '500'] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jev-paints.vercel.app';
const DESCRIPTION = 'Tell Jev what to paint and watch it happen, one gesture at a time. A tiny AI that only answers questions with probabilities, turned into a painter.';
/** The default preview: the painting the How it works page dissects. */
const DEFAULT_IMAGE = 'https://jct43odyrpkvhc9l.public.blob.vercel-storage.com/paintings/20260922152557-i18ii.png';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Jev Paints', template: '%s · Jev Paints' },
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: 'Jev Paints',
    title: 'Jev Paints',
    description: DESCRIPTION,
    images: [{ url: DEFAULT_IMAGE, width: 1200, height: 1200, alt: 'Mont Blanc sunset, painted by Jev' }],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@danmana',
    title: 'Jev Paints',
    description: DESCRIPTION,
    images: [DEFAULT_IMAGE],
  },
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
          <Nav />
        </header>
        {children}
        <footer className="foot">
          Made by{' '}
          <a href="https://x.com/danmana" target="_blank" rel="noreferrer">
            @danmana
          </a>
          , painted by Jev.
        </footer>
      </body>
    </html>
  );
}
