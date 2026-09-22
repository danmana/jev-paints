'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PaintingCanvas, { type CanvasHandle } from './PaintingCanvas';
import { Distribution, decisionSentence, label } from './JevPanel';
import { BRUSHES, FIELDS, MODIFIERS, SIZES, WEIGHTS } from '@/lib/brushes';
import { buildGesture } from '@/lib/gesture';
import { blankGrid } from '@/lib/grid';
import { LAYOUTS, LAYOUT_BY_ID } from '@/lib/layouts';
import { generateOps, KIND_WORD, MOTIFS } from '@/lib/motifs';
import { describeColor, describePaper, PALETTES, PALETTE_BY_ID } from '@/lib/palettes';
import { COLS, GRID, planFor, regionBox } from '@/lib/plan';
import { setupQuestions, stepQuestions, stepState, type Question } from '@/lib/prompts';
import { makeRng } from '@/lib/rng';
import { STYLES, STYLE_BY_ID } from '@/lib/styles';
import type { Gesture, Op, Painting, StepRequest } from '@/lib/types';
import { CANVAS_SIZE } from '@/lib/types';

const PACE_MS = 90;

interface Snapshot {
  step: number;
  layer: string;
  url: string;
}

interface Anatomy {
  step: number;
  grid: Record<string, string>;
  before: string;
  after: string;
}

/** Shrinks a canvas data URL so the filmstrip does not hold six full-size PNGs. */
async function thumb(url: string, size: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      c.getContext('2d')!.drawImage(img, 0, 0, size, size);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

/** Two decimals: enough for the drawing, and identical on server and client so hydration matches. */
const n2 = (v: number) => Math.round(v * 100) / 100;

function opsToSvg(ops: Op[], stroke: string, width = 2): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  ops.forEach((op, i) => {
    switch (op.t) {
      case 'line':
        out.push(<line key={i} x1={n2(op.x1)} y1={n2(op.y1)} x2={n2(op.x2)} y2={n2(op.y2)} stroke={stroke} strokeWidth={width} strokeLinecap="round" />);
        break;
      case 'flow': {
        const a = (-op.dir * Math.PI) / 180;
        out.push(<line key={i} x1={n2(op.x)} y1={n2(op.y)} x2={n2(op.x + Math.cos(a) * op.len)} y2={n2(op.y + Math.sin(a) * op.len)} stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeDasharray="6 4" />);
        break;
      }
      case 'shape':
        out.push(<polyline key={i} points={op.pts.map(([x, y]) => `${n2(x)},${n2(y)}`).join(' ') + (op.close ? ` ${n2(op.pts[0][0])},${n2(op.pts[0][1])}` : '')} fill={op.close ? stroke : 'none'} fillOpacity={op.close ? 0.18 : 0} stroke={stroke} strokeWidth={width} strokeLinejoin="round" />);
        break;
      case 'circle':
        out.push(<circle key={i} cx={n2(op.x)} cy={n2(op.y)} r={n2(op.r)} fill={stroke} fillOpacity={0.18} stroke={stroke} strokeWidth={width} />);
        break;
      case 'spline':
        out.push(<polyline key={i} points={op.pts.map(([x, y]) => `${n2(x)},${n2(y)}`).join(' ')} fill="none" stroke={stroke} strokeWidth={width} strokeLinejoin="round" strokeLinecap="round" />);
        break;
    }
  });
  return out;
}

function LayoutDiagram({ layoutId, size = 120, highlight }: { layoutId: string; size?: number; highlight?: string }) {
  const layout = LAYOUT_BY_ID[layoutId];
  if (!layout) return null;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="layout-diagram" aria-label={layout.name}>
      <rect x={0} y={0} width={100} height={100} fill="#fff" stroke="var(--ink-3)" strokeWidth={0.6} />
      {layout.regions.map((r, i) => {
        const [x0, y0, x1, y1] = r.box;
        const hot = r.id === highlight;
        return <rect key={r.id} x={x0 * 100} y={y0 * 100} width={(x1 - x0) * 100} height={(y1 - y0) * 100} fill={hot ? 'var(--violet)' : ['var(--lilac)', 'var(--sage)', 'var(--powder)', 'var(--peach)'][i % 4]} fillOpacity={hot ? 0.45 : 0.28} stroke={hot ? 'var(--violet)' : 'var(--ink-2)'} strokeWidth={hot ? 1.2 : 0.5} />;
      })}
    </svg>
  );
}

