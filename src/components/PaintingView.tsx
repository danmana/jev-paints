'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import PaintingCanvas, { type CanvasHandle } from './PaintingCanvas';
import { colorHex, Judgment, label, Provenance } from './JevPanel';
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
  const when = new Date(painting.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const { layout, palette } = painting.setup;

  return (
    <div className="studio">
      <figure className="easel">
        {showCanvas ? (
          <PaintingCanvas ref={canvas} className="canvas" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="canvas" src={`/api/paintings/${painting.id}/image`} alt={painting.prompt} width={600} height={600} />
        )}
        <figcaption className="caption">
          <p className="work">{painting.prompt}</p>
          <Provenance setup={painting.setup} />
          <div className="status">
            {replaying
              ? `Replaying gesture ${step} of ${painting.steps.length}.`
              : `${painting.steps.length} gestures in ${Math.round((painting.totalMs ?? 0) / 100) / 10} seconds, about $${cost.toFixed(3)} of Jev. Painted ${when}, Jev ${painting.settings.policy === 'sample' ? 'drawing from his odds' : 'taking his top pick'}.`}
          </div>
          <div className="actions">
            <button className={`button ${liked ? 'liked' : ''}`} onClick={like} disabled={liked} aria-label="Like this painting">
              ♥ {likes}
            </button>
            <button className="button" onClick={replay} disabled={replaying}>
              Watch it again
            </button>
            <Link className="button quiet" href="/">
              Paint your own
            </Link>
          </div>
        </figcaption>
      </figure>

      <section className="provenance-list">
        <h2>Every gesture, in order</h2>
        <ol className="steps">
          {painting.steps.map((s) => (
            <li key={s.step} className={openStep === s.step ? 'open' : ''} onClick={() => setOpenStep(openStep === s.step ? null : s.step)}>
              <span className="n">{s.step}</span>
              <span>
                <i className="swatch" style={{ background: colorHex(palette, s.decision.color) }} />
                {label('motif', s.decision.motif, layout, palette)} at the {label('region', s.decision.region, layout, palette)}, {s.decision.brush}
                {label('region', s.decision.region, layout, palette) !== s.layer ? `, while painting the ${s.layer}` : ''}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {openStep !== null && painting.steps[openStep - 1] && <Judgment record={painting.steps[openStep - 1]} layoutId={layout} paletteId={palette} total={painting.steps.length} />}
    </div>
  );
}
