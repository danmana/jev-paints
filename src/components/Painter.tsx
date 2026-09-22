'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import PaintingCanvas, { type CanvasHandle } from './PaintingCanvas';
import { SetupCard, StepCard } from './JevPanel';
import { buildGesture } from '@/lib/gesture';
import { blankGrid } from '@/lib/grid';
import { PALETTE_BY_ID } from '@/lib/palettes';
import { currentLayer } from '@/lib/plan';
import type { Painting, Policy, SetupResponse, StepRecord, StepRequest, StepResponse } from '@/lib/types';

type Phase = 'idle' | 'setup' | 'painting' | 'saving' | 'done' | 'blocked' | 'error';

const EXAMPLES = ['a lighthouse in a storm', 'two cats sleeping in the sun', 'the city at night from a rooftop', 'a quiet forest lake at dawn', 'my grandmother’s kitchen', 'a jazz band on fire'];

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `${res.status} ${res.statusText}`);
  return data as T;
}

export default function Painter() {
  const canvas = useRef<CanvasHandle>(null);
  const stopRef = useRef(false);
  const [prompt, setPrompt] = useState('');
  const [steps, setSteps] = useState(30);
  const [policy, setPolicy] = useState<Policy>('sample');
  const [animMs, setAnimMs] = useState(250);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [setup, setSetup] = useState<SetupResponse | null>(null);
  const [records, setRecords] = useState<StepRecord[]>([]);
  const [current, setCurrent] = useState(0);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [tokens, setTokens] = useState(0);
  const startedAt = useRef(0);
  const [placeholder, setPlaceholder] = useState(EXAMPLES[0]);

  useEffect(() => {
    if (phase !== 'painting' && phase !== 'setup') return;
    const t = setInterval(() => setElapsed(Math.round((performance.now() - startedAt.current) / 100) / 10), 100);
    return () => clearInterval(t);
  }, [phase]);

  const run = useCallback(async () => {
    const text = prompt.trim();
    if (!text || !canvas.current) return;
    stopRef.current = false;
    setError(null);
    setSavedId(null);
    setRecords([]);
    setSetup(null);
    setCurrent(0);
    setTokens(0);
    startedAt.current = performance.now();
    setPhase('setup');
    const seed = Math.floor(Math.random() * 2 ** 31);
    let totalTokens = 0;
    try {
      const s = await post<SetupResponse>('/api/setup', { prompt: text, policy });
      totalTokens += s.inputTokens;
      setTokens(totalTokens);
      setSetup(s);
      if (s.blocked) {
        setPhase('blocked');
        return;
      }
      const palette = PALETTE_BY_ID[s.palette];
      await canvas.current.reset(palette.paper, seed);
      setPhase('painting');

      const history: StepRecord[] = [];
      let grid = blankGrid();
      for (let step = 1; step <= steps; step++) {
        if (stopRef.current) break;
        setCurrent(step);
        const req: StepRequest = {
          prompt: text,
          setup: { palette: s.palette, style: s.style, layout: s.layout, field: s.field },
          step,
          steps,
          policy,
          canvas: grid,
          history: history.map((h) => ({ step: h.step, layer: h.layer, decision: h.decision })),
        };
        const res = await post<StepResponse>('/api/step', req);
        totalTokens += res.inputTokens;
        setTokens(totalTokens);
        const record: StepRecord = {
          step,
          layer: res.layer,
          decision: res.decision,
          probabilities: res.probabilities,
          finished: res.finished,
          ms: res.ms,
          inputTokens: res.inputTokens,
        };
        history.push(record);
        setRecords([...history]);
        const gesture = buildGesture(res.decision, s.layout, s.palette, s.field, seed, step);
        await canvas.current.paint(gesture, animMs);
        grid = (await canvas.current.readGrid(palette)).text;
      }

      if (!history.length) {
        setPhase('idle');
        return;
      }
      setPhase('saving');
      const painting: Omit<Painting, 'id' | 'createdAt' | 'likes'> = {
        prompt: text,
        settings: { steps, policy, seed },
        setup: {
          blocked: s.blocked,
          moderation: s.moderation,
          palette: s.palette,
          style: s.style,
          layout: s.layout,
          field: s.field,
          probabilities: s.probabilities,
          ms: s.ms,
          inputTokens: s.inputTokens,
        },
        steps: history,
        totalMs: Math.round(performance.now() - startedAt.current),
        totalTokens,
      };
      const saved = await post<{ id: string }>('/api/paintings', { painting, png: canvas.current.toDataURL() });
      setSavedId(saved.id);
      setPlaceholder(EXAMPLES[(EXAMPLES.indexOf(placeholder) + 1) % EXAMPLES.length]);
      setPhase('done');
    } catch (err) {
      setError((err as Error).message);
      setPhase('error');
    }
  }, [prompt, steps, policy, animMs, placeholder]);

  const busy = phase === 'setup' || phase === 'painting' || phase === 'saving';
  const cost = (tokens * 0.042) / 1_000_000;
  const layer = setup && current ? currentLayer(setup.layout, steps, current).layer : null;
  const latest = records[records.length - 1];

  return (
    <div className="painter">
      <div className="canvas-col">
        <PaintingCanvas ref={canvas} className="canvas" />
        <div className="under-canvas">
          {busy && (
            <div className="progress">
              <div className="progress-bar" style={{ width: `${(current / steps) * 100}%` }} />
            </div>
          )}
          <div className="status muted">
            {phase === 'idle' && 'Tell Jev what to paint.'}
            {phase === 'setup' && 'Jev is choosing a palette, a style and a composition…'}
            {phase === 'painting' && `Step ${current} of ${steps} · ${layer} · ${elapsed}s`}
            {phase === 'saving' && 'Saving to the gallery…'}
            {phase === 'done' && `Done in ${elapsed}s · ${records.length} gestures · ${tokens.toLocaleString()} tokens ≈ $${cost.toFixed(4)}`}
            {phase === 'blocked' && 'Jev would rather not paint that one.'}
            {phase === 'error' && `Something broke: ${error}`}
          </div>
          {phase === 'done' && savedId && (
            <div className="actions">
              <a className="button" href={`/p/${savedId}`}>
                Open in gallery
              </a>
              <button className="button ghost" onClick={() => setPhase('idle')}>
                Paint another
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="side-col">
        <form
          className="card form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) void run();
          }}
        >
          <label className="field">
            <span className="label">What should Jev paint?</span>
            <input value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={300} placeholder={placeholder} disabled={busy} autoFocus />
          </label>
          <label className="field inline">
            <span className="label">Gestures: {steps}</span>
            <input type="range" min={10} max={100} step={1} value={steps} onChange={(e) => setSteps(Number(e.target.value))} disabled={busy} />
          </label>
          <div className="field inline">
            <span className="label">Jev picks by</span>
            <span className="segmented">
              <button type="button" className={policy === 'sample' ? 'on' : ''} onClick={() => setPolicy('sample')} disabled={busy}>
                drawing from his odds
              </button>
              <button type="button" className={policy === 'argmax' ? 'on' : ''} onClick={() => setPolicy('argmax')} disabled={busy}>
                his top pick
              </button>
            </span>
          </div>
          <label className="field inline">
            <span className="label">Stroke pace: {animMs} ms</span>
            <input type="range" min={0} max={800} step={50} value={animMs} onChange={(e) => setAnimMs(Number(e.target.value))} />
          </label>
          <div className="actions">
            {!busy ? (
              <button className="button primary" type="submit" disabled={!prompt.trim()}>
                Paint
              </button>
            ) : (
              <button className="button" type="button" onClick={() => (stopRef.current = true)} disabled={phase !== 'painting'}>
                Stop here and save
              </button>
            )}
          </div>
        </form>

        {setup && !setup.blocked && <SetupCard setup={setup} />}
        {setup?.blocked && (
          <div className="card">
            <div className="muted">
              Moderation: sexual {Math.round(setup.moderation.sexual * 100)}% · hateful {Math.round(setup.moderation.hate * 100)}% · gore {Math.round(setup.moderation.gore * 100)}%
            </div>
          </div>
        )}
        {latest && setup && <StepCard record={latest} layoutId={setup.layout} paletteId={setup.palette} />}
      </div>
    </div>
  );
}
