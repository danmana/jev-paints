import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PaintingView from '@/components/PaintingView';
import { PALETTE_BY_ID } from '@/lib/palettes';
import { loadPainting } from '@/lib/store';
import { STYLE_BY_ID } from '@/lib/styles';
import { imageUrl } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const painting = await loadPainting(id).catch(() => null);
  if (!painting) return { title: 'Painting not found' };
  const style = STYLE_BY_ID[painting.setup.style]?.name ?? painting.setup.style;
  const palette = PALETTE_BY_ID[painting.setup.palette]?.name ?? painting.setup.palette;
  const title = `“${painting.prompt}”`;
  const description = `Jev painted this after ${style} with the ${palette} palette, in ${painting.steps.length} gestures. Watch it again or paint your own.`;
  const image = imageUrl(painting);
  return {
    title,
    description,
    openGraph: { type: 'article', title: `${title} · Jev Paints`, description, images: [{ url: image, width: 1200, height: 1200, alt: painting.prompt }] },
    twitter: { card: 'summary_large_image', title: `${title} · Jev Paints`, description, images: [image] },
  };
}

export default async function PaintingPage({ params }: Props) {
  const { id } = await params;
  const painting = await loadPainting(id).catch(() => null);
  if (!painting) notFound();
  return (
    <main className="page">
      <PaintingView painting={painting} />
    </main>
  );
}
