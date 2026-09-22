import { SIZE_VALUE, WEIGHT_VALUE } from './brushes';
import { LAYOUT_BY_ID } from './layouts';
import { generateOps, MOTIF_BY_ID } from './motifs';
import { PALETTE_BY_ID } from './palettes';
import { regionBox } from './plan';
import { makeRng } from './rng';
import type { FieldId, Gesture, ModifierId, StepDecision } from './types';
import { CANVAS_SIZE } from './types';

const FILL_OPACITY: Record<ModifierId, number> = { stroke: 0, fill: 190, fill_and_stroke: 175, bleed: 150, wash: 100, hatch: 0 };
const BLEED: Record<ModifierId, number> = { stroke: 0, fill: 0.08, fill_and_stroke: 0.08, bleed: 0.55, wash: 0.15, hatch: 0 };

/**
 * Turns Jev's seven picks into concrete geometry. The rng is seeded from the painting seed and the
 * step, so a saved painting replays to the same strokes.
 */
export function buildGesture(decision: StepDecision, layoutId: string, paletteId: string, field: FieldId, seed: number, step: number): Gesture {
  const layout = LAYOUT_BY_ID[layoutId] ?? LAYOUT_BY_ID.centered_subject;
  const palette = PALETTE_BY_ID[paletteId] ?? PALETTE_BY_ID.monochrome_ink;
  const rng = makeRng((seed ^ (step * 2654435761)) >>> 0);
  const region = regionBox(layout, decision.region, CANVAS_SIZE);
  const motif = MOTIF_BY_ID[decision.motif] ?? MOTIF_BY_ID.blob;
  const color = palette.colors.find((c) => c.id === decision.color) ?? palette.colors[0];
  const ops = generateOps(motif.id, rng, region, SIZE_VALUE[decision.size] ?? 0.65, CANVAS_SIZE);
  const weight = WEIGHT_VALUE[decision.weight] ?? 1;
  return {
    ops,
    style: {
      brush: decision.brush,
      color: color.hex,
      weight,
      modifier: decision.modifier,
      kind: motif.kind,
      field,
      fillOpacity: FILL_OPACITY[decision.modifier] ?? 150,
      bleed: BLEED[decision.modifier] ?? 0,
      hatchDist: decision.weight === 'fine' ? 4 : decision.weight === 'bold' ? 11 : 7,
      hatchAngle: rng.pick([30, 45, 60, 120, 135, 150]),
    },
  };
}
