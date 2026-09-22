import { loadImage } from '@/lib/store';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const image = await loadImage(id).catch(() => null);
  if (!image) return new Response('not found', { status: 404 });
  if (image.url) return Response.redirect(image.url, 302);
  return new Response(new Uint8Array(image.png!), { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=31536000, immutable' } });
}
