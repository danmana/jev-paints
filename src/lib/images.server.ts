import 'server-only';
import sharp from 'sharp';

export const THUMB_PX = 400;
export const CANVAS_PX = 1200;
export const MAX_UPLOAD_BYTES = 2_500_000;

export interface EncodedImages {
  full: Buffer;
  thumb: Buffer;
}

/** Throws unless the bytes are a real WebP or PNG of exactly the canvas size. */
export async function checkCanvasImage(bytes: Buffer): Promise<void> {
  if (bytes.length > MAX_UPLOAD_BYTES) throw Object.assign(new Error('image too large'), { status: 413 });
  const meta = await sharp(bytes).metadata();
  if (meta.format !== 'webp' && meta.format !== 'png') throw Object.assign(new Error('image must be WebP or PNG'), { status: 400 });
  if (meta.width !== CANVAS_PX || meta.height !== CANVAS_PX) throw Object.assign(new Error(`image must be ${CANVAS_PX} by ${CANVAS_PX}`), { status: 400 });
}

/** The canvas image becomes a full-size WebP and a small gallery WebP, both re-encoded here. */
export async function encodeImages(bytes: Buffer): Promise<EncodedImages> {
  const base = sharp(bytes);
  const [full, thumb] = await Promise.all([
    base.clone().webp({ quality: 84 }).toBuffer(),
    base.clone().resize(THUMB_PX, THUMB_PX, { fit: 'cover' }).webp({ quality: 78 }).toBuffer(),
  ]);
  return { full, thumb };
}
