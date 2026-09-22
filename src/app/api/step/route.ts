import { askJev, choice, noul } from '@/lib/jev.server';
import { currentLayer } from '@/lib/plan';
import { pick } from '@/lib/policy';
import { checkStep, RateLimited } from '@/lib/ratelimit.server';
import { stepQuestions, stepState } from '@/lib/prompts';
import { sign, verify } from '@/lib/sign.server';
import { MAX_STEPS, type ModifierId, type SetupPicks, type SizeId, type StepRequest, type StepResponse, type WeightId } from '@/lib/types';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<StepRequest> | null;
  if (!body?.session || !body.setup || !body.step) return Response.json({ error: 'bad step request' }, { status: 400 });

  // The session and the picks must be the ones this server signed at setup.
  const picks: SetupPicks = { palette: body.setup.palette, style: body.setup.style, layout: body.setup.layout, field: body.setup.field };
  if (!verify({ kind: 'setup', session: body.session, picks }, body.setupSig)) return Response.json({ error: 'this painting session is not valid' }, { status: 403 });

  const session = body.session;
  const step = Math.round(Number(body.step));
  const history = Array.isArray(body.history) ? body.history : [];
  if (step < 1 || step > Math.min(session.steps, MAX_STEPS) || step !== history.length + 1) return Response.json({ error: 'step out of sequence' }, { status: 400 });
  try {
    await checkStep(request);
  } catch (err) {
    if (err instanceof RateLimited) return Response.json({ error: err.message }, { status: 429 });
    throw err;
  }

  const req: StepRequest = {
    session,
    setup: picks,
    setupSig: body.setupSig!,
    step,
    canvas: body.canvas ?? {},
    history,
    prompt: session.prompt,
    steps: session.steps,
    policy: session.policy,
  };

  const state = stepState(req);
  const questions = stepQuestions(req);
  try {
    const { answers, inputTokens, ms } = await askJev(state, questions);
    const q = (id: string) => choice(answers, id);
    const probabilities = Object.fromEntries(['motif', 'region', 'size', 'brush', 'color', 'modifier', 'weight'].map((id) => [id, q(id).probabilities]));
    const decision = {
      motif: pick(probabilities.motif, req.policy),
      region: pick(probabilities.region, req.policy),
      size: pick(probabilities.size, req.policy) as SizeId,
      brush: pick(probabilities.brush, req.policy),
      color: pick(probabilities.color, req.policy),
      modifier: pick(probabilities.modifier, req.policy) as ModifierId,
      weight: pick(probabilities.weight, req.policy) as WeightId,
    };
    const layer = currentLayer(req.setup.layout, req.steps, req.step).layer;
    const out: StepResponse = {
      decision,
      layer,
      probabilities,
      finished: noul(answers, 'finished'),
      ms,
      inputTokens,
      sig: sign({ kind: 'step', session: session.id, step, layer, decision }),
      prompt: { state, questions },
    };
    return Response.json(out);
  } catch (err) {
    console.error('[step]', err);
    return Response.json({ error: (err as Error).message ?? 'Jev request failed' }, { status: 502 });
  }
}
