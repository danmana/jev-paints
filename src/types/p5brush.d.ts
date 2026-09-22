declare module 'p5.brush' {
  export function instance(p: unknown): void;
  export function load(buffer?: unknown): void;
  export function scaleBrushes(scale: number): void;
  export function box(): string[];
  export function seed(s: number): void;
  export function noiseSeed(s: number): void;

  export function set(brush: string, color: string, weight?: number): void;
  export function pick(brush: string): void;
  export function stroke(color: string): void;
  export function strokeWeight(weight: number): void;
  export function noStroke(): void;

  export function fill(color: string, opacity?: number): void;
  export function noFill(): void;
  export function fillBleed(strength: number, direction?: 'out' | 'in', angle?: number | null): void;
  export function fillTexture(texture?: number, border?: number, scatter?: boolean): void;
  export function wash(color: string, opacity?: number): void;
  export function noWash(): void;

  export function hatch(dist?: number, angle?: number, options?: { rand?: number | false; continuous?: boolean; gradient?: number | false }): void;
  export function hatchStyle(brush: string, color?: string, weight?: number): void;
  export function noHatch(): void;

  export function field(name: string): void;
  export function noField(): void;
  export function listFields(): string[];
  export function refreshField(t?: number): void;

  export function line(x1: number, y1: number, x2: number, y2: number): void;
  export function flowLine(x: number, y: number, length: number, dir: number): void;
  export function beginShape(curvature?: number): void;
  export function vertex(x: number, y: number, pressure?: number): void;
  export function endShape(close?: boolean): unknown;
  export function spline(points: Array<[number, number, number?]>, curvature?: number): unknown;
  export function circle(x: number, y: number, radius: number, irregular?: number | boolean): unknown;
  export function rect(x: number, y: number, w: number, h: number, mode?: 'corner' | 'center'): void;
  export function polygon(points: Array<[number, number]>): unknown;
}
