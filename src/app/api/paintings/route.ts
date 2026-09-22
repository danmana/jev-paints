import { checkCanvasImage } from '@/lib/images.server';
import { verify } from '@/lib/sign.server';
import { userFrom } from '@/lib/user.server';
import { listPaintings, newId, savePainting } from '@/lib/store';
import { MAX_STEPS, type Painting, type SaveRequest, type SetupPicks } from '@/lib/types';

export async function GET() {
  return Response.json(await listPaintings());
}

function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

/**
 * Saves a finished painting. The browser sends back what the server signed at setup and at every
 * step; anything it could have changed is rejected. Only the pixels themselves are taken on trust.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<SaveRequest> | null;
  if (!body?.session || !body.setup || !body.setupSig || !Array.isArray(body.steps) || !body.image) return bad('session, setup, steps and image are required');

  const { session, setup, steps } = body;
  const picks: SetupPicks = { palette: setup.palette, style: setup.style, layout: setup.layout, field: setup.field };
  if (!verify({ kind: 'setup', session, picks }, body.setupSig)) return bad('this painting session is not valid', 403);
  if (setup.blocked) return bad('blocked paintings cannot be saved', 403);
  if (steps.length < 1 || steps.length > Math.min(session.steps, MAX_STEPS)) return bad('wrong number of steps');
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (s.step !== i + 1) return bad(`step ${i + 1} is out of sequence`);
    if (!verify({ kind: 'step', session: session.id, step: s.step, layer: s.layer, decision: s.decision }, s.sig)) return bad(`step ${s.step} was not issued by this server`, 403);
  }

  const image = Buffer.from(body.image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  try {
    await checkCanvasImage(image);
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return bad(e.message ?? 'bad image', e.status ?? 400);
  }

  const painting: Painting = {
    id: newId(),
    createdAt: new Date().toISOString(),
    prompt: session.prompt,
    settings: { steps: session.steps, policy: session.policy, seed: session.seed },
    setup: { ...setup, ...picks },
    steps,
    likes: 0,
    totalMs: Math.max(0, Math.round(Number(body.totalMs) || 0)),
    totalTokens: setup.inputTokens + steps.reduce((a, s) => a + (s.inputTokens || 0), 0),
  };
  const stored = await savePainting(painting, image, userFrom(request));
  return Response.json({ id: stored.id, image: stored.image ?? null });
}
