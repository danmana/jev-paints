/**
 * Uploads every local painting (data/paintings/<id>.json + .png) to Vercel Blob and rebuilds the
 * gallery index. Safe to rerun: paintings already in the store are skipped.
 *
 *   node --env-file=.env.local scripts/migrate-to-blob.ts
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { head, list, put } from '@vercel/blob';

const DIR = path.join(process.cwd(), 'data', 'paintings');
const PREFIX = 'paintings/';
const CONCURRENCY = 4;

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN is not set; run with --env-file=.env.local');
  process.exit(1);
}

interface Summary {
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

async function exists(pathname: string) {
  try {
    await head(pathname);
    return true;
  } catch {
    return false;
  }
}

async function migrateOne(id: string): Promise<'uploaded' | 'skipped'> {
  const jsonPath = `${PREFIX}${id}.json`;
  if (await exists(jsonPath)) return 'skipped';
  const painting = JSON.parse(await readFile(path.join(DIR, `${id}.json`), 'utf8'));
  const png = await readFile(path.join(DIR, `${id}.png`));
  const { url } = await put(`${PREFIX}${id}.png`, png, { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'image/png', cacheControlMaxAge: 31536000 });
  painting.image = url;
  await put(jsonPath, JSON.stringify(painting), { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60 });
  return 'uploaded';
}

async function rebuildIndex(): Promise<number> {
  const summaries: Summary[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
    for (const b of page.blobs) {
      if (!b.pathname.endsWith('.json') || b.pathname === `${PREFIX}index.json`) continue;
      const p = await (await fetch(b.url, { cache: 'no-store' })).json();
      summaries.push({ id: p.id, createdAt: p.createdAt, prompt: p.prompt, palette: p.setup.palette, style: p.setup.style, layout: p.setup.layout, steps: p.steps.length, likes: p.likes ?? 0, image: p.image });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  summaries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  await put(`${PREFIX}index.json`, JSON.stringify(summaries), { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60 });
  return summaries.length;
}

const ids = (await readdir(DIR)).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();
console.log(`${ids.length} local paintings`);
let uploaded = 0;
let skipped = 0;
let failed = 0;
const queue = [...ids];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let id = queue.shift(); id; id = queue.shift()) {
      try {
        const r = await migrateOne(id);
        if (r === 'uploaded') uploaded++;
        else skipped++;
        process.stdout.write(`${r === 'uploaded' ? '+' : '.'}`);
      } catch (err) {
        failed++;
        console.error(`\n${id}: ${(err as Error).message}`);
      }
    }
  }),
);
console.log(`\nuploaded ${uploaded}, skipped ${skipped}, failed ${failed}`);
console.log(`index rebuilt with ${await rebuildIndex()} paintings`);
