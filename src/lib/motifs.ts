import type { MotifDef, MotifKind, Op } from './types';
import type { Rng } from './rng';

/** Pixel box the gesture must land in. */
export interface PxBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MotifContext {
  rng: Rng;
  /** The region chosen by Jev, in pixels. */
  region: PxBox;
  /** The part of the region the gesture actually covers, after size and placement. */
  box: PxBox;
  /** 0..1 scale from the size choice. */
  scale: number;
  canvas: number;
}

type Generator = (c: MotifContext) => Op[];

interface Motif extends MotifDef {
  gen: Generator;
}

const TAU = Math.PI * 2;
type Pt = [number, number, number?];

function cx(b: PxBox) {
  return b.x + b.w / 2;
}
function cy(b: PxBox) {
  return b.y + b.h / 2;
}

/** Closed irregular polygon around an ellipse inscribed in the box. */
function blobPoints(c: MotifContext, wobble = 0.22, n = 10): Pt[] {
  const pts: Pt[] = [];
  const rx = c.box.w / 2;
  const ry = c.box.h / 2;
  const start = c.rng.range(0, TAU);
  for (let i = 0; i < n; i++) {
    const a = start + (i / n) * TAU;
    const k = 1 - wobble / 2 + c.rng.range(0, wobble);
    pts.push([cx(c.box) + Math.cos(a) * rx * k, cy(c.box) + Math.sin(a) * ry * k, 1]);
  }
  return pts;
}

function wavyLine(c: MotifContext, x0: number, y0: number, x1: number, y1: number, amp: number, n = 7): Pt[] {
  const pts: Pt[] = [];
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const phase = c.rng.range(0, TAU);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const off = Math.sin(phase + t * TAU * 1.2) * amp + c.rng.range(-amp * 0.2, amp * 0.2);
    pts.push([x0 + dx * t + nx * off, y0 + dy * t + ny * off, 1]);
  }
  return pts;
}

const shape = (pts: Pt[], close: boolean, curvature: number): Op => ({ t: 'shape', pts, close, curvature });
const spline = (pts: Pt[], curvature: number): Op => ({ t: 'spline', pts, curvature });
const line = (x1: number, y1: number, x2: number, y2: number): Op => ({ t: 'line', x1, y1, x2, y2 });

