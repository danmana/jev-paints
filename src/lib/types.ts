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
  /** Server signature over session id, step, layer and decision. Absent on paintings from before signing. */
  sig?: string;
}

/** One painting in progress. Created by the server at setup and signed, so the browser cannot change it. */
export interface Session {
  id: string;
  seed: number;
  prompt: string;
  steps: number;
  policy: Policy;
}

export const MAX_STEPS = 100;

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
  /** Full-size image URL. Absent for paintings stored on the local disk. */
  image?: string;
  /** Small gallery image. Absent for local paintings and paintings saved before thumbnails existed. */
  thumb?: string;
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
  thumb?: string;
}

/** The URL a page should use for a painting's full-size image. */
export function imageUrl(p: { id: string; image?: string }): string {
  return p.image ?? `/api/paintings/${p.id}/image`;
}

/** The URL for a gallery tile: the thumbnail when there is one. */
export function thumbUrl(p: { id: string; image?: string; thumb?: string }): string {
  return p.thumb ?? imageUrl(p);
}

/** What one step sends to the server. The server builds the Jev state from it. */
export type SetupPicks = Pick<SetupResult, 'palette' | 'style' | 'layout' | 'field'>;

export interface StepRequest {
  session: Session;
  setup: SetupPicks;
  /** Signature the setup route issued over the session and the picks. */
  setupSig: string;
  step: number;
  canvas: Record<string, string>;
  history: Array<Pick<StepRecord, 'step' | 'layer' | 'decision'>>;
  /** Filled in by the server from the verified session. */
  prompt: string;
  steps: number;
  policy: Policy;
}

export interface StepResponse {
  decision: StepDecision;
  layer: string;
  probabilities: Probabilities;
  finished: number;
  ms: number;
  inputTokens: number;
  sig: string;
  prompt: { state: unknown; questions: unknown };
}

export interface SetupResponse extends SetupResult {
  session: Session;
  sig: string;
  prompt: { state: unknown; questions: unknown };
}

/** What the browser sends to save a finished painting. Everything but the pixels is signed. */
export interface SaveRequest {
  session: Session;
  setup: SetupResult;
  setupSig: string;
  steps: StepRecord[];
  totalMs: number;
  /** The canvas as a data URL, WebP preferred: PNG can push the request past Vercel's 4.5 MB body limit. */
  image: string;
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
