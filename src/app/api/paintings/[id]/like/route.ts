import { likePainting } from '@/lib/store';

/** Body { liked: boolean }: true adds a like, false takes one back. No body counts as a like. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { liked?: boolean } | null;
  try {
    const likes = await likePainting(id, body?.liked === false ? -1 : 1);
    return Response.json({ likes });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return Response.json({ error: e.message ?? 'failed' }, { status: e.status ?? 500 });
  }
}
