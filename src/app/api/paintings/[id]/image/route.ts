import { loadImage } from '@/lib/store';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const png = await loadImage(id).catch(() => null);
  if (!png) return new Response('not found', { status: 404 });
  return new Response(new Uint8Array(png), { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=31536000, immutable' } });
}
