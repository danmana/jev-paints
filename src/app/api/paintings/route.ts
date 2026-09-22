import { listPaintings, newId, savePainting } from '@/lib/store';
import type { Painting } from '@/lib/types';

export async function GET() {
  return Response.json(await listPaintings());
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { painting?: Omit<Painting, 'id' | 'createdAt' | 'likes'>; png?: string } | null;
  if (!body?.painting || !body.png) return Response.json({ error: 'painting and png are required' }, { status: 400 });
  const png = body.png.replace(/^data:image\/png;base64,/, '');
  if (png.length > 12_000_000) return Response.json({ error: 'image too large' }, { status: 413 });
  const painting: Painting = { ...body.painting, id: newId(), createdAt: new Date().toISOString(), likes: 0 };
  const stored = await savePainting(painting, png);
  return Response.json({ id: stored.id, image: stored.image ?? null });
}