function MotifThumb({ id, kind }: { id: string; kind: 'lines' | 'shape' }) {
  const ops = useMemo(() => generateOps(id, makeRng(7), { x: 6, y: 6, w: 88, h: 88 }, 1, 100), [id]);
  return (
    <svg viewBox="0 0 100 100" width={84} height={84} className="motif-thumb" aria-hidden="true">
      {opsToSvg(ops, kind === 'shape' ? 'var(--violet)' : 'var(--ink)', 1.4)}
    </svg>
  );
}

function Bars({ title, probs, chosen, names }: { title: string; probs: Record<string, number>; chosen: string; names: (id: string) => string }) {
  const rows = Object.entries(probs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  if (!rows.some(([k]) => k === chosen)) rows.push([chosen, probs[chosen] ?? 0]);
  return (
    <div className="dist">
      <div className="dist-title">{title}</div>
      {rows.map(([k, v]) => (
        <div key={k} className={`bar ${k === chosen ? 'chosen' : ''}`}>
          <span className="bar-label">{names(k)}</span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: `${Math.round(v * 100)}%` }} />
          </span>
          <span className="bar-value">{Math.round(v * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

function questionSummary(q: Question): string {
  if (q.type === 'noul') return 'yes or no';
  return `${Object.keys(q.criteria).length} options`;
}

export default function HowItWorks({ painting, counts }: { painting: Painting | null; counts: { paintings: number } }) {
  const canvas = useRef<CanvasHandle>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [anatomy, setAnatomy] = useState<Anatomy | null>(null);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const ranOnce = useRef(false);

  const plan = useMemo(() => (painting ? planFor(painting.setup.layout, painting.settings.steps, painting.steps.length + 1) : []), [painting]);

  /** The gesture the anatomy section dissects: the first solid shape of the main-subject phase, or the first step of that phase. */
  const anatomyStep = useMemo(() => {
    if (!painting) return 1;
    const subject = plan.find((p) => /subject/.test(p.layer)) ?? plan[Math.floor(plan.length / 2)];
    const inPhase = painting.steps.filter((s) => s.step >= subject.from && s.step <= subject.to);
    const shape = inPhase.find((s) => MOTIFS.find((m) => m.id === s.decision.motif)?.kind === 'shape');
    return (shape ?? inPhase[0] ?? painting.steps[0]).step;
  }, [painting, plan]);

  const replay = useCallback(async () => {
    const c = canvas.current;
    if (!painting || !c || playing) return;
    setPlaying(true);
    setSnapshots([]);
    setAnatomy(null);
    setProgress(0);
    const palette = PALETTE_BY_ID[painting.setup.palette];
    await c.reset(palette.paper, painting.settings.seed);
    const boundaries = new Set(plan.map((p) => p.to));
    let pending: Partial<Anatomy> = {};
    for (const rec of painting.steps) {
      if (rec.step === anatomyStep) {
        const grid = (await c.readGrid(palette)).text;
        pending = { step: rec.step, grid, before: c.toDataURL() };
      }
      const g = buildGesture(rec.decision, painting.setup.layout, painting.setup.palette, painting.setup.field, painting.settings.seed, rec.step);
      await c.paint(g, PACE_MS);
      setProgress(rec.step);
      if (rec.step === anatomyStep) {
        pending.after = c.toDataURL();
        setAnatomy(pending as Anatomy);
      }
      if (boundaries.has(rec.step)) {
        const url = await thumb(c.toDataURL(), 300);
        setSnapshots((s) => [...s, { step: rec.step, layer: rec.layer, url }]);
      }
    }
    setPlaying(false);
  }, [painting, playing, plan, anatomyStep]);

  // Autoplay once the canvas exists. The guard is set inside the timeout so React's development
  // double-invocation of effects (which clears the first timeout) does not swallow the replay.
  useEffect(() => {
    if (!painting) return;
    const t = setTimeout(() => {
      if (ranOnce.current) return;
      ranOnce.current = true;
      void replay();
    }, 400);
    return () => clearTimeout(t);
  }, [painting, replay]);

  if (!painting) {
    return (
      <article className="how">
        <h1 className="title">How it works</h1>
        <p className="lede">Jev never sees a pixel. This page follows one real painting from prompt to last stroke, and there is no painting in the gallery yet.</p>
        <p className="lede">
          <Link href="/">Ask Jev to paint something</Link>, then come back.
        </p>
      </article>
    );
  }

  const palette = PALETTE_BY_ID[painting.setup.palette];
  const style = STYLE_BY_ID[painting.setup.style];
  const layout = LAYOUT_BY_ID[painting.setup.layout];
  const setupQs = setupQuestions();
  const record = painting.steps.find((s) => s.step === anatomyStep) ?? painting.steps[0];
  // Rebuilding the state Jev saw needs no live session; the signature fields are placeholders.
  const req: StepRequest = {
    session: { id: 'example', seed: painting.settings.seed, prompt: painting.prompt, steps: painting.settings.steps, policy: painting.settings.policy },
    setupSig: '',
    prompt: painting.prompt,
    setup: painting.setup,
    step: record.step,
    steps: painting.settings.steps,
    policy: painting.settings.policy,
    canvas: anatomy?.grid ?? blankGrid(),
    history: painting.steps.filter((s) => s.step < record.step).map((s) => ({ step: s.step, layer: s.layer, decision: s.decision })),
  };
  const state = stepState(req);
  const questions = stepQuestions(req);
  const gesture: Gesture = buildGesture(record.decision, painting.setup.layout, painting.setup.palette, painting.setup.field, painting.settings.seed, record.step);
  const region = regionBox(layout, record.decision.region, CANVAS_SIZE);
  const when = new Date(painting.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const cost = (painting.totalTokens * 0.042) / 1_000_000;
  const stateJson = JSON.stringify(state, null, 2);
  const stateTokens = Math.round(stateJson.length / 3.6);

  return (
    <article className="how">
      <h1 className="title">How it works</h1>
      <p className="lede">
        Jev is a small model that answers questions with probabilities. It cannot see, draw or write. Jev Paints turns it into a painter anyway: code describes the canvas in words, Jev picks from fixed lists, code moves the brush. This page follows one real painting from prompt to last stroke.
      </p>

      <section className="how-section">
        <h2>Watch it once</h2>
        <figure className="easel">
          <PaintingCanvas ref={canvas} className="canvas" />
          <figcaption className="caption">
            <p className="work">{painting.prompt}</p>
            <div className="status">
              {playing ? `Gesture ${progress} of ${painting.steps.length}` : `${painting.steps.length} gestures, painted ${when}. `}
              {!playing && (
                <button className="linkish" onClick={() => void replay()}>
                  Watch it again
                </button>
              )}
            </div>
            {playing && (
              <div className="progress" aria-hidden="true">
                <div className="progress-bar" style={{ width: `${(progress / painting.steps.length) * 100}%` }} />
              </div>
            )}
          </figcaption>
        </figure>
        <p>Every stroke was chosen by Jev on the day it was painted. The page replays the saved decisions, so it is the same painting each time. Jev is not called while you watch.</p>
      </section>

      <section className="how-section">
        <h2>One request before the first stroke</h2>
        <p>
          The prompt goes to Jev with seven independent questions in one request. Three are yes-or-no checks that block only clearly offensive requests. Four choose the foundations of the painting from fixed lists: a palette from {PALETTES.length}, a painter or movement from {STYLES.length}, a composition from {LAYOUTS.length}, and a stroke character.
        </p>
        <div className="request">
          <div className="request-state">
            <div className="dist-title">What Jev received</div>
            <pre>{JSON.stringify({ request: painting.prompt }, null, 2)}</pre>
            <div className="dist-title">Moderation, probability of yes</div>
            {(['sexual', 'hate', 'gore'] as const).map((k) => (
              <div key={k} className="bar">
                <span className="bar-label">{(setupQs[k] as { instructions: string }).instructions.replace(/^Does the request /, '').replace(/\?$/, '')}</span>
                <span className="bar-track">
                  <span className="bar-fill" style={{ width: `${Math.max(1, Math.round(painting.setup.moderation[k] * 100))}%` }} />
                </span>
                <span className="bar-value">{Math.round(painting.setup.moderation[k] * 100)}%</span>
              </div>
            ))}
          </div>
          <div className="dists">
            <Bars title="Which palette" probs={painting.setup.probabilities.palette ?? {}} chosen={painting.setup.palette} names={(id) => PALETTE_BY_ID[id]?.name ?? id} />
            <Bars title="Which painter or movement" probs={painting.setup.probabilities.style ?? {}} chosen={painting.setup.style} names={(id) => STYLE_BY_ID[id]?.name ?? id} />
            <Bars title="Which composition" probs={painting.setup.probabilities.layout ?? {}} chosen={painting.setup.layout} names={(id) => LAYOUT_BY_ID[id]?.name ?? id} />
            <Bars title="Stroke character" probs={painting.setup.probabilities.field ?? {}} chosen={painting.setup.field} names={(id) => FIELDS[id as keyof typeof FIELDS] ?? id} />
          </div>
        </div>
        <p className="how-note">
          Jev only ever sees words. The palette option it chose read: <em>{palette.name}: {palette.mood}. Colours: {palette.colors.map(describeColor).join(', ')}; on {describePaper(palette)} paper.</em> The style option read: <em>{style.name}: {style.description}.</em>
        </p>
      </section>

      <section className="how-section">
        <h2>The plan</h2>
        <p>
          A composition is a set of named places and an order to paint them. The places are generic on purpose: sky, ground, main subject, never boat or tree, so any prompt fits. Code splits the gesture budget across the phases and tells Jev which phase is current. Jev may still paint anywhere.
        </p>
        <div className="plan">
          <LayoutDiagram layoutId={layout.id} size={220} />
          <div className="plan-text">
            <div className="dist-title">{layout.name}</div>
            <ul className="regions">
              {layout.regions.map((r) => (
                <li key={r.id}>
                  <strong>{r.name}</strong> {r.description}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="phases" role="list">
          {plan.map((p, i) => (
            <div key={p.layer} className="phase" role="listitem" style={{ flex: p.to - p.from + 1, background: ['var(--lilac)', 'var(--sage)', 'var(--powder)', 'var(--peach)', 'var(--violet-soft)'][i % 5] }}>
              <span className="phase-name">{p.layer}</span>
              <span className="phase-steps">
                {p.from}–{p.to}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="how-section">
        <h2>Every gesture is one request</h2>
        <p>
          Before gesture {record.step}, while the plan was on <em>{record.layer}</em>, Jev received the state below and eight independent questions. One round trip, {record.ms} ms, about {stateTokens.toLocaleString()} tokens.
        </p>
        <div className="anatomy">
          <div className="state-card">
            <div className="dist-title">State</div>
            <dl className="state">
              <dt>request</dt>
              <dd>{painting.prompt}</dd>
              <dt>style</dt>
              <dd>
                {style.name}, {style.description}
              </dd>
              <dt>palette</dt>
              <dd>
                {palette.name}, {palette.colors.map(describeColor).join(', ')}, on {describePaper(palette)} paper
              </dd>
              <dt>composition</dt>
              <dd>
                {layout.name}, {layout.regions.length} named places
              </dd>
              <dt>progress</dt>
              <dd>
                step {record.step} of {painting.settings.steps}, now painting the {record.layer}
              </dd>
              <dt>canvas</dt>
              <dd>25 cells, each described in words. Shown in full in the next section.</dd>
              <dt>gestures so far</dt>
              <dd>the last 12 gestures as rows of step, phase, gesture, place, size, medium, colour, weight; earlier ones summarised by place and colour</dd>
            </dl>
            <button className="linkish" onClick={() => setShowRaw((v) => !v)}>
              {showRaw ? 'Hide the raw state' : 'Show the raw state as sent'}
            </button>
            {showRaw && <pre className="raw">{stateJson}</pre>}
          </div>
          <div className="questions-card">
            <div className="dist-title">Questions</div>
            <ol className="questions">
              {Object.entries(questions).map(([id, q]) => (
                <li key={id}>
                  <span>{q.instructions.replace(/^You are painting .*?\. This is step \d+ of \d+; the plan is now on ".*?"\. /, '')}</span>
                  <span className="muted"> {questionSummary(q)}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <p>Jev answers each question with a probability for every option. These were the answers, with the option that got painted in violet:</p>
        <div className="dists">
          {(['motif', 'region', 'color', 'brush', 'modifier', 'size', 'weight'] as const).map((q) => (
            <Distribution key={q} question={q} probs={record.probabilities[q] ?? {}} chosen={record.decision[q]} layoutId={layout.id} paletteId={palette.id} />
          ))}
          <div className="dist">
            <div className="dist-title">Is the painting finished?</div>
            <div className="bar">
              <span className="bar-label">yes</span>
              <span className="bar-track">
                <span className="bar-fill" style={{ width: `${Math.max(1, Math.round(record.finished * 100))}%` }} />
              </span>
              <span className="bar-value">{Math.round(record.finished * 100)}%</span>
            </div>
          </div>
        </div>
      </section>

      <section className="how-section">
        <h2>How Jev sees</h2>
        <p>
          There is no image in the request. After each gesture, code reads the pixels back, divides the canvas into 25 cells and writes one short phrase per cell: how much of it is covered and by which palette colours. That grid is the whole of Jev&apos;s view of the painting. This is what it saw before gesture {record.step}.
        </p>
        <figure className="seeing">
          <div className="seeing-canvas">
            {anatomy ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={anatomy.before} alt={`The canvas before gesture ${record.step}`} width={600} height={600} />
            ) : (
              <div className="seeing-placeholder">
                <span className="muted">{playing ? `Replaying, at gesture ${progress}` : 'Replay the painting to fill this in'}</span>
              </div>
            )}
            <div className="grid-overlay" aria-hidden="true">
              {Array.from({ length: GRID * GRID }, (_, i) => {
                const id = `${COLS[i % GRID]}${Math.floor(i / GRID) + 1}`;
                return (
                  <div key={id} className="grid-cell">
                    <span className="grid-id">{id}</span>
                    <span className="grid-text">{anatomy?.grid[id] ?? ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <figcaption className="muted small">Columns A to E run left to right, rows 1 to 5 top to bottom. The grid is read from the real pixels, not from the list of gestures.</figcaption>
        </figure>
      </section>

      <section className="how-section">
        <h2>From picks to strokes</h2>
        <p>
          Jev never names a coordinate. A gesture is a motif, a place and a size. Code puts a box of that size somewhere inside the place, and the motif fills the box with strokes using a random generator seeded from the painting and the step number. The same decisions always give the same strokes, which is why replays are exact.
        </p>
        <p className="decision">{decisionSentence(record, layout.id, palette.id)}</p>
        <div className="resolve">
          <figure>
            <LayoutDiagram layoutId={layout.id} size={180} highlight={record.decision.region} />
            <figcaption className="small muted">The place: {label('region', record.decision.region, layout.id, palette.id)}</figcaption>
          </figure>
          <figure>
            <svg viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`} width={180} height={180} className="ops-diagram">
              <rect x={0} y={0} width={CANVAS_SIZE} height={CANVAS_SIZE} fill="#fff" stroke="var(--ink-3)" strokeWidth={3} />
              <rect x={region.x} y={region.y} width={region.w} height={region.h} fill="var(--violet)" fillOpacity={0.12} stroke="var(--violet)" strokeWidth={3} strokeDasharray="10 8" />
              {opsToSvg(gesture.ops, gesture.style.color, 6)}
            </svg>
            <figcaption className="small muted">
              The geometry: {gesture.ops.length} {gesture.ops.length === 1 ? 'path' : 'paths'} of a {record.decision.size} {label('motif', record.decision.motif, layout.id, palette.id)}
            </figcaption>
          </figure>
          <figure>
            {anatomy ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={anatomy.after} alt={`The canvas after gesture ${record.step}`} width={180} height={180} className="after" />
            ) : (
              <div className="after placeholder" />
            )}
            <figcaption className="small muted">
              The paint: {record.decision.brush}, {label('color', record.decision.color, layout.id, palette.id)}, {record.decision.weight} marks
            </figcaption>
          </figure>
        </div>
        <p>The medium, the weight and the fill style are p5.brush settings. Lines are always drawn as plain strokes; solid shapes take the fill style Jev chose.</p>
        <div className="brush-table">
          <div className="dist-title">Media</div>
          <dl>
            {Object.entries(BRUSHES).map(([id, d]) => (
              <div key={id}>
                <dt>{id}</dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
          <div className="dist-title">Fill styles, solid shapes only</div>
          <dl>
            {Object.entries(MODIFIERS).map(([id, d]) => (
              <div key={id}>
                <dt>{id.replace('_and_', ' and ')}</dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
          <div className="dist-title">Size and weight</div>
          <dl>
            {Object.entries(SIZES).map(([id, d]) => (
              <div key={id}>
                <dt>{id}</dt>
                <dd>{d.replace(/^\w+: /, '')}</dd>
              </div>
            ))}
            {Object.entries(WEIGHTS).map(([id, d]) => (
              <div key={id}>
                <dt>{id}</dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="how-section">
        <h2>The painting grows</h2>
        <p>The canvas at the end of each phase of the plan.</p>
        <div className="filmstrip">
          {plan.map((p) => {
            const snap = snapshots.find((s) => s.step === p.to);
            return (
              <figure key={p.layer}>
                {snap ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={snap.url} alt={`After the ${p.layer} phase`} width={300} height={300} />
                ) : (
                  <div className="placeholder" />
                )}
                <figcaption className="small">
                  <strong>{p.layer}</strong>
                  <span className="muted">
                    {' '}
                    gestures {p.from}–{p.to}
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </section>

      <section className="how-section">
        <h2>Weighted pick or top pick</h2>
        <p>
          Jev returns a probability for every option, never a single answer. <strong>Top pick</strong> always takes the option with the highest probability. <strong>Weighted pick</strong> draws one option at random with the probabilities as weights, so an option Jev gave 30% is chosen about three times in ten. In the gesture above, weighted pick chose{' '}
          <em>{label('motif', record.decision.motif, layout.id, palette.id)}</em> with {Math.round((record.probabilities.motif?.[record.decision.motif] ?? 0) * 100)}% behind it.
        </p>
        <p>Top pick gives calm, minimal paintings and repeats itself, because Jev&apos;s answer barely changes from one gesture to the next. Weighted pick is the default: the second and third options are what give a painting its focal shape and its second colour.</p>
      </section>

      <section className="how-section">
        <h2>The lists Jev chooses from</h2>
        <p>Everything Jev can pick is written down in advance. Changing the art means changing these lists, never the model.</p>

        <h3>{MOTIFS.length} gestures</h3>
        <p className="how-note">Solid shapes in violet, line gestures in ink. Each is drawn here with the same code that paints it, in a fixed random state.</p>
        <div className="motif-grid">
          {MOTIFS.map((m) => (
            <figure key={m.id}>
              <MotifThumb id={m.id} kind={m.kind} />
              <figcaption className="small">
                <strong>{m.name}</strong>
                <span className="muted"> {KIND_WORD[m.kind]}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <h3>{LAYOUTS.length} compositions</h3>
        <div className="layout-grid">
          {LAYOUTS.map((l) => (
            <figure key={l.id}>
              <LayoutDiagram layoutId={l.id} size={96} />
              <figcaption className="small">{l.name}</figcaption>
            </figure>
          ))}
        </div>

        <h3>{PALETTES.length} palettes</h3>
        <div className="palette-grid">
          {PALETTES.map((p) => (
            <div key={p.id} className="palette-row" title={p.mood}>
              <span className="swatches">
                <i style={{ background: p.paper }} title={p.paperName} />
                {p.colors.map((c) => <i key={c.id} style={{ background: c.hex }} title={c.name} />)}
              </span>
              <span className="small">{p.name}</span>
            </div>
          ))}
        </div>

        <h3>{STYLES.length} painters and movements</h3>
        <p className="style-list">{STYLES.map((s) => s.name).join(', ')}.</p>
      </section>

      <section className="how-section">
        <h2>What it cost</h2>
        <p>
          This painting took {(painting.totalMs / 1000).toFixed(1)} seconds and {painting.steps.length + 1} requests to Jev, {painting.totalTokens.toLocaleString()} input tokens in all, about ${cost.toFixed(3)}. Jev charges $0.042 per million input tokens and nothing for output. The gallery holds {counts.paintings} paintings so far.
        </p>
        <p className="how-note">
          Built with <a href="https://typesafe.ai">Jev by TypeSafe</a>, <a href="https://github.com/acamposuribe/p5.brush">p5.brush</a> and p5.js. <Link href="/">Paint your own.</Link>
        </p>
      </section>
    </article>
  );
}
