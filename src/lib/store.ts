import 'server-only';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Painting, PaintingSummary } from './types';

/** Local storage for now: data/paintings/<id>.json + <id>.png. A database and blob storage come later. */
const DIR = path.join(process.cwd(), 'data', 'paintings');

async function ensureDir() {
  await mkdir(DIR, { recursive: true });
}

function safeId(id: string) {
  if (!/^[a-zA-Z0-9_-]{4,64}$/.test(id)) throw Object.assign(new Error('bad id'), { status: 400 });
  return id;
}

export function newId(): string {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 7);
  return `${stamp}-${rand}`;
}

export async function savePainting(painting: Painting, pngBase64: string): Promise<void> {
  await ensureDir();
  safeId(painting.id);
  await writeFile(path.join(DIR, `${painting.id}.json`), JSON.stringify(painting, null, 2));
  await writeFile(path.join(DIR, `${painting.id}.png`), Buffer.from(pngBase64, 'base64'));
}

export async function loadPainting(id: string): Promise<Painting | null> {
  try {
    const text = await readFile(path.join(DIR, `${safeId(id)}.json`), 'utf8');
    return JSON.parse(text) as Painting;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

export async function loadImage(id: string): Promise<Buffer | null> {
  try {
    return await readFile(path.join(DIR, `${safeId(id)}.png`));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

export async function listPaintings(): Promise<PaintingSummary[]> {
  await ensureDir();
  const files = (await readdir(DIR)).filter((f) => f.endsWith('.json')).sort().reverse();
  const out: PaintingSummary[] = [];
  for (const f of files) {
    try {
      const p = JSON.parse(await readFile(path.join(DIR, f), 'utf8')) as Painting;
      out.push({
        id: p.id,
        createdAt: p.createdAt,
        prompt: p.prompt,
        palette: p.setup.palette,
        style: p.setup.style,
        layout: p.setup.layout,
        steps: p.steps.length,
        likes: p.likes ?? 0,
      });
    } catch {
      // a half-written file is skipped rather than breaking the gallery
    }
  }
  return out;
}

export async function likePainting(id: string): Promise<number> {
  const p = await loadPainting(id);
  if (!p) throw Object.assign(new Error('not found'), { status: 404 });
  p.likes = (p.likes ?? 0) + 1;
  await writeFile(path.join(DIR, `${p.id}.json`), JSON.stringify(p, null, 2));
  return p.likes;
}
