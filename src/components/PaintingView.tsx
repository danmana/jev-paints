'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import PaintingCanvas, { type CanvasHandle } from './PaintingCanvas';
import { SetupCard, StepCard } from './JevPanel';
import { buildGesture } from '@/lib/gesture';
import { PALETTE_BY_ID } from '@/lib/palettes';
import type { Painting } from '@/lib/types';

export default function PaintingView({ painting }: { painting: Painting }) {
  const canvas = useRef<CanvasHandle>(null);
  const [replaying, setReplaying] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [step, setStep] = useState(0);
  const [likes, setLikes] = useState(painting.likes ?? 0);
  const [liked, setLiked] = useState(false);
  const [openStep, setOpenStep] = useState<number | null>(null);

  const replay = async () => {
    setShowCanvas(true);
    setReplaying(true);
    setStep(0);
    // Give the canvas a moment to mount before the first call.
    await new Promise((r) => setTimeout(r, 50));
    const c = canvas.current;
    if (!c) return;
    const palette = PALETTE_BY_ID[painting.setup.palette];
    await c.reset(palette.paper, painting.settings.seed);
    for (const rec of painting.steps) {
      setStep(rec.step);
      const g = buildGesture(rec.decision, painting.setup.layout, painting.setup.palette, painting.setup.field, painting.settings.seed, rec.step);
      await c.paint(g, 250);
    }
    setReplaying(false);
  };

  const like = async () => {
    if (liked) return;
    setLiked(true);
    setLikes((n) => n + 1);
    try {
      const res = await fetch(`/api/paintings/${painting.id}/like`, { method: 'POST' });
      const data = (await res.json()) as { likes?: number };
      if (typeof data.likes === 'number') setLikes(data.likes);
    } catch {
      // the optimistic count stands
    }
  };

  const cost = ((painting.totalTokens ?? 0) * 0.042) / 1_000_000;

  return (
    <div className="painter">
      <div className="canvas-col">
        {showCanvas ? (
          <PaintingCanvas ref={canvas} className="canvas" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="canvas" src={`/api/paintings/${painting.id}/image`} alt={painting.prompt} width={600} height={600} />
        )}
        <div className="under-canvas">
          <div className="status muted">
            {replaying ? `Replaying step ${step} of ${painting.steps.length}` : `${painting.steps.length} gestures · ${Math.round((painting.totalMs ?? 0) / 100) / 10}s · ≈ $${cost.toFixed(4)}`}
          </div>
          <div className="actions">
            <button className={`button ${liked ? 'liked' : ''}`} onClick={like} disabled={liked}>
              ♥ {likes}
            </button>
            <button className="button" onClick={replay} disabled={replaying}>
              Replay
            </button>
            <Link className="button ghost" href="/">
              Paint your own
            </Link>
          </div>
        </div>
      </div>
      <div className="side-col">
        <div className="card">
          <h2 className="prompt">“{painting.prompt}”</h2>
          <div className="muted">
            {new Date(painting.createdAt).toLocaleString('en-GB')} · Jev picked by {painting.settings.policy === 'sample' ? 'drawing from his odds' : 'his top pick'}
          </div>
        </div>
        <SetupCard setup={painting.setup} />
        <div className="card">
          <div className="label">Every gesture</div>
          <ol className="steps">
            {painting.steps.map((s) => (
              <li key={s.step} className={openStep === s.step ? 'open' : ''} onClick={() => setOpenStep(openStep === s.step ? null : s.step)}>
                <span className="muted">{s.step}.</span> {s.layer} · {s.decision.motif.replace(/_/g, ' ')} · {s.decision.region} · {s.decision.brush} · {s.decision.color.replace(/_/g, ' ')} · {s.decision.modifier.replace('_', ' + ')}
              </li>
            ))}
          </ol>
        </div>
        {openStep !== null && painting.steps[openStep - 1] && <StepCard record={painting.steps[openStep - 1]} layoutId={painting.setup.layout} paletteId={painting.setup.palette} />}
      </div>
    </div>
  );
}