const MOTIF_LIST: Motif[] = [
  {
    id: 'band',
    name: 'horizontal band',
    description: 'a wide solid horizontal band of colour across the place, like a horizon, a sea, a road or a stripe',
    kind: 'shape',
    gen: (c) => {
      const h = Math.max(14, c.box.h * c.rng.range(0.3, 0.6));
      const y = c.box.y + c.rng.range(0, c.box.h - h);
      const wob = h * 0.15;
      const pts: Pt[] = [
        [c.box.x, y + c.rng.range(-wob, wob), 1],
        [c.box.x + c.box.w * 0.5, y + c.rng.range(-wob, wob), 1],
        [c.box.x + c.box.w, y + c.rng.range(-wob, wob), 1],
        [c.box.x + c.box.w, y + h + c.rng.range(-wob, wob), 1],
        [c.box.x + c.box.w * 0.5, y + h + c.rng.range(-wob, wob), 1],
        [c.box.x, y + h + c.rng.range(-wob, wob), 1],
      ];
      return [shape(pts, true, 0.2)];
    },
  },
  {
    id: 'column',
    name: 'vertical column',
    description: 'a tall solid vertical column of colour in the place, like a trunk, a tower, a figure or a pillar',
    kind: 'shape',
    gen: (c) => {
      const w = Math.max(14, c.box.w * c.rng.range(0.3, 0.6));
      const x = c.box.x + c.rng.range(0, c.box.w - w);
      const wob = w * 0.15;
      const pts: Pt[] = [
        [x + c.rng.range(-wob, wob), c.box.y, 1],
        [x + w + c.rng.range(-wob, wob), c.box.y, 1],
        [x + w + c.rng.range(-wob, wob), c.box.y + c.box.h * 0.5, 1],
        [x + w + c.rng.range(-wob, wob), c.box.y + c.box.h, 1],
        [x + c.rng.range(-wob, wob), c.box.y + c.box.h, 1],
        [x + c.rng.range(-wob, wob), c.box.y + c.box.h * 0.5, 1],
      ];
      return [shape(pts, true, 0.2)];
    },
  },
  {
    id: 'blob',
    name: 'soft blob',
    description: 'one irregular rounded solid mass of colour',
    kind: 'shape',
    gen: (c) => [shape(blobPoints(c, 0.3, c.rng.int(7, 11)), true, 0.6)],
  },
  {
    id: 'blob_cluster',
    name: 'cluster of blobs',
    description: 'two to four overlapping rounded masses of colour, like foliage, clouds or a bunch of something',
    kind: 'shape',
    gen: (c) => {
      const n = c.rng.int(2, 4);
      const ops: Op[] = [];
      for (let i = 0; i < n; i++) {
        const w = c.box.w * c.rng.range(0.45, 0.7);
        const h = c.box.h * c.rng.range(0.45, 0.7);
        const sub: MotifContext = { ...c, box: { x: c.box.x + c.rng.range(0, c.box.w - w), y: c.box.y + c.rng.range(0, c.box.h - h), w, h } };
        ops.push(shape(blobPoints(sub, 0.25, c.rng.int(7, 10)), true, 0.6));
      }
      return ops;
    },
  },
  {
    id: 'circle',
    name: 'disc',
    description: 'one round solid disc, like a sun, a moon, a ball or a face',
    kind: 'shape',
    gen: (c) => {
      const r = Math.min(c.box.w, c.box.h) / 2;
      return [{ t: 'circle', x: cx(c.box), y: cy(c.box), r, irregular: c.rng.range(0.05, 0.3) }];
    },
  },
  {
    id: 'oval',
    name: 'tall oval',
    description: 'one upright solid oval, taller than it is wide, like a head, an egg, a vase or a standing figure',
    kind: 'shape',
    gen: (c) => {
      const w = Math.min(c.box.w, c.box.h * 0.72);
      const h = Math.min(c.box.h, w / 0.72);
      const sub: MotifContext = { ...c, box: { x: cx(c.box) - w / 2, y: cy(c.box) - h / 2, w, h } };
      return [shape(blobPoints(sub, 0.08, 14), true, 0.8)];
    },
  },
  {
    id: 'wide_oval',
    name: 'wide oval',
    description: 'one solid oval lying on its side, wider than it is tall, like a pond, a cloud, a body at rest or a boat hull',
    kind: 'shape',
    gen: (c) => {
      const h = Math.min(c.box.h, c.box.w * 0.55);
      const w = Math.min(c.box.w, h / 0.55);
      const sub: MotifContext = { ...c, box: { x: cx(c.box) - w / 2, y: cy(c.box) - h / 2, w, h } };
      return [shape(blobPoints(sub, 0.08, 14), true, 0.8)];
    },
  },
  {
    id: 'mound',
    name: 'mound',
    description: 'one solid dome sitting on the bottom of its place, flat below and rounded above, like a hill, a dune, a shoulder or a bush',
    kind: 'shape',
    gen: (c) => {
      const b = c.box;
      const pts: Pt[] = [[b.x, b.y + b.h, 1]];
      const n = 9;
      for (let i = 0; i <= n; i++) {
        const a = Math.PI - (i / n) * Math.PI;
        const k = 1 + c.rng.range(-0.05, 0.05);
        pts.push([cx(b) + (Math.cos(a) * b.w * k) / 2, b.y + b.h - Math.sin(a) * b.h * k, 1]);
      }
      pts.push([b.x + b.w, b.y + b.h, 1]);
      return [shape(pts, true, 0.5)];
    },
  },
  {
    id: 'crescent',
    name: 'crescent',
    description: 'one solid crescent, a curved sliver like a moon, a smile, a sail or a leaf',
    kind: 'shape',
    gen: (c) => {
      const b = c.box;
      const R = Math.min(b.w, b.h) / 2;
      const rot = c.rng.pick([0, Math.PI / 2, Math.PI, -Math.PI / 2, Math.PI / 4, -Math.PI / 4]);
      const pts: Pt[] = [];
      const n = 10;
      const thickness = c.rng.range(0.35, 0.6);
      for (let i = 0; i <= n; i++) {
        const a = -Math.PI / 2 + (i / n) * Math.PI;
        pts.push([Math.cos(a) * R, Math.sin(a) * R, 1]);
      }
      for (let i = n; i >= 0; i--) {
        const a = -Math.PI / 2 + (i / n) * Math.PI;
        pts.push([Math.cos(a) * R * (1 - thickness) + R * thickness * 0.6, Math.sin(a) * R, 1]);
      }
      const cxv = cx(b);
      const cyv = cy(b);
      return [shape(pts.map(([x, y]) => [cxv + x * Math.cos(rot) - y * Math.sin(rot), cyv + x * Math.sin(rot) + y * Math.cos(rot), 1]), true, 0.5)];
    },
  },
  {
    id: 'wedge',
    name: 'wedge',
    description: 'one solid slanted wedge or shard, like a roof, a rock face, a ray of light or a flag',
    kind: 'shape',
    gen: (c) => {
      const b = c.box;
      const flip = c.rng.chance(0.5);
      const pts: Pt[] = flip
        ? [[b.x, b.y + b.h * c.rng.range(0, 0.3), 1], [b.x + b.w, b.y + b.h * c.rng.range(0.4, 0.8), 1], [b.x + b.w, b.y + b.h, 1], [b.x, b.y + b.h, 1]]
        : [[b.x, b.y + b.h * c.rng.range(0.4, 0.8), 1], [b.x + b.w, b.y + b.h * c.rng.range(0, 0.3), 1], [b.x + b.w, b.y + b.h, 1], [b.x, b.y + b.h, 1]];
      return [shape(pts, true, 0)];
    },
  },
  {
    id: 'field',
    name: 'full wash of the place',
    description: 'a solid mass of colour covering the whole chosen place edge to edge, with soft uneven borders',
    kind: 'shape',
    gen: (c) => {
      const b = c.region;
      const j = () => c.rng.range(-0.03, 0.03) * Math.min(b.w, b.h);
      const pts: Pt[] = [
        [b.x - 4 + j(), b.y - 4 + j(), 1],
        [b.x + b.w / 2, b.y - 4 + j(), 1],
        [b.x + b.w + 4 + j(), b.y - 4 + j(), 1],
        [b.x + b.w + 4 + j(), b.y + b.h / 2, 1],
        [b.x + b.w + 4 + j(), b.y + b.h + 4 + j(), 1],
        [b.x + b.w / 2, b.y + b.h + 4 + j(), 1],
        [b.x - 4 + j(), b.y + b.h + 4 + j(), 1],
        [b.x - 4 + j(), b.y + b.h / 2, 1],
      ];
      return [shape(pts, true, 0.15)];
    },
  },
  {
    id: 'triangle',
    name: 'triangle',
    description: 'one solid triangle pointing up or down, like a mountain, a roof, a tree or a sail',
    kind: 'shape',
    gen: (c) => {
      const up = c.rng.chance(0.65);
      const b = c.box;
      const tipX = b.x + b.w * c.rng.range(0.3, 0.7);
      const pts: Pt[] = up
        ? [[tipX, b.y, 1], [b.x + b.w, b.y + b.h, 1], [b.x, b.y + b.h, 1]]
        : [[b.x, b.y, 1], [b.x + b.w, b.y, 1], [tipX, b.y + b.h, 1]];
      return [shape(pts, true, 0)];
    },
  },
  {
    id: 'rectangle',
    name: 'rectangle',
    description: 'one solid slightly crooked rectangle, like a wall, a window, a door or a block of colour',
    kind: 'shape',
    gen: (c) => {
      const b = c.box;
      const j = () => c.rng.range(-0.04, 0.04) * Math.min(b.w, b.h);
      const pts: Pt[] = [
        [b.x + j(), b.y + j(), 1],
        [b.x + b.w + j(), b.y + j(), 1],
        [b.x + b.w + j(), b.y + b.h + j(), 1],
        [b.x + j(), b.y + b.h + j(), 1],
      ];
      return [shape(pts, true, 0)];
    },
  },
  {
    id: 'petals',
    name: 'petals',
    description: 'several solid rounded shapes arranged around a centre, like a flower, a star or a burst',
    kind: 'shape',
    gen: (c) => {
      const n = c.rng.int(5, 8);
      const R = Math.min(c.box.w, c.box.h) / 2;
      const ops: Op[] = [];
      const start = c.rng.range(0, TAU);
      for (let i = 0; i < n; i++) {
        const a = start + (i / n) * TAU;
        const px = cx(c.box) + Math.cos(a) * R * 0.5;
        const py = cy(c.box) + Math.sin(a) * R * 0.5;
        const pr = R * 0.42;
        const pts: Pt[] = [];
        for (let k = 0; k < 8; k++) {
          const t = (k / 8) * TAU;
          const rr = k % 4 === 0 ? pr * 0.75 : pr;
          pts.push([px + Math.cos(t) * rr * 0.6 * Math.cos(a) - Math.sin(t) * rr * Math.sin(a) * 0.4 + Math.cos(t) * 0, py + Math.sin(t) * rr * 0.6, 1]);
        }
        ops.push(shape(pts, true, 0.7));
      }
      return ops;
    },
  },
  {
    id: 'stripes',
    name: 'stacked stripes',
    description: 'several thin solid horizontal stripes stacked in the place',
    kind: 'shape',
    gen: (c) => {
      const n = c.rng.int(3, 6);
      const gap = c.box.h / n;
      const ops: Op[] = [];
      for (let i = 0; i < n; i++) {
        const h = gap * c.rng.range(0.35, 0.7);
        const y = c.box.y + i * gap + (gap - h) / 2;
        const pts: Pt[] = [
          [c.box.x, y, 1],
          [c.box.x + c.box.w, y + c.rng.range(-3, 3), 1],
          [c.box.x + c.box.w, y + h, 1],
          [c.box.x, y + h + c.rng.range(-3, 3), 1],
        ];
        ops.push(shape(pts, true, 0));
      }
      return ops;
    },
  },
  {
    id: 'vertical_strokes',
    name: 'vertical strokes',
    description: 'a cluster of upright strokes of varying length',
    kind: 'lines',
    gen: (c) => {
      const n = Math.round(c.rng.int(6, 16) * (0.5 + c.scale));
      const ops: Op[] = [];
      for (let i = 0; i < n; i++) {
        const x = c.box.x + c.rng.range(0, c.box.w);
        const len = c.box.h * c.rng.range(0.4, 1);
        const y = c.box.y + c.rng.range(0, c.box.h - len);
        ops.push(line(x, y, x + c.rng.range(-6, 6), y + len));
      }
      return ops;
    },
  },
  {
    id: 'horizontal_strokes',
    name: 'horizontal strokes',
    description: 'a cluster of sideways strokes of varying length',
    kind: 'lines',
    gen: (c) => {
      const n = Math.round(c.rng.int(6, 16) * (0.5 + c.scale));
      const ops: Op[] = [];
      for (let i = 0; i < n; i++) {
        const y = c.box.y + c.rng.range(0, c.box.h);
        const len = c.box.w * c.rng.range(0.4, 1);
        const x = c.box.x + c.rng.range(0, c.box.w - len);
        ops.push(line(x, y, x + len, y + c.rng.range(-6, 6)));
      }
      return ops;
    },
  },
  {
    id: 'diagonal_strokes',
    name: 'diagonal strokes',
    description: 'parallel slanted strokes across the region',
    kind: 'lines',
    gen: (c) => {
      const n = Math.round(c.rng.int(6, 14) * (0.5 + c.scale));
      const a = c.rng.pick([Math.PI / 4, -Math.PI / 4, Math.PI / 3, -Math.PI / 3]);
      const len = Math.min(c.box.w, c.box.h) * c.rng.range(0.6, 1.1);
      const ops: Op[] = [];
      for (let i = 0; i < n; i++) {
        const mx = c.box.x + c.rng.range(0, c.box.w);
        const my = c.box.y + c.rng.range(0, c.box.h);
        const l = len * c.rng.range(0.5, 1);
        ops.push(line(mx - (Math.cos(a) * l) / 2, my - (Math.sin(a) * l) / 2, mx + (Math.cos(a) * l) / 2, my + (Math.sin(a) * l) / 2));
      }
      return ops;
    },
  },
  {
    id: 'cross_hatch',
    name: 'cross-hatch patch',
    description: 'two sets of crossing parallel lines filling the region',
    kind: 'lines',
    gen: (c) => {
      const ops: Op[] = [];
      const n = Math.round(c.rng.int(5, 10) * (0.5 + c.scale));
      for (const a of [c.rng.range(0.6, 0.9), c.rng.range(-0.9, -0.6)]) {
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n;
          const px = c.box.x + c.box.w * t;
          const py = c.box.y + c.box.h * (a > 0 ? t : 1 - t);
          const l = Math.min(c.box.w, c.box.h) * 0.8;
          ops.push(line(px - Math.cos(a) * l * 0.5, py + Math.sin(a) * l * 0.5, px + Math.cos(a) * l * 0.5, py - Math.sin(a) * l * 0.5));
        }
      }
      return ops;
    },
  },
  {
    id: 'radiating',
    name: 'radiating lines',
    description: 'straight lines shooting out from one centre point, like rays',
    kind: 'lines',
    gen: (c) => {
      const n = c.rng.int(8, 22);
      const R = Math.max(c.box.w, c.box.h) / 2;
      const ox = cx(c.box) + c.rng.range(-c.box.w * 0.15, c.box.w * 0.15);
      const oy = cy(c.box) + c.rng.range(-c.box.h * 0.15, c.box.h * 0.15);
      const ops: Op[] = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + c.rng.range(-0.1, 0.1);
        const r0 = R * c.rng.range(0.05, 0.25);
        const r1 = R * c.rng.range(0.6, 1.05);
        ops.push(line(ox + Math.cos(a) * r0, oy + Math.sin(a) * r0, ox + Math.cos(a) * r1, oy + Math.sin(a) * r1));
      }
      return ops;
    },
  },
  {
    id: 'dots',
    name: 'scattered dots',
    description: 'many small dots and dabs scattered over the region',
    kind: 'lines',
    gen: (c) => {
      const n = Math.round(c.rng.int(18, 50) * (0.4 + c.scale));
      const ops: Op[] = [];
      for (let i = 0; i < n; i++) {
        const x = c.box.x + c.rng.range(0, c.box.w);
        const y = c.box.y + c.rng.range(0, c.box.h);
        const a = c.rng.range(0, TAU);
        const l = c.rng.range(2, 7);
        ops.push(line(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l));
      }
      return ops;
    },
  },
  {
    id: 'flow_ribbon',
    name: 'flowing ribbon',
    description: 'a few long strokes that flow across the region following the stroke character of the painting',
    kind: 'lines',
    gen: (c) => {
      const n = c.rng.int(3, 8);
      const horizontal = c.box.w >= c.box.h;
      const ops: Op[] = [];
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n + c.rng.range(-0.05, 0.05);
        if (horizontal) {
          const y = c.box.y + c.box.h * t;
          ops.push({ t: 'flow', x: c.box.x, y, len: c.box.w * c.rng.range(0.8, 1.05), dir: c.rng.range(-8, 8) });
        } else {
          const x = c.box.x + c.box.w * t;
          ops.push({ t: 'flow', x, y: c.box.y, len: c.box.h * c.rng.range(0.8, 1.05), dir: -90 + c.rng.range(-8, 8) });
        }
      }
      return ops;
    },
  },
  {
    id: 'arcs',
    name: 'arcs',
    description: 'a few curved arcs, like rainbows or eyebrows',
    kind: 'lines',
    gen: (c) => {
      const n = c.rng.int(2, 5);
      const ops: Op[] = [];
      const R = Math.min(c.box.w, c.box.h) / 2;
      const down = c.rng.chance(0.3);
      for (let i = 0; i < n; i++) {
        const r = R * (0.45 + (0.55 * (i + 1)) / n);
        const pts: Pt[] = [];
        const a0 = down ? 0.15 : Math.PI + 0.15;
        for (let k = 0; k <= 8; k++) {
          const a = a0 + (k / 8) * (Math.PI - 0.3);
          pts.push([cx(c.box) + Math.cos(a) * r, cy(c.box) + (down ? -R * 0.3 : R * 0.3) + Math.sin(a) * r, 1]);
        }
        ops.push(spline(pts, 0.5));
      }
      return ops;
    },
  },
  {
    id: 'zigzag',
    name: 'zigzag',
    description: 'one sharp zigzag line across the region',
    kind: 'lines',
    gen: (c) => {
      const n = c.rng.int(4, 9);
      const pts: Pt[] = [];
      const horizontal = c.box.w >= c.box.h;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const amp = i % 2 === 0 ? 0.15 : 0.85;
        if (horizontal) pts.push([c.box.x + c.box.w * t, c.box.y + c.box.h * (amp + c.rng.range(-0.05, 0.05)), 1]);
        else pts.push([c.box.x + c.box.w * (amp + c.rng.range(-0.05, 0.05)), c.box.y + c.box.h * t, 1]);
      }
      return [shape(pts, false, 0)];
    },
  },
  {
    id: 'spiral',
    name: 'spiral',
    description: 'one line spiralling out from the centre',
    kind: 'lines',
    gen: (c) => {
      const turns = c.rng.range(2, 4);
      const R = Math.min(c.box.w, c.box.h) / 2;
      const pts: Pt[] = [];
      const steps = Math.round(turns * 14);
      const dir = c.rng.chance(0.5) ? 1 : -1;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = dir * t * turns * TAU;
        const r = R * t;
        pts.push([cx(c.box) + Math.cos(a) * r, cy(c.box) + Math.sin(a) * r, 1]);
      }
      return [spline(pts, 0.6)];
    },
  },
  {
    id: 'contours',
    name: 'contour lines',
    description: 'several parallel wavy lines across the region, like hills, waves or ripples',
    kind: 'lines',
    gen: (c) => {
      const n = c.rng.int(3, 7);
      const ops: Op[] = [];
      const amp = c.box.h * c.rng.range(0.04, 0.12);
      for (let i = 0; i < n; i++) {
        const y = c.box.y + c.box.h * ((i + 0.5) / n);
        ops.push(spline(wavyLine(c, c.box.x, y, c.box.x + c.box.w, y + c.rng.range(-8, 8), amp), 0.5));
      }
      return ops;
    },
  },
  {
    id: 'long_curve',
    name: 'long curve',
    description: 'a single sweeping S-shaped stroke across the region',
    kind: 'lines',
    gen: (c) => {
      const b = c.box;
      const fromLeft = c.rng.chance(0.5);
      const pts: Pt[] = fromLeft
        ? [[b.x, b.y + b.h * c.rng.range(0.6, 0.95), 1], [b.x + b.w * 0.33, b.y + b.h * c.rng.range(0.1, 0.4), 1], [b.x + b.w * 0.66, b.y + b.h * c.rng.range(0.6, 0.9), 1], [b.x + b.w, b.y + b.h * c.rng.range(0.05, 0.4), 1]]
        : [[b.x + b.w * c.rng.range(0.05, 0.4), b.y, 1], [b.x + b.w * c.rng.range(0.6, 0.95), b.y + b.h * 0.33, 1], [b.x + b.w * c.rng.range(0.05, 0.4), b.y + b.h * 0.66, 1], [b.x + b.w * c.rng.range(0.6, 0.95), b.y + b.h, 1]];
      return [spline(pts, 0.7)];
    },
  },
  {
    id: 'scribble',
    name: 'scribble',
    description: 'a loose tangled scribble filling the region',
    kind: 'lines',
    gen: (c) => {
      const n = Math.round(c.rng.int(10, 22) * (0.5 + c.scale));
      const pts: Pt[] = [];
      let x = cx(c.box);
      let y = cy(c.box);
      for (let i = 0; i < n; i++) {
        x = Math.min(c.box.x + c.box.w, Math.max(c.box.x, x + c.rng.range(-c.box.w * 0.5, c.box.w * 0.5)));
        y = Math.min(c.box.y + c.box.h, Math.max(c.box.y, y + c.rng.range(-c.box.h * 0.5, c.box.h * 0.5)));
        pts.push([x, y, 1]);
      }
      return [spline(pts, 0.4)];
    },
  },
  {
    id: 'drips',
    name: 'drips',
    description: 'vertical drips running down from the top of the region',
    kind: 'lines',
    gen: (c) => {
      const n = c.rng.int(4, 12);
      const ops: Op[] = [];
      for (let i = 0; i < n; i++) {
        const x = c.box.x + c.box.w * ((i + c.rng.range(0.2, 0.8)) / n);
        const len = c.box.h * c.rng.range(0.2, 1);
        ops.push(line(x, c.box.y, x + c.rng.range(-2, 2), c.box.y + len));
      }
      return ops;
    },
  },
  {
    id: 'grid_marks',
    name: 'grid of marks',
    description: 'small marks placed in a regular grid over the region',
    kind: 'lines',
    gen: (c) => {
      const cols = c.rng.int(3, 6);
      const rows = c.rng.int(3, 6);
      const ops: Op[] = [];
      const l = Math.min(c.box.w / cols, c.box.h / rows) * 0.45;
      const a = c.rng.pick([0, Math.PI / 2, Math.PI / 4]);
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++) {
          const x = c.box.x + c.box.w * ((i + 0.5) / cols);
          const y = c.box.y + c.box.h * ((j + 0.5) / rows);
          ops.push(line(x - (Math.cos(a) * l) / 2, y - (Math.sin(a) * l) / 2, x + (Math.cos(a) * l) / 2, y + (Math.sin(a) * l) / 2));
        }
      return ops;
    },
  },
  {
    id: 'outline_blob',
    name: 'outlined silhouette',
    description: 'the outline of an irregular shape, drawn twice so it looks sketched',
    kind: 'lines',
    gen: (c) => {
      const ops: Op[] = [];
      for (let k = 0; k < 2; k++) ops.push(shape(blobPoints(c, 0.25, c.rng.int(8, 12)), true, 0.5));
      return ops;
    },
  },
];

