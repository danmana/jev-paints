import { COLS, GRID } from './plan';
import type { Palette } from './types';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** How different a sampled pixel must be from the paper before it counts as painted. */
const PAINT_THRESHOLD = 40;

export interface CellStats {
  coverage: number;
  colors: Array<{ id: string; name: string; share: number }>;
}

/**
 * Reads a 5 by 5 coverage grid off the pixel buffer: how much of each cell is painted and with which
 * palette colours (nearest colour wins). This is the "image to text" step, done in code, no model.
 */
export function computeGrid(pixels: ArrayLike<number>, width: number, height: number, palette: Palette): Record<string, CellStats> {
  const paper = hexToRgb(palette.paper);
  const swatches = palette.colors.map((c) => ({ id: c.id, name: c.name, rgb: hexToRgb(c.hex) }));
  const cellW = width / GRID;
  const cellH = height / GRID;
  const stride = Math.max(2, Math.round(Math.min(cellW, cellH) / 24));
  const out: Record<string, CellStats> = {};

  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      let sampled = 0;
      let painted = 0;
      const counts = new Map<string, number>();
      const x0 = Math.floor(col * cellW);
      const y0 = Math.floor(row * cellH);
      const x1 = Math.floor((col + 1) * cellW);
      const y1 = Math.floor((row + 1) * cellH);
      for (let y = y0; y < y1; y += stride) {
        for (let x = x0; x < x1; x += stride) {
          const i = (y * width + x) * 4;
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          sampled++;
          const dPaper = Math.hypot(r - paper[0], g - paper[1], b - paper[2]);
          if (dPaper < PAINT_THRESHOLD) continue;
          painted++;
          let best = swatches[0];
          let bestD = Infinity;
          for (const s of swatches) {
            const d = Math.hypot(r - s.rgb[0], g - s.rgb[1], b - s.rgb[2]);
            if (d < bestD) {
              bestD = d;
              best = s;
            }
          }
          counts.set(best.id, (counts.get(best.id) ?? 0) + 1);
        }
      }
      const colors = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id, n]) => ({ id, name: swatches.find((s) => s.id === id)!.name, share: n / Math.max(1, painted) }));
      out[`${COLS[col]}${row + 1}`] = { coverage: sampled ? painted / sampled : 0, colors };
    }
  }
  return out;
}

export function describeGrid(stats: Record<string, CellStats>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [cell, s] of Object.entries(stats)) out[cell] = describeCell(s);
  return out;
}

export function describeCell(s: CellStats): string {
  const c1 = s.colors[0];
  const c2 = s.colors[1];
  if (s.coverage < 0.03 || !c1) return 'blank paper';
  if (s.coverage < 0.25) return `a little ${c1.name}`;
  if (s.coverage < 0.6) return c2 && c2.share > 0.25 ? `partly ${c1.name} and ${c2.name}` : `partly ${c1.name}`;
  return c2 && c2.share > 0.2 ? `mostly ${c1.name}, some ${c2.name}` : `mostly ${c1.name}`;
}

export function blankGrid(): Record<string, string> {
  const out: Record<string, string> = {};
  for (let row = 1; row <= GRID; row++) for (const col of COLS) out[`${col}${row}`] = 'blank paper';
  return out;
}
