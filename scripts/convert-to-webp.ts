/**
 * One-off: turns every PNG painting in the Blob store into a full-size WebP plus a 400 px
 * thumbnail, points the painting JSON and the index at them, and deletes the PNG.
 * Safe to rerun: paintings that already have a thumb are skipped.
 *
 *   node --env-file=.env.local scripts/convert-to-webp.ts
 */
import { del, list, put } from '@vercel/blob';
import sharp from 'sharp';

const PREFIX = 'paintings/';
const CONCURRENCY = 4;
const IMAGE_OPTS = { access: 'public' as const, addRandomSuffix: false, allowOverwrite: true, contentType: 'image/webp', cacheControlMaxAge: 31536000 };
const JSON_OPTS = { access: 'public' as const, addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60 };

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN is not set; run with --env-file=.env.local');
  process.exit(1);
}

interface Blob {
  pathname: string;
  url: string;
}

async function allBlobs(): Promise<Blob[]> {
  const out: Blob[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
    out.push(...page.blobs.map((b) => ({ pathname: b.pathname, url: b.url })));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

async function convertOne(json: Blob, pngUrl: string | undefined): Promise<'converted' | 'skipped' | 'no-png'> {
  const painting = await (await fetch(json.url, { cache: 'no-store' })).json();
  if (painting.thumb) return 'skipped';
  if (!pngUrl) return 'no-png';
  const png = Buffer.from(await (await fetch(pngUrl)).arrayBuffer());
  const base = sharp(png);
  const [full, thumb] = await Promise.all([base.clone().webp({ quality: 84 }).toBuffer(), base.clone().resize(400, 400, { fit: 'cover' }).webp({ quality: 78 }).toBuffer()]);
  const id = painting.id as string;
  const [f, t] = await Promise.all([put(`${PREFIX}${id}.webp`, full, IMAGE_OPTS), put(`${PREFIX}${id}-thumb.webp`, thumb, IMAGE_OPTS)]);
  painting.image = f.url;
  painting.thumb = t.url;
  await put(json.pathname, JSON.stringify(painting), JSON_OPTS);
  await del(pngUrl);
  return 'converted';
}

const blobs = await allBlobs();
const pngs = new Map(blobs.filter((b) => b.pathname.endsWith('.png')).map((b) => [b.pathname.slice(PREFIX.length, -4), b.url]));
const jsons = blobs.filter((b) => b.pathname.endsWith('.json') && b.pathname !== `${PREFIX}index.json`);
console.log(`${jsons.length} paintings, ${pngs.size} PNGs`);

const counts = { converted: 0, skipped: 0, 'no-png': 0, failed: 0 };
const queue = [...jsons];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let j = queue.shift(); j; j = queue.shift()) {
      try {
        const r = await convertOne(j, pngs.get(j.pathname.slice(PREFIX.length, -5)));
        counts[r]++;
        process.stdout.write(r === 'converted' ? '+' : r === 'skipped' ? '.' : '?');
      } catch (err) {
        counts.failed++;
        console.error(`\n${j.pathname}: ${(err as Error).message}`);
      }
    }
  }),
);
console.log(`\n${JSON.stringify(counts)}`);

// Rebuild the index from the updated JSONs.
const summaries = [];
for (const j of await allBlobs()) {
  if (!j.pathname.endsWith('.json') || j.pathname === `${PREFIX}index.json`) continue;
  const p = await (await fetch(j.url, { cache: 'no-store' })).json();
  summaries.push({ id: p.id, createdAt: p.createdAt, prompt: p.prompt, palette: p.setup.palette, style: p.setup.style, layout: p.setup.layout, steps: p.steps.length, likes: p.likes ?? 0, image: p.image, thumb: p.thumb });
}
summaries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
await put(`${PREFIX}index.json`, JSON.stringify(summaries), JSON_OPTS);
console.log(`index rebuilt with ${summaries.length} paintings`);
