import type { Metadata } from 'next';
import Link from 'next/link';
import LikeButton from '@/components/LikeButton';
import ShareButton from '@/components/ShareButton';
import { PALETTE_BY_ID } from '@/lib/palettes';
import { listPaintings } from '@/lib/store';
import { STYLE_BY_ID } from '@/lib/styles';
import { imageUrl } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Gallery', description: 'Everything Jev has painted so far.' };

export default async function GalleryPage() {
  const paintings = await listPaintings();
  return (
    <main className="page">
      <h1 className="title">Everything Jev has painted</h1>
      {!paintings.length && (
        <p className="empty">
          The walls are bare. <Link href="/">Ask Jev to paint something.</Link>
        </p>
      )}
      <div className="gallery">
        {paintings.map((p) => (
          <Link key={p.id} href={`/p/${p.id}`} className="tile">
            <div className="tile-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(p)} alt={p.prompt} loading="lazy" />
              <LikeButton id={p.id} likes={p.likes} variant="overlay" />
              <ShareButton id={p.id} variant="overlay" />
            </div>
            <div className="tile-text">
              <p className="tile-prompt">{p.prompt}</p>
              <div className="tile-meta">
                After {STYLE_BY_ID[p.style]?.name ?? p.style}, {PALETTE_BY_ID[p.palette]?.name ?? p.palette} palette
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
