import { loadPainting } from '@/lib/store';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const painting = await loadPainting(id).catch(() => null);
  if (!painting) return Response.json({ error: 'not found' }, { status: 404 });
  return Response.json(painting);
}
