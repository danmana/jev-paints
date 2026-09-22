import { likedBy } from '@/lib/store';
import { userFrom } from '@/lib/user.server';

/** GET /api/likes?ids=a,b,c → { liked: [...] } for the anonymous user in the x-jev-user header. */
export async function GET(request: Request) {
  const user = userFrom(request);
  if (!user) return Response.json({ liked: [] });
  const ids = (new URL(request.url).searchParams.get('ids') ?? '')
    .split(',')
    .filter((id) => /^[a-zA-Z0-9_-]{4,64}$/.test(id))
    .slice(0, 500);
  return Response.json({ liked: [...(await likedBy(user, ids))] });
}
