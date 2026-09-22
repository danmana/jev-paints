import 'server-only';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { del, get, put } from '@vercel/blob';
import { db, hasDb, type PaintingRow } from './db.server';
import { encodeImages, type EncodedImages } from './images.server';
import type { Painting, PaintingSummary } from './types';

/**
 * Production: the decisions JSON and the two WebP images are written once to Vercel Blob, and one
 * row per painting in Supabase Postgres carries the gallery index and the like count. Blob is
 * never overwritten, so its CDN cache is harmless; the only mutable state is in Postgres.
 *
 * Local dev without the Blob token and Supabase keys: everything under data/paintings/.
 */
const useCloud = !!process.env.BLOB_READ_WRITE_TOKEN && hasDb();
const DIR = path.join(process.cwd(), 'data', 'paintings');
const PREFIX = 'paintings/';
const TABLE = 'paintings';

function safeId(id: string) {
  if (!/^[a-zA-Z0-9_-]{4,64}$/.test(id)) throw Object.assign(new Error('bad id'), { status: 400 });
  return id;
}

export function newId(): string {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 7);
  return `${stamp}-${rand}`;
}

export function summarize(p: Painting): PaintingSummary {
  return {
    id: p.id,
    createdAt: p.createdAt,
    prompt: p.prompt,
    palette: p.setup.palette,
    style: p.setup.style,
    layout: p.setup.layout,
    steps: p.steps.length,
    likes: p.likes ?? 0,
    ...(p.image ? { image: p.image } : {}),
    ...(p.thumb ? { thumb: p.thumb } : {}),
  };
}

function rowToSummary(r: PaintingRow): PaintingSummary {
  return { id: r.id, createdAt: r.created_at, prompt: r.prompt, palette: r.palette, style: r.style, layout: r.layout, steps: r.steps, likes: r.likes, image: r.image, thumb: r.thumb };
}

// ---------------------------------------------------------------------------------------------
// Blob: immutable files
// ---------------------------------------------------------------------------------------------

const JSON_OPTS = { access: 'public' as const, addRandomSuffix: false, allowOverwrite: false, contentType: 'application/json', cacheControlMaxAge: 31536000 };
const IMAGE_OPTS = { access: 'public' as const, addRandomSuffix: false, allowOverwrite: false, contentType: 'image/webp', cacheControlMaxAge: 31536000 };

async function blobJson<T>(pathname: string): Promise<T | null> {
  let result;
  try {
    result = await get(pathname, { access: 'public' });
  } catch {
    return null;
  }
  if (!result || result.statusCode !== 200) return null;
  return JSON.parse(await new Response(result.stream).text()) as T;
}

export async function uploadImages(id: string, images: EncodedImages): Promise<{ image: string; thumb: string }> {
  const [full, thumb] = await Promise.all([put(`${PREFIX}${id}.webp`, images.full, IMAGE_OPTS), put(`${PREFIX}${id}-thumb.webp`, images.thumb, IMAGE_OPTS)]);
  return { image: full.url, thumb: thumb.url };
}

// ---------------------------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------------------------

export async function savePainting(painting: Painting, imageBytes: Buffer, createdBy: string | null): Promise<Painting> {
  safeId(painting.id);
  const images = await encodeImages(imageBytes);
  if (useCloud) {
    const urls = await uploadImages(painting.id, images);
    const stored: Painting = { ...painting, ...urls, likes: 0 };
    const json = await put(`${PREFIX}${painting.id}.json`, JSON.stringify(stored), JSON_OPTS);
    const row: PaintingRow = {
      id: stored.id,
      created_at: stored.createdAt,
      prompt: stored.prompt,
      palette: stored.setup.palette,
      style: stored.setup.style,
      layout: stored.setup.layout,
      steps: stored.steps.length,
      likes: 0,
      image: urls.image,
      thumb: urls.thumb,
      json_url: json.url,
      created_by: createdBy,
    };
    const { error } = await db().from(TABLE).insert(row);
    if (error) throw new Error(`db insert failed: ${error.message}`);
    return stored;
  }
  await mkdir(DIR, { recursive: true });
  await writeFile(path.join(DIR, `${painting.id}.json`), JSON.stringify(painting, null, 2));
  await writeFile(path.join(DIR, `${painting.id}.webp`), images.full);
  await writeFile(path.join(DIR, `${painting.id}-thumb.webp`), images.thumb);
  return painting;
}

