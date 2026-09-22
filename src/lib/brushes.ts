import type { FieldId, ModifierId, SizeId, WeightId } from './types';

/** The eleven brushes shipped with p5.brush 2.2, described as media. */
export const BRUSHES: Record<string, string> = {
  '2B': 'soft dark graphite pencil',
  HB: 'ordinary pencil, medium grey line',
  '2H': 'hard light pencil, faint thin line',
  cpencil: 'coloured pencil, grainy line',
  pastel: 'soft pastel stick, chalky broad mark',
  crayon: 'wax crayon, waxy uneven mark',
  pen: 'ink pen, clean dark line',
  rotring: 'technical ink pen, very thin precise line',
  spray: 'spray can, soft airbrushed cloud of paint',
  marker: 'felt marker, bold flat opaque line',
  charcoal: 'charcoal stick, smudgy black mark',
};

export const MODIFIERS: Record<ModifierId, string> = {
  stroke: 'outline or line only, no filling',
  fill: 'filled solidly with paint, no outline',
  bleed: 'filled with a watercolour wash that bleeds and feathers at the edges',
  wash: 'a light transparent wash of colour, the paper shows through',
  hatch: 'the shape is filled with parallel hatching lines',
  fill_and_stroke: 'filled with paint and outlined',
};

export const SIZES: Record<SizeId, string> = {
  small: 'small: a detail, roughly a third of the chosen region',
  medium: 'medium: about two thirds of the chosen region',
  large: 'large: fills the whole chosen region',
};

export const WEIGHTS: Record<WeightId, string> = {
  fine: 'fine, thin marks',
  medium: 'medium marks',
  bold: 'bold, thick marks',
};

export const FIELDS: Record<FieldId, string> = {
  none: 'straight, steady strokes',
  hand: 'slightly wobbly hand-drawn strokes',
  curved: 'strokes that bend gently in one direction',
  zigzag: 'strokes that zigzag',
  waves: 'strokes that undulate like waves',
  seabed: 'strokes that ripple irregularly',
  spiral: 'strokes that curl around the centre of the canvas',
  columns: 'strokes that fall into vertical columns',
};

export const WEIGHT_VALUE: Record<WeightId, number> = { fine: 0.6, medium: 1.1, bold: 1.9 };
export const SIZE_VALUE: Record<SizeId, number> = { small: 0.35, medium: 0.65, large: 1 };
