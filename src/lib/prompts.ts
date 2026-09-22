/**
 * Everything Jev is told lives here, so the "How it works" page can show the exact state and
 * questions. State describes the situation; questions list every option. Nothing here tells
 * Jev how to paint.
 */
import { BRUSHES, FIELDS, MODIFIERS, SIZES, WEIGHTS } from './brushes';
import { LAYOUT_BY_ID, layoutChoiceCriteria } from './layouts';
import { KIND_WORD, MOTIF_BY_ID, motifChoiceCriteria } from './motifs';
import { describeColor, describePaper, PALETTE_BY_ID, paletteChoiceCriteria } from './palettes';
import { planFor, regionChoiceCriteria, regionLabel } from './plan';
import { STYLE_BY_ID, styleChoiceCriteria } from './styles';
import type { StepRequest } from './types';

export interface NoulQ {
  type: 'noul';
  instructions: string;
  criteria?: { true: string; false: string };
}
export interface ChoiceQ {
  type: 'choice';
  instructions: string;
  criteria: Record<string, string>;
}
export type Question = NoulQ | ChoiceQ;

const CANVAS_DESCRIPTION =
  'A 600 by 600 pixel square painted with digital brushes: pencils, pens, markers, pastels, charcoal, spray and watercolour-like fills. The result is artistic and loose, not photorealistic.';

export function setupState(prompt: string) {
  return { request: prompt, canvas: CANVAS_DESCRIPTION };
}

export function setupQuestions(): Record<string, Question> {
  return {
    sexual: {
      type: 'noul',
      instructions: 'Does the request ask for sexually explicit or pornographic imagery, or any sexual content involving minors?',
      criteria: { true: 'Yes, it asks for explicit sexual content.', false: 'No; at most mild nudity or nothing sexual at all.' },
    },
    hate: {
      type: 'noul',
      instructions: 'Does the request express or ask for hateful, harassing or dehumanising content aimed at a person or a group of people?',
      criteria: { true: 'Yes, it is hateful or harassing.', false: 'No, it is not hateful.' },
    },
    gore: {
      type: 'noul',
      instructions: 'Does the request ask for graphic gore, torture or glorified real-world violence against people?',
      criteria: { true: 'Yes, graphic violence or gore is the point of it.', false: 'No; at most dramatic or fantasy action.' },
    },
    palette: {
      type: 'choice',
      instructions: 'Which colour palette suits this painting best?',
      criteria: paletteChoiceCriteria(),
    },
    style: {
      type: 'choice',
      instructions: 'Which painter or art movement should this painting take after?',
      criteria: styleChoiceCriteria(),
    },
    layout: {
      type: 'choice',
      instructions: 'Which composition fits this painting best?',
      criteria: layoutChoiceCriteria(),
    },
    field: {
      type: 'choice',
      instructions: 'What character should the brush strokes have throughout this painting?',
      criteria: { ...FIELDS },
    },
  };
}

