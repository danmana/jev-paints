import { askJev, choice, noul } from '@/lib/jev.server';
import { currentLayer } from '@/lib/plan';
import { pick } from '@/lib/policy';
import { stepQuestions, stepState } from '@/lib/prompts';
import type { ModifierId, SizeId, StepRequest, StepResponse, WeightId } from '@/lib/types';

export async function POST(request: Request) {
  const req = (await request.json().catch(() => null)) as StepRequest | null;
  if (!req?.prompt || !req.setup || !req.step || !req.steps) return Response.json({ error: 'bad step request' }, { status: 400 });
  req.history ??= [];
  req.canvas ??= {};

  const state = stepState(req);
  const questions = stepQuestions(req);
  try {
    const { answers, inputTokens, ms } = await askJev(state, questions);
    const q = (id: string) => choice(answers, id);
    const probabilities = Object.fromEntries(['motif', 'region', 'size', 'brush', 'color', 'modifier', 'weight'].map((id) => [id, q(id).probabilities]));
    const out: StepResponse = {
      decision: {
        motif: pick(probabilities.motif, req.policy),
        region: pick(probabilities.region, req.policy),
        size: pick(probabilities.size, req.policy) as SizeId,
        brush: pick(probabilities.brush, req.policy),
        color: pick(probabilities.color, req.policy),
        modifier: pick(probabilities.modifier, req.policy) as ModifierId,
        weight: pick(probabilities.weight, req.policy) as WeightId,
      },
      layer: currentLayer(req.setup.layout, req.steps, req.step).layer,
      probabilities,
      finished: noul(answers, 'finished'),
      ms,
      inputTokens,
      prompt: { state, questions },
    };
    return Response.json(out);
  } catch (err) {
    console.error('[step]', err);
    return Response.json({ error: (err as Error).message ?? 'Jev request failed' }, { status: 502 });
  }
}
