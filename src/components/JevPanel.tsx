'use client';

import { BRUSHES, FIELDS, MODIFIERS, SIZES, WEIGHTS } from '@/lib/brushes';
import { LAYOUT_BY_ID } from '@/lib/layouts';
import { MOTIF_BY_ID } from '@/lib/motifs';
import { PALETTE_BY_ID } from '@/lib/palettes';
import { regionLabel } from '@/lib/plan';
import { STYLE_BY_ID } from '@/lib/styles';
import type { Probabilities, SetupResult, StepRecord } from '@/lib/types';

export function SetupCard({ setup }: { setup: Pick<SetupResult, 'palette' | 'style' | 'layout' | 'field'> }) {
  const palette = PALETTE_BY_ID[setup.palette];
  const style = STYLE_BY_ID[setup.style];
  const layout = LAYOUT_BY_ID[setup.layout];
  return (
    <div className="card">
      <div className="row">
        <span className="label">Palette</span>
        <span>
          {palette?.name}
          <span className="swatches">
            <i style={{ background: palette?.paper }} title={palette?.paperName} />
            {palette?.colors.map((c) => <i key={c.id} style={{ background: c.hex }} title={c.name} />)}
          </span>
        </span>
      </div>
      <div className="row">
        <span className="label">Style</span>
        <span>{style?.name}</span>
      </div>
      <div className="row">
        <span className="label">Composition</span>
        <span>{layout?.name}</span>
      </div>
      <div className="row">
        <span className="label">Strokes</span>
        <span>{FIELDS[setup.field]}</span>
      </div>
    </div>
  );
}

function label(question: string, id: string, layoutId: string, paletteId: string): string {
  switch (question) {
    case 'motif':
      return MOTIF_BY_ID[id]?.name ?? id;
    case 'region':
      return regionLabel(LAYOUT_BY_ID[layoutId] ?? LAYOUT_BY_ID.centered_subject, id);
    case 'color':
      return PALETTE_BY_ID[paletteId]?.colors.find((c) => c.id === id)?.name ?? id;
    case 'brush':
      return id in BRUSHES ? id : id;
    case 'size':
      return id in SIZES ? id : id;
    case 'modifier':
      return id in MODIFIERS ? id.replace('_', ' + ') : id;
    case 'weight':
      return id in WEIGHTS ? id : id;
    default:
      return id;
  }
}

const QUESTION_TITLES: Record<string, string> = {
  motif: 'gesture',
  region: 'where',
  size: 'size',
  brush: 'medium',
  color: 'colour',
  modifier: 'applied as',
  weight: 'weight',
};

export function Distribution({ question, probs, chosen, layoutId, paletteId }: { question: string; probs: Record<string, number>; chosen: string; layoutId: string; paletteId: string }) {
  const rows = Object.entries(probs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  if (!rows.some(([k]) => k === chosen)) rows.push([chosen, probs[chosen] ?? 0]);
  return (
    <div className="dist">
      <div className="dist-title">{QUESTION_TITLES[question] ?? question}</div>
      {rows.map(([k, v]) => (
        <div key={k} className={`bar ${k === chosen ? 'chosen' : ''}`}>
          <span className="bar-label">{label(question, k, layoutId, paletteId)}</span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: `${Math.round(v * 100)}%` }} />
          </span>
          <span className="bar-value">{Math.round(v * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

export function StepCard({ record, layoutId, paletteId }: { record: StepRecord; layoutId: string; paletteId: string }) {
  const d = record.decision;
  const probs: Probabilities = record.probabilities;
  return (
    <div className="card step-card">
      <div className="step-head">
        <strong>Step {record.step}</strong>
        <span className="muted">{record.layer}</span>
        <span className="muted right">
          {record.ms} ms · finished? {Math.round(record.finished * 100)}%
        </span>
      </div>
      <div className="decision">
        {label('motif', d.motif, layoutId, paletteId)} · {label('region', d.region, layoutId, paletteId)} · {d.size} · {d.brush} · {label('color', d.color, layoutId, paletteId)} · {d.modifier.replace('_', ' + ')} · {d.weight}
      </div>
      <div className="dists">
        {(['motif', 'region', 'color', 'brush', 'modifier', 'size', 'weight'] as const).map((q) => (
          <Distribution key={q} question={q} probs={probs[q] ?? {}} chosen={d[q]} layoutId={layoutId} paletteId={paletteId} />
        ))}
      </div>
    </div>
  );
}