export function stepState(req: StepRequest) {
  const layout = LAYOUT_BY_ID[req.setup.layout] ?? LAYOUT_BY_ID.centered_subject;
  const palette = PALETTE_BY_ID[req.setup.palette] ?? PALETTE_BY_ID.monochrome_ink;
  const style = STYLE_BY_ID[req.setup.style] ?? STYLE_BY_ID.impressionism;
  const plan = planFor(layout.id, req.steps, req.step);
  const current = plan.find((p) => p.status === 'current') ?? plan[plan.length - 1];

  const recent = req.history.slice(-12).map((h) => ({
    step: h.step,
    plan_phase: h.layer,
    gesture: `${MOTIF_BY_ID[h.decision.motif]?.name ?? h.decision.motif} (${KIND_WORD[MOTIF_BY_ID[h.decision.motif]?.kind ?? 'lines']})`,
    where: regionLabel(layout, h.decision.region),
    size: h.decision.size,
    medium: h.decision.brush,
    colour: palette.colors.find((c) => c.id === h.decision.color)?.name ?? h.decision.color,
    applied_as: MOTIF_BY_ID[h.decision.motif]?.kind === 'lines' ? 'plain strokes' : h.decision.modifier.replace('_and_', ' and '),
    weight: h.decision.weight,
  }));
  const earlier = req.history.slice(0, -12);
  const earlierSummary = earlier.length
    ? summarise(earlier.map((h) => [regionLabel(layout, h.decision.region), palette.colors.find((c) => c.id === h.decision.color)?.name ?? h.decision.color]))
    : undefined;

  return {
    request: req.prompt,
    canvas: CANVAS_DESCRIPTION,
    style: { name: style.name, looks_like: style.description },
    palette: { name: palette.name, mood: palette.mood, paper: describePaper(palette), colours: palette.colors.map(describeColor) },
    gesture_kinds: 'A gesture is either lines or a solid shape. Lines are always drawn as plain strokes in the chosen medium and colour. Solid shapes are painted with the chosen fill style.',
    stroke_character: FIELDS[req.setup.field],
    composition: {
      name: layout.name,
      description: layout.description,
      regions: Object.fromEntries(layout.regions.map((r) => [r.name, r.description])),
    },
    progress: { step: req.step, of: req.steps, percent_done: Math.round(((req.step - 1) / req.steps) * 100) },
    plan: {
      phases: plan.map((p) => ({ phase: p.layer, what: p.description, steps: `${p.from}-${p.to}`, status: p.status })),
      now: { phase: current.layer, what: current.description },
    },
    canvas_now: {
      how_to_read: 'The canvas is divided into a 5 by 5 grid. Columns A to E run left to right, rows 1 to 5 run top to bottom. Each cell says what colour covers it so far.',
      cells: req.canvas,
    },
    gestures_so_far: recent.length ? recent : 'Nothing has been painted yet; the paper is blank.',
    ...(earlierSummary ? { earlier_gestures_not_listed: earlierSummary } : {}),
  };
}

function summarise(pairs: Array<[string, string]>): string {
  const byRegion = new Map<string, number>();
  const byColour = new Map<string, number>();
  for (const [reg, col] of pairs) {
    byRegion.set(reg, (byRegion.get(reg) ?? 0) + 1);
    byColour.set(col, (byColour.get(col) ?? 0) + 1);
  }
  const fmt = (m: Map<string, number>) =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${v} in ${k}`)
      .join(', ');
  return `${pairs.length} earlier gestures: ${fmt(byRegion)}; colours: ${fmt(byColour).replace(/ in /g, ' ')}.`;
}

export function stepQuestions(req: StepRequest): Record<string, Question> {
  const layout = LAYOUT_BY_ID[req.setup.layout] ?? LAYOUT_BY_ID.centered_subject;
  const palette = PALETTE_BY_ID[req.setup.palette] ?? PALETTE_BY_ID.monochrome_ink;
  const style = STYLE_BY_ID[req.setup.style] ?? STYLE_BY_ID.impressionism;
  const plan = planFor(layout.id, req.steps, req.step);
  const current = plan.find((p) => p.status === 'current') ?? plan[plan.length - 1];
  const lead = `You are painting "${req.prompt}" in the manner of ${style.name} with the ${palette.name} palette. This is step ${req.step} of ${req.steps}; the plan is now on "${current.layer}".`;

  return {
    motif: { type: 'choice', instructions: `${lead} Which gesture do you paint next?`, criteria: motifChoiceCriteria() },
    region: { type: 'choice', instructions: `${lead} Where on the canvas does the next gesture go?`, criteria: regionChoiceCriteria(layout) },
    size: { type: 'choice', instructions: `${lead} How big is the next gesture within its place?`, criteria: { ...SIZES } },
    brush: { type: 'choice', instructions: `${lead} Which medium do you paint the next gesture with?`, criteria: { ...BRUSHES } },
    color: {
      type: 'choice',
      instructions: `${lead} Which colour from the palette is the next gesture?`,
      criteria: Object.fromEntries(palette.colors.map((c) => [c.id, `${describeColor(c)}, on ${describePaper(palette)} paper`])),
    },
    modifier: {
      type: 'choice',
      instructions: `${lead} If the next gesture is a solid shape, how is it painted? (Line gestures are always plain strokes, whatever is chosen here.)`,
      criteria: { ...MODIFIERS },
    },
    weight: { type: 'choice', instructions: `${lead} How heavy are the marks of the next gesture?`, criteria: { ...WEIGHTS } },
    finished: {
      type: 'noul',
      instructions: `${lead} Looking at the canvas as it is right now, is the painting already finished?`,
      criteria: { true: 'It is finished; more paint would not improve it.', false: 'It still needs more work.' },
    },
  };
}
