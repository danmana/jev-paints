import { setLike } from '@/lib/store';
import { userFrom } from '@/lib/user.server';

/** Body { liked: boolean }. The anonymous user id comes from the x-jev-user header; one like per user and painting. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = userFrom(req);
  if (!user) return Response.json({ error: 'missing user id' }, { status: 400 });
  const body = (await req.json().catch(() => null)) as { liked?: boolean } | null;
  try {
    return Response.json(await setLike(id, user, body?.liked !== false));
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return Response.json({ error: e.message ?? 'failed' }, { status: e.status ?? 500 });
  }
}
