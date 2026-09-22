import { askJev, choice, noul } from '@/lib/jev.server';
import { pick } from '@/lib/policy';
import { setupQuestions, setupState } from '@/lib/prompts';
import { newSeed, newSessionId, sign } from '@/lib/sign.server';
import { MAX_STEPS, type FieldId, type Policy, type Session, type SetupPicks, type SetupResponse } from '@/lib/types';

/** Only clearly offensive requests are blocked; the paintings are too loose to need more. */
const BLOCK_THRESHOLD = 0.85;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { prompt?: string; policy?: Policy; steps?: number } | null;
  const prompt = body?.prompt?.trim();
  if (!prompt || prompt.length > 300) return Response.json({ error: 'prompt must be 1 to 300 characters' }, { status: 400 });
  const policy: Policy = body?.policy === 'argmax' ? 'argmax' : 'sample';
  const steps = Math.min(MAX_STEPS, Math.max(10, Math.round(Number(body?.steps) || 50)));

  const state = setupState(prompt);
  const questions = setupQuestions();
  try {
    const { answers, inputTokens, ms } = await askJev(state, questions);
    const moderation = { sexual: noul(answers, 'sexual'), hate: noul(answers, 'hate'), gore: noul(answers, 'gore') };
    const blocked = Object.values(moderation).some((v) => v >= BLOCK_THRESHOLD);
    const palette = choice(answers, 'palette');
    const style = choice(answers, 'style');
    const layout = choice(answers, 'layout');
    const field = choice(answers, 'field');
    const picks: SetupPicks = {
      palette: pick(palette.probabilities, policy),
      style: pick(style.probabilities, policy),
      layout: pick(layout.probabilities, policy),
      field: pick(field.probabilities, policy) as FieldId,
    };
    // The server decides the session id and the seed, and signs them together with the picks.
    const session: Session = { id: newSessionId(), seed: newSeed(), prompt, steps, policy };
    const out: SetupResponse = {
      blocked,
      moderation,
      ...picks,
      probabilities: { palette: palette.probabilities, style: style.probabilities, layout: layout.probabilities, field: field.probabilities },
      ms,
      inputTokens,
      session,
      sig: sign({ kind: 'setup', session, picks }),
      prompt: { state, questions },
    };
    return Response.json(out);
  } catch (err) {
    console.error('[setup]', err);
    return Response.json({ error: (err as Error).message ?? 'Jev request failed' }, { status: 502 });
  }
}
