'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { computeGrid, describeGrid, type CellStats } from '@/lib/grid';
import type { Gesture, GestureStyle, Op, Palette } from '@/lib/types';
import { CANVAS_SIZE } from '@/lib/types';

export interface CanvasHandle {
  /** Clears to the paper colour and reseeds every random source. */
  reset(paper: string, seed: number): Promise<void>;
  /** Draws one gesture, spread over roughly `durationMs`, and resolves once it is composited. */
  paint(gesture: Gesture, durationMs: number): Promise<void>;
  /** Reads the canvas back as the 5 by 5 coverage grid Jev is told about. */
  readGrid(palette: Palette): Promise<{ text: Record<string, string>; stats: Record<string, CellStats> }>;
  toDataURL(): string;
}

type Brush = typeof import('p5.brush');

type Job =
  | { kind: 'op'; perFrame: number; run: () => void }
  | { kind: 'barrier'; resolve: () => void }
  | { kind: 'read'; palette: Palette; resolve: (r: { text: Record<string, string>; stats: Record<string, CellStats> }) => void };

const PIXEL_DENSITY = 2;

interface Props {
  onReady?: () => void;
  className?: string;
}

/**
 * p5 + p5.brush in instance mode. All drawing happens inside p5's draw() because p5.brush
 * composites its strokes at the end of each frame; the queue below spreads a gesture's operations
 * over several frames so the painting visibly grows, and barriers resolve one frame after the
 * last operation, when the composite has landed on the canvas.
 */
const PaintingCanvas = forwardRef<CanvasHandle, Props>(function PaintingCanvas({ onReady, className }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const queue = useRef<Job[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pRef = useRef<any>(null);
  const brushRef = useRef<Brush | null>(null);
  const readyRef = useRef<Promise<void> | null>(null);
  const resolveReady = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;
    readyRef.current = new Promise<void>((res) => (resolveReady.current = res));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let instance: any = null;

    (async () => {
      const P5 = (await import('p5')).default;
      // p5.brush registers itself as a p5 addon at import time and looks for the global.
      (window as unknown as { p5: unknown }).p5 = P5;
      const brush = await import('p5.brush');
      if (cancelled || !host.current) return;
      brushRef.current = brush;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sketch = (p: any) => {
        p.setup = () => {
          p.createCanvas(CANVAS_SIZE, CANVAS_SIZE, p.WEBGL);
          p.pixelDensity(PIXEL_DENSITY);
          p.angleMode(p.DEGREES);
          brush.instance(p);
          brush.load();
          brush.scaleBrushes(1.2);
          p.background('#faf9f6');
          resolveReady.current();
          onReady?.();
        };
        p.draw = () => {
          // Top-left origin for all gesture geometry (WEBGL centres the origin by default).
          p.translate(-CANVAS_SIZE / 2, -CANVAS_SIZE / 2);
          let ranThisFrame = false;
          let budget = Infinity;
          const q = queue.current;
          while (q.length) {
            const job = q[0];
            if (job.kind === 'op') {
              if (budget === Infinity) budget = job.perFrame;
              if (budget <= 0) break;
              q.shift();
              try {
                job.run();
              } catch (err) {
                console.error('[canvas] op failed', err);
              }
              budget--;
              ranThisFrame = true;
              continue;
            }
            // Barriers and reads wait for a frame in which nothing has been drawn yet, so the
            // previous frame's composite is already on the canvas.
            if (ranThisFrame) break;
            q.shift();
            if (job.kind === 'barrier') job.resolve();
            else {
              p.loadPixels();
              const w = CANVAS_SIZE * PIXEL_DENSITY;
              const stats = computeGrid(p.pixels, w, w, job.palette);
              job.resolve({ text: describeGrid(stats), stats });
            }
          }
        };
      };
      instance = new P5(sketch, host.current);
      pRef.current = instance;
    })().catch((err) => console.error('[canvas] failed to start p5', err));

    return () => {
      cancelled = true;
      instance?.remove();
      pRef.current = null;
    };
  }, [onReady]);

  const applyStyle = (s: GestureStyle) => {
    const brush = brushRef.current!;
    if (s.field === 'none') brush.noField();
    else brush.field(s.field);

    const lines = s.kind === 'lines';
    const strokeOn = lines || s.modifier === 'stroke' || s.modifier === 'fill_and_stroke';
    const fillOn = !lines && (s.modifier === 'fill' || s.modifier === 'fill_and_stroke' || s.modifier === 'bleed');
    const washOn = !lines && s.modifier === 'wash';
    const hatchOn = !lines && s.modifier === 'hatch';

    if (strokeOn) brush.set(s.brush, s.color, s.weight);
    else brush.noStroke();
    if (fillOn) {
      brush.fill(s.color, s.fillOpacity);
      brush.fillBleed(s.bleed, 'out');
      brush.fillTexture(0.55, 0.45, true);
    } else brush.noFill();
    if (washOn) brush.wash(s.color, s.fillOpacity);
    else brush.noWash();
    if (hatchOn) {
      brush.hatch(s.hatchDist, s.hatchAngle, { rand: 0.15, continuous: false, gradient: false });
      brush.hatchStyle(s.brush, s.color, s.weight);
    } else brush.noHatch();
  };

  const runOp = (op: Op) => {
    const brush = brushRef.current!;
    switch (op.t) {
      case 'line':
        brush.line(op.x1, op.y1, op.x2, op.y2);
        break;
      case 'flow':
        brush.flowLine(op.x, op.y, op.len, op.dir);
        break;
      case 'shape':
        brush.beginShape(op.curvature);
        for (const [x, y, pr] of op.pts) brush.vertex(x, y, pr ?? 1);
        brush.endShape(op.close);
        break;
      case 'circle':
        brush.circle(op.x, op.y, op.r, op.irregular);
        break;
      case 'spline':
        brush.spline(op.pts, op.curvature);
        break;
    }
  };

  useImperativeHandle(ref, () => ({
    async reset(paper, seed) {
      await readyRef.current;
      const p = pRef.current;
      queue.current.length = 0;
      queue.current.push({
        kind: 'op',
        perFrame: 1,
        run: () => {
          p.randomSeed(seed);
          p.noiseSeed(seed);
          brushRef.current!.noField();
          p.background(paper);
        },
      });
      await new Promise<void>((resolve) => queue.current.push({ kind: 'barrier', resolve }));
    },
    async paint(gesture, durationMs) {
      await readyRef.current;
      const frames = Math.max(1, Math.round(durationMs / 16.7));
      const perFrame = Math.max(1, Math.ceil(gesture.ops.length / frames));
      queue.current.push({ kind: 'op', perFrame, run: () => applyStyle(gesture.style) });
      for (const op of gesture.ops) queue.current.push({ kind: 'op', perFrame, run: () => runOp(op) });
      await new Promise<void>((resolve) => queue.current.push({ kind: 'barrier', resolve }));
    },
    async readGrid(palette) {
      await readyRef.current;
      return new Promise((resolve) => queue.current.push({ kind: 'read', palette, resolve }));
    },
    toDataURL() {
      const gl = pRef.current?.drawingContext as WebGL2RenderingContext | undefined;
      return (gl?.canvas as HTMLCanvasElement | undefined)?.toDataURL('image/png') ?? '';
    },
  }));

  return <div ref={host} className={className} style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, maxWidth: '100%', aspectRatio: '1 / 1' }} />;
});

export default PaintingCanvas;
