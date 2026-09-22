'use client';

import { FIELDS } from '@/lib/brushes';
import { LAYOUT_BY_ID } from '@/lib/layouts';
import { MOTIF_BY_ID } from '@/lib/motifs';
import { PALETTE_BY_ID } from '@/lib/palettes';
import { regionLabel } from '@/lib/plan';
import { STYLE_BY_ID } from '@/lib/styles';
import type { Probabilities, SetupResult, StepRecord } from '@/lib/types';

type Setup = Pick<SetupResult, 'palette' | 'style' | 'layout' | 'field'>;

/** One plain sentence about the choices Jev made before the first stroke, like a museum label. */
export function Provenance({ setup }: { setup: Setup }) {
  const palette = PALETTE_BY_ID[setup.palette];
  const style = STYLE_BY_ID[setup.style];
  const layout = LAYOUT_BY_ID[setup.layout];
  return (
    <p className="provenance">
      {palette?.name} palette, after {style?.name}.
      <span className="swatches">
        <i style={{ background: palette?.paper }} title={palette?.paperName} />
        {palette?.colors.map((c) => <i key={c.id} style={{ background: c.hex }} title={c.name} />)}
      </span>
      <br />
      {layout?.name}, {FIELDS[setup.field]}.
    </p>
  );
}

export function label(question: string, id: string, layoutId: string, paletteId: string): string {
  switch (question) {
    case 'motif':
      return MOTIF_BY_ID[id]?.name ?? id;
    case 'region':
      return regionLabel(LAYOUT_BY_ID[layoutId] ?? LAYOUT_BY_ID.centered_subject, id);
    case 'color':
      return PALETTE_BY_ID[paletteId]?.colors.find((c) => c.id === id)?.name ?? id;
    case 'modifier':
      return id.replace('_and_', ' and ');
    default:
      return id;
  }
}

export function colorHex(paletteId: string, colorId: string): string | undefined {
  return PALETTE_BY_ID[paletteId]?.colors.find((c) => c.id === colorId)?.hex;
}

const QUESTION_TITLES: Record<string, string> = {
  motif: 'Which gesture',
  region: 'Where',
  color: 'Which colour',
  brush: 'Which medium',
  modifier: 'How the paint goes on',
  size: 'How big',
  weight: 'How heavy the marks',
};

export function Distribution({ question, probs, chosen, layoutId, paletteId }: { question: string; probs: Record<string, number>; chosen: string; layoutId: string; paletteId: string }) {
  const rows = Object.entries(probs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  if (!rows.some(([k]) => k === chosen)) rows.push([chosen, probs[chosen] ?? 0]);
  return (
    <div className="dist">
      <div className="dist-title">{QUESTION_TITLES[question] ?? question}</div>
      {rows.map(([k, v]) => {
        const tint = question === 'color' ? colorHex(paletteId, k) : undefined;
        return (
          <div key={k} className={`bar ${k === chosen ? 'chosen' : ''}`}>
            <span className="bar-label">{label(question, k, layoutId, paletteId)}</span>
            <span className="bar-track">
              <span className="bar-fill" style={{ width: `${Math.round(v * 100)}%`, ...(tint ? { background: tint } : {}) }} />
            </span>
            <span className="bar-value">{Math.round(v * 100)}%</span>
          </div>
        );
      })}
    </div>
  );
}

/** The decision as a sentence, so the judgment reads like a caption rather than a data row. */
export function decisionSentence(record: StepRecord, layoutId: string, paletteId: string): string {
  const d = record.decision;
  const how = d.modifier === 'stroke' ? 'as strokes' : d.modifier === 'fill_and_stroke' ? 'filled and outlined' : d.modifier === 'hatch' ? 'as hatching' : `as a ${d.modifier}`;
  const motif = label('motif', d.motif, layoutId, paletteId);
  const article = /^[aeiou]/i.test(d.size) ? 'An' : 'A';
  return `${article} ${d.size} ${motif} at the ${label('region', d.region, layoutId, paletteId)}: ${label('color', d.color, layoutId, paletteId)} ${d.brush} with ${d.weight} marks, ${how}.`;
}

export function Judgment({ record, layoutId, paletteId, total }: { record: StepRecord; layoutId: string; paletteId: string; total?: number }) {
  const probs: Probabilities = record.probabilities;
  return (
    <section className="judgment">
      <div className="judgment-head">
        <h2>
          Gesture {record.step}
          {total ? ` of ${total}` : ''}, <em>{record.layer}</em>
        </h2>
        <span className="meta">
          Jev answered in {record.ms} ms and felt the painting was {Math.round(record.finished * 100)}% finished before this one.
        </span>
      </div>
      <p className="decision">{decisionSentence(record, layoutId, paletteId)}</p>
      <div className="dists">
        {(['motif', 'region', 'color', 'brush', 'modifier', 'size', 'weight'] as const).map((q) => (
          <Distribution key={q} question={q} probs={probs[q] ?? {}} chosen={record.decision[q]} layoutId={layoutId} paletteId={paletteId} />
        ))}
      </div>
    </section>
  );
}
