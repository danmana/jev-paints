import 'server-only';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { del, head, list, put } from '@vercel/blob';
import { encodeImages, type EncodedImages } from './images.server';
import type { Painting, PaintingSummary } from './types';

/**
 * Two backends behind one interface. With BLOB_READ_WRITE_TOKEN set (Vercel), every painting is
 * one JSON and one public PNG in Vercel Blob plus a small index for the gallery. Without it
 * (local dev), the same files live under data/paintings/.
 */
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const DIR = path.join(process.cwd(), 'data', 'paintings');
const PREFIX = 'paintings/';
const INDEX = `${PREFIX}index.json`;

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

// ---------------------------------------------------------------------------------------------
// Vercel Blob
// ---------------------------------------------------------------------------------------------

async function blobJson<T>(pathname: string): Promise<T | null> {
  let url: string;
  try {
    url = (await head(pathname)).url;
  } catch {
    return null;
  }
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

async function putJson(pathname: string, value: unknown) {
  await put(pathname, JSON.stringify(value), { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60 });
}

async function readIndex(): Promise<PaintingSummary[]> {
  return (await blobJson<PaintingSummary[]>(INDEX)) ?? [];
}

/** Puts one summary at the front of the index, or replaces it in place. */
async function upsertIndex(summary: PaintingSummary) {
  const index = await readIndex();
  const i = index.findIndex((x) => x.id === summary.id);
  if (i >= 0) index[i] = summary;
  else index.unshift(summary);
  await putJson(INDEX, index);
}

const IMAGE_OPTS = { access: 'public' as const, addRandomSuffix: false, allowOverwrite: true, contentType: 'image/webp', cacheControlMaxAge: 31536000 };

export async function uploadImages(id: string, images: EncodedImages): Promise<{ image: string; thumb: string }> {
  const [full, thumb] = await Promise.all([put(`${PREFIX}${id}.webp`, images.full, IMAGE_OPTS), put(`${PREFIX}${id}-thumb.webp`, images.thumb, IMAGE_OPTS)]);
  return { image: full.url, thumb: thumb.url };
}

// ---------------------------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------------------------

export async function savePainting(painting: Painting, png: Buffer): Promise<Painting> {
  safeId(painting.id);
  const images = await encodeImages(png);
  if (useBlob) {
    const urls = await uploadImages(painting.id, images);
    const stored: Painting = { ...painting, ...urls };
    await putJson(`${PREFIX}${painting.id}.json`, stored);
    await upsertIndex(summarize(stored));
    return stored;
  }
  await mkdir(DIR, { recursive: true });
  await writeFile(path.join(DIR, `${painting.id}.json`), JSON.stringify(painting, null, 2));
  await writeFile(path.join(DIR, `${painting.id}.webp`), images.full);
  await writeFile(path.join(DIR, `${painting.id}-thumb.webp`), images.thumb);
  return painting;
}

export async function loadPainting(id: string): Promise<Painting | null> {
  safeId(id);
  if (useBlob) return blobJson<Painting>(`${PREFIX}${id}.json`);
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
  if (useBlob) {
    const p = await loadPainting(id);
    return p?.image ? { url: p.image } : null;
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
  if (useBlob) return readIndex();
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

export async function likePainting(id: string, delta: 1 | -1 = 1): Promise<number> {
  const p = await loadPainting(id);
  if (!p) throw Object.assign(new Error('not found'), { status: 404 });
  p.likes = Math.max(0, (p.likes ?? 0) + delta);
  if (useBlob) {
    await putJson(`${PREFIX}${p.id}.json`, p);
    await upsertIndex(summarize(p));
  } else {
    await writeFile(path.join(DIR, `${p.id}.json`), JSON.stringify(p, null, 2));
  }
  return p.likes;
}

/** Rebuilds the gallery index from every painting JSON in the store. Used by the migration. */
export async function rebuildIndex(): Promise<number> {
  if (!useBlob) throw new Error('rebuildIndex needs BLOB_READ_WRITE_TOKEN');
  const summaries: PaintingSummary[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
    for (const b of page.blobs) {
      if (!b.pathname.endsWith('.json') || b.pathname === INDEX) continue;
      const res = await fetch(b.url, { cache: 'no-store' });
      if (res.ok) summaries.push(summarize((await res.json()) as Painting));
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  summaries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  await putJson(INDEX, summaries);
  return summaries.length;
}

export { del as deleteBlob };
