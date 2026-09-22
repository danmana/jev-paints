import { likePainting } from '@/lib/store';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const likes = await likePainting(id);
    return Response.json({ likes });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return Response.json({ error: e.message ?? 'failed' }, { status: e.status ?? 500 });
  }
}
