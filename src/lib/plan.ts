import { LAYOUT_BY_ID } from './layouts';
import type { PxBox } from './motifs';
import type { Layout, Region } from './types';

export const GRID = 5;
export const COLS = ['A', 'B', 'C', 'D', 'E'];

export function cellIds(): string[] {
  const ids: string[] = [];
  for (let row = 1; row <= GRID; row++) for (const col of COLS) ids.push(`${col}${row}`);
  return ids;
}

function cellWords(col: number, row: number): string {
  const h = ['far left', 'left', 'centre', 'right', 'far right'][col];
  const v = ['top', 'upper', 'middle', 'lower', 'bottom'][row];
  return `${v} ${h}`;
}

/** Every place Jev can choose: the layout's named regions, then the 25 grid cells. */
export function regionChoiceCriteria(layout: Layout): Record<string, string> {
  const out: Record<string, string> = {};
  for (const reg of layout.regions) out[reg.id] = `${reg.name}: ${reg.description}`;
  for (let row = 0; row < GRID; row++)
    for (let col = 0; col < GRID; col++) out[`${COLS[col]}${row + 1}`] = `grid cell ${COLS[col]}${row + 1}: ${cellWords(col, row)} of the canvas`;
  return out;
}

export function regionBox(layout: Layout, regionId: string, canvas: number): PxBox {
  const reg: Region | undefined = layout.regions.find((x) => x.id === regionId);
  if (reg) {
    const [x0, y0, x1, y1] = reg.box;
    return { x: x0 * canvas, y: y0 * canvas, w: (x1 - x0) * canvas, h: (y1 - y0) * canvas };
  }
  const m = /^([A-E])([1-5])$/.exec(regionId);
  if (m) {
    const col = COLS.indexOf(m[1]);
    const row = Number(m[2]) - 1;
    const s = canvas / GRID;
    return { x: col * s, y: row * s, w: s, h: s };
  }
  return { x: 0, y: 0, w: canvas, h: canvas };
}

export function regionLabel(layout: Layout, regionId: string): string {
  return layout.regions.find((x) => x.id === regionId)?.name ?? `cell ${regionId}`;
}

export interface PhasePlan {
  layer: string;
  description: string;
  from: number;
  to: number;
  status: 'done' | 'current' | 'upcoming';
}

/** Splits the step budget across the layout's phases and marks where `step` (1-based) falls. */
export function planFor(layoutId: string, steps: number, step: number): PhasePlan[] {
  const layout = LAYOUT_BY_ID[layoutId] ?? LAYOUT_BY_ID.centered_subject;
  const counts = layout.phases.map((p) => Math.max(1, Math.round(p.share * steps)));
  let total = counts.reduce((a, b) => a + b, 0);
  // Fix rounding so the counts add up to the requested number of steps.
  let i = counts.length - 1;
  while (total !== steps) {
    const d = total > steps ? -1 : 1;
    if (counts[i] + d >= 1) {
      counts[i] += d;
      total += d;
    }
    i = (i - 1 + counts.length) % counts.length;
  }
  const out: PhasePlan[] = [];
  let from = 1;
  for (let k = 0; k < layout.phases.length; k++) {
    const to = from + counts[k] - 1;
    out.push({
      layer: layout.phases[k].layer,
      description: layout.phases[k].description,
      from,
      to,
      status: step > to ? 'done' : step >= from ? 'current' : 'upcoming',
    });
    from = to + 1;
  }
  return out;
}

export function currentLayer(layoutId: string, steps: number, step: number): PhasePlan {
  const plan = planFor(layoutId, steps, step);
  return plan.find((p) => p.status === 'current') ?? plan[plan.length - 1];
}
