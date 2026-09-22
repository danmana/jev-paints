import type { Metadata } from 'next';
import Link from 'next/link';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Jev Paints',
  description: 'Tell Jev what to paint and watch it happen, one gesture at a time.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <header className="top">
          <Link href="/" className="brand">
            Jev <em>Paints</em>
          </Link>
          <nav>
            <Link href="/gallery">Gallery</Link>
            <Link href="/how-it-works">How it works</Link>
            <a href="https://typesafe.ai" target="_blank" rel="noreferrer">
              Jev by TypeSafe
            </a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
