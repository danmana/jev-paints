/** Shared types for Jev Paints. Everything Jev decides is an id from one of the libraries in this folder. */

export const CANVAS_SIZE = 600;

export interface ColorDef {
  id: string;
  name: string;
  hex: string;
}

export interface Palette {
  id: string;
  name: string;
  /** One line for Jev: the mood the colours carry. */
  mood: string;
  paper: string;
  paperName: string;
  colors: ColorDef[];
}

export interface StyleDef {
  id: string;
  name: string;
  description: string;
}

/** Normalised box on the canvas: [x0, y0, x1, y1] with 0..1 on both axes, y down. */
export type Box = [number, number, number, number];

export interface Region {
  id: string;
  name: string;
  description: string;
  box: Box;
}

export interface Phase {
  layer: string;
  description: string;
  /** Share of the total steps this phase gets; shares in a layout sum to 1. */
  share: number;
}

export interface Layout {
  id: string;
  name: string;
  description: string;
  regions: Region[];
  phases: Phase[];
}

export type MotifKind = 'lines' | 'shape';

export interface MotifDef {
  id: string;
  name: string;
  description: string;
  kind: MotifKind;
}

export type ModifierId = 'stroke' | 'fill' | 'bleed' | 'wash' | 'hatch' | 'fill_and_stroke';
export type SizeId = 'small' | 'medium' | 'large';
export type WeightId = 'fine' | 'medium' | 'bold';
export type FieldId = 'none' | 'hand' | 'curved' | 'zigzag' | 'waves' | 'seabed' | 'spiral' | 'columns';
export type Policy = 'argmax' | 'sample';

export interface StepDecision {
  motif: string;
  region: string;
  size: SizeId;
  brush: string;
  color: string;
  modifier: ModifierId;
  weight: WeightId;
}

export type Probabilities = Record<string, Record<string, number>>;

export interface SetupResult {
  blocked: boolean;
  moderation: { sexual: number; hate: number; gore: number };
  palette: string;
  style: string;
  layout: string;
  field: FieldId;
  probabilities: Probabilities;
  ms: number;
  inputTokens: number;
}

export interface StepRecord {
  step: number;
  layer: string;
  decision: StepDecision;
  probabilities: Probabilities;
  /** Jev's probability that the painting is finished as it stands, before this gesture. */
  finished: number;
  ms: number;
  inputTokens: number;
}

export interface PaintingSettings {
  steps: number;
  policy: Policy;
  seed: number;
}

export interface Painting {
  id: string;
  createdAt: string;
  prompt: string;
  settings: PaintingSettings;
  setup: SetupResult;
  steps: StepRecord[];
  likes: number;
  totalMs: number;
  totalTokens: number;
  parentId?: string;
  /** Where the PNG lives. Absent for paintings stored on the local disk. */
  image?: string;
}

export interface PaintingSummary {
  id: string;
  createdAt: string;
  prompt: string;
  palette: string;
  style: string;
  layout: string;
  steps: number;
  likes: number;
  image?: string;
}

/** The URL a page should use for a painting's PNG. */
export function imageUrl(p: { id: string; image?: string }): string {
  return p.image ?? `/api/paintings/${p.id}/image`;
}

/** What one step sends to the server. The server builds the Jev state from it. */
export interface StepRequest {
  prompt: string;
  setup: Pick<SetupResult, 'palette' | 'style' | 'layout' | 'field'>;
  step: number;
  steps: number;
  policy: Policy;
  canvas: Record<string, string>;
  history: Array<Pick<StepRecord, 'step' | 'layer' | 'decision'>>;
}

export interface StepResponse {
  decision: StepDecision;
  layer: string;
  probabilities: Probabilities;
  finished: number;
  ms: number;
  inputTokens: number;
  prompt: { state: unknown; questions: unknown };
}

export interface SetupResponse extends SetupResult {
  prompt: { state: unknown; questions: unknown };
}

/** Drawing primitives the canvas executes. Coordinates are canvas pixels, origin top-left. */
export type Op =
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { t: 'flow'; x: number; y: number; len: number; dir: number }
  | { t: 'shape'; pts: Array<[number, number, number?]>; close: boolean; curvature: number }
  | { t: 'circle'; x: number; y: number; r: number; irregular: number }
  | { t: 'spline'; pts: Array<[number, number, number?]>; curvature: number };

export interface GestureStyle {
  brush: string;
  color: string;
  weight: number;
  modifier: ModifierId;
  kind: MotifKind;
  field: FieldId;
  fillOpacity: number;
  bleed: number;
  hatchDist: number;
  hatchAngle: number;
}

export interface Gesture {
  style: GestureStyle;
  ops: Op[];
}
