/* p5 2.x publishes no usable type file, so the instance is typed loosely and wrapped in PaintingCanvas. */
declare module 'p5' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type P5Instance = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p5: any;
  export default p5;
  export type { P5Instance };
}
