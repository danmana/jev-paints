import Link from 'next/link';
import { PALETTE_BY_ID } from '@/lib/palettes';
import { listPaintings } from '@/lib/store';
import { STYLE_BY_ID } from '@/lib/styles';

export const dynamic = 'force-dynamic';

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/paintings/${p.id}/image`} alt={p.prompt} loading="lazy" />
            <div className="tile-text">
              <p className="tile-prompt">{p.prompt}</p>
              <div className="tile-meta">
                After {STYLE_BY_ID[p.style]?.name ?? p.style}, {PALETTE_BY_ID[p.palette]?.name ?? p.palette} palette
                {p.likes ? `, ♥ ${p.likes}` : ''}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