/** The full painting: decisions from the Blob JSON, the live like count from the row. */
export async function loadPainting(id: string): Promise<Painting | null> {
  safeId(id);
  if (useCloud) {
    const [{ data: row }, json] = await Promise.all([db().from(TABLE).select('*').eq('id', id).maybeSingle<PaintingRow>(), blobJson<Painting>(`${PREFIX}${id}.json`)]);
    if (!row || !json) return null;
    return { ...json, likes: row.likes, image: row.image, thumb: row.thumb };
  }
  try {
    return JSON.parse(await readFile(path.join(DIR, `${id}.json`), 'utf8')) as Painting;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

/** Local image bytes with their type, or the public URL when the painting lives in Blob. */
export async function loadImage(id: string): Promise<{ bytes?: Buffer; contentType?: string; url?: string } | null> {
  safeId(id);
  if (useCloud) {
    const { data: row } = await db().from(TABLE).select('image').eq('id', id).maybeSingle<Pick<PaintingRow, 'image'>>();
    return row?.image ? { url: row.image } : null;
  }
  for (const [ext, contentType] of [
    ['webp', 'image/webp'],
    ['png', 'image/png'],
  ]) {
    try {
      return { bytes: await readFile(path.join(DIR, `${id}.${ext}`)), contentType };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }
  return null;
}

export async function listPaintings(): Promise<PaintingSummary[]> {
  if (useCloud) {
    const { data, error } = await db().from(TABLE).select('*').order('created_at', { ascending: false }).limit(500).returns<PaintingRow[]>();
    if (error) throw new Error(`db select failed: ${error.message}`);
    return data.map(rowToSummary);
  }
  await mkdir(DIR, { recursive: true });
  const files = (await readdir(DIR)).filter((f) => f.endsWith('.json')).sort().reverse();
  const out: PaintingSummary[] = [];
  for (const f of files) {
    try {
      out.push(summarize(JSON.parse(await readFile(path.join(DIR, f), 'utf8')) as Painting));
    } catch {
      // a half-written file is skipped rather than breaking the gallery
    }
  }
  return out;
}

/**
 * Like or unlike as one anonymous user. Atomic in Postgres (one row per user and painting, then a
 * recount); the local fallback only keeps the counter.
 */
export async function setLike(id: string, userId: string, liked: boolean): Promise<{ liked: boolean; likes: number }> {
  safeId(id);
  if (useCloud) {
    const { data, error } = await db().rpc('set_like', { p_id: id, p_user: userId, p_liked: liked });
    if (error) throw new Error(`like failed: ${error.message}`);
    const row = (data as Array<{ liked: boolean; likes: number }> | null)?.[0];
    if (!row) throw Object.assign(new Error('not found'), { status: 404 });
    return row;
  }
  const p = await loadPainting(id);
  if (!p) throw Object.assign(new Error('not found'), { status: 404 });
  p.likes = Math.max(0, (p.likes ?? 0) + (liked ? 1 : -1));
  await writeFile(path.join(DIR, `${p.id}.json`), JSON.stringify(p, null, 2));
  return { liked, likes: p.likes };
}

/** Which of the given paintings this user has liked. Used to paint the hearts red on first render. */
export async function likedBy(userId: string, ids: string[]): Promise<Set<string>> {
  if (!useCloud || !ids.length) return new Set();
  const { data } = await db().from('likes').select('painting_id').eq('user_id', userId).in('painting_id', ids).returns<Array<{ painting_id: string }>>();
  return new Set((data ?? []).map((r) => r.painting_id));
}

export { del as deleteBlob };