export const MOTIFS: MotifDef[] = MOTIF_LIST.map(({ id, name, description, kind }) => ({ id, name, description, kind }));
export const MOTIF_BY_ID: Record<string, Motif> = Object.fromEntries(MOTIF_LIST.map((m) => [m.id, m]));

export const KIND_WORD: Record<MotifKind, string> = { shape: 'solid shape', lines: 'lines' };

export function motifChoiceCriteria(): Record<string, string> {
  return Object.fromEntries(MOTIF_LIST.map((m) => [m.id, `${m.name} (${KIND_WORD[m.kind]}): ${m.description}`]));
}

/** Runs a motif inside a region: picks where within the region the gesture goes, then generates its ops. */
export function generateOps(motifId: string, rng: Rng, region: PxBox, scale: number, canvas: number): Op[] {
  const motif = MOTIF_BY_ID[motifId] ?? MOTIF_BY_ID.blob;
  const s = Math.min(1, scale * rng.range(0.9, 1.1));
  const w = Math.max(16, region.w * s);
  const h = Math.max(16, region.h * s);
  const box: PxBox = {
    x: region.x + rng.range(0, Math.max(0, region.w - w)),
    y: region.y + rng.range(0, Math.max(0, region.h - h)),
    w,
    h,
  };
  return motif.gen({ rng, region, box, scale, canvas });
}
