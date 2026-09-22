'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import PaintingCanvas, { type CanvasHandle } from './PaintingCanvas';
import { Judgment, Provenance } from './JevPanel';
import LikeButton from './LikeButton';
import ShareButton from './ShareButton';
import { buildGesture } from '@/lib/gesture';
import { blankGrid } from '@/lib/grid';
import { PALETTE_BY_ID } from '@/lib/palettes';
import { currentLayer } from '@/lib/plan';
import type { Policy, SaveRequest, SetupResponse, StepRecord, StepRequest, StepResponse } from '@/lib/types';
import { userHeaders } from '@/lib/user';

type Phase = 'idle' | 'setup' | 'painting' | 'saving' | 'done' | 'blocked' | 'error';

const EXAMPLES = ['a lighthouse in a storm', 'two cats asleep in the sun', 'the city at night from a rooftop', 'a quiet forest lake at dawn', 'my grandmother’s kitchen', 'a jazz band on fire'];

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...userHeaders() }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `${res.status} ${res.statusText}`);
  return data as T;
}

export default function Painter() {
  const canvas = useRef<CanvasHandle>(null);
  const input = useRef<HTMLInputElement>(null);
  const easel = useRef<HTMLElement>(null);
  const judgment = useRef<HTMLDivElement>(null);
  const stopRef = useRef(false);
  const [prompt, setPrompt] = useState('');
  const [steps, setSteps] = useState(50);
  const [policy, setPolicy] = useState<Policy>('sample');
  const [animMs, setAnimMs] = useState(250);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [setup, setSetup] = useState<SetupResponse | null>(null);
  const [painted, setPainted] = useState<string>('');
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
    setPainted(text);
    setCurrent(0);
    setTokens(0);
    startedAt.current = performance.now();
    setPhase('setup');
    // The question and controls are not needed while it paints: bring the canvas and its caption into view.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    easel.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    let totalTokens = 0;
    try {
      const s = await post<SetupResponse>('/api/setup', { prompt: text, policy, steps });
      // The server owns the session: its id, the seed and the step count are signed and come back with every request.
      const { session, sig: setupSig } = s;
      const seed = session.seed;
      const picks = { palette: s.palette, style: s.style, layout: s.layout, field: s.field };
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
      for (let step = 1; step <= session.steps; step++) {
        if (stopRef.current) break;
        setCurrent(step);
        const req: Omit<StepRequest, 'prompt' | 'steps' | 'policy'> = {
          session,
          setup: picks,
          setupSig,
          step,
          canvas: grid,
          history: history.map((h) => ({ step: h.step, layer: h.layer, decision: h.decision })),
        };
        const res = await post<StepResponse>('/api/step', req);
        totalTokens += res.inputTokens;
        setTokens(totalTokens);
        const record: StepRecord = { step, layer: res.layer, decision: res.decision, probabilities: res.probabilities, finished: res.finished, ms: res.ms, inputTokens: res.inputTokens, sig: res.sig };
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
      const save: SaveRequest = {
        session,
        setup: { blocked: s.blocked, moderation: s.moderation, ...picks, probabilities: s.probabilities, ms: s.ms, inputTokens: s.inputTokens },
        setupSig,
        steps: history,
        totalMs: Math.round(performance.now() - startedAt.current),
        image: canvas.current.toDataURL(),
      };
      const saved = await post<{ id: string }>('/api/paintings', save);
      setSavedId(saved.id);
      setPlaceholder(EXAMPLES[(EXAMPLES.indexOf(placeholder) + 1) % EXAMPLES.length]);
      setPhase('done');
    } catch (err) {
      setError((err as Error).message);
      setPhase('error');
    }
  }, [prompt, steps, policy, animMs, placeholder]);

  const startOver = async () => {
    setPhase('idle');
    setPrompt('');
    setPainted('');
    setSetup(null);
    setRecords([]);
    setSavedId(null);
    setCurrent(0);
    await canvas.current?.reset('#faf9f6', 0);
    input.current?.focus();
  };

  const busy = phase === 'setup' || phase === 'painting' || phase === 'saving';
  const cost = (tokens * 0.042) / 1_000_000;
  const layer = setup && current ? currentLayer(setup.layout, steps, current).layer : null;
  const latest = records[records.length - 1];

  const status = (() => {
    switch (phase) {
      case 'idle':
        return 'Nothing on the paper yet.';
      case 'setup':
        return 'Jev is choosing a palette, a style and a composition.';
      case 'painting':
        return `Gesture ${current} of ${steps}, painting the ${layer}. ${elapsed.toFixed(1)} seconds so far.`;
      case 'saving':
        return 'Saving to the gallery.';
      case 'done':
        return `Finished in ${elapsed.toFixed(1)} seconds with ${records.length} gestures, about $${cost.toFixed(3)} of Jev.`;
      case 'blocked':
        return 'Jev would rather not paint that one. Try a different subject.';
      case 'error':
        return `The painting stopped: ${error}. Try again.`;
    }
  })();

  return (
    <div className="studio">
      <section className="ask">
        <h1 className="question">What should Jev paint?</h1>
        <form
          className="prompt-line"
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) void run();
          }}
        >
          <input ref={input} value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={300} placeholder={placeholder} disabled={busy} autoFocus aria-label="What should Jev paint?" />
          {!busy ? (
            <button className="button primary" type="submit" disabled={!prompt.trim()}>
              Paint
            </button>
          ) : (
            <button className="button" type="button" onClick={() => (stopRef.current = true)} disabled={phase !== 'painting'}>
              Stop and keep it
            </button>
          )}
        </form>
        <div className="settings">
          <label className="setting">
            <span>{steps} gestures</span>
            <input type="range" min={10} max={100} step={1} value={steps} onChange={(e) => setSteps(Number(e.target.value))} disabled={busy} aria-label="Number of gestures" />
          </label>
          <span className="setting toggle" role="group" aria-label="How Jev picks">
            <button type="button" className={policy === 'sample' ? 'on' : ''} onClick={() => setPolicy('sample')} disabled={busy}>
              Weighted pick
            </button>
            <button type="button" className={policy === 'argmax' ? 'on' : ''} onClick={() => setPolicy('argmax')} disabled={busy}>
              Top pick
            </button>
          </span>
          <label className="setting">
            <span>{animMs === 0 ? 'instant strokes' : `${animMs} ms per gesture`}</span>
            <input type="range" min={0} max={800} step={50} value={animMs} onChange={(e) => setAnimMs(Number(e.target.value))} aria-label="Stroke pace" />
          </label>
        </div>
      </section>

      <figure className="easel" ref={easel}>
        <PaintingCanvas ref={canvas} className="canvas" />
        <figcaption className="caption">
          <p className="work">{painted ? painted : <span className="quiet">Untitled, not yet begun</span>}</p>
          {setup && !setup.blocked && <Provenance setup={setup} />}
          <div className="status">{status}</div>
          {busy && (
            <div className="progress" aria-hidden="true">
              <div className="progress-bar" style={{ width: `${(current / steps) * 100}%` }} />
            </div>
          )}
          {phase === 'done' && savedId && (
            <div className="actions">
              <LikeButton id={savedId} likes={0} variant="button" />
              <ShareButton id={savedId} variant="button" />
              <Link className="button" href={`/p/${savedId}`}>
                Open in the gallery
              </Link>
              <button className="button quiet" onClick={() => void startOver()}>
                Paint another
              </button>
            </div>
          )}
          {latest && setup && (
            <button
              type="button"
              className="more"
              aria-label="Scroll down to Jev's latest judgment"
              onClick={() => judgment.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })}
            >
              <svg width="18" height="10" viewBox="0 0 18 10" aria-hidden="true">
                <path d="M1 1l8 7 8-7" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </figcaption>
      </figure>

      {latest && setup && (
        <div ref={judgment} className="judgment-anchor">
          <Judgment record={latest} layoutId={setup.layout} paletteId={setup.palette} total={steps} />
        </div>
      )}
    </div>
  );
}
