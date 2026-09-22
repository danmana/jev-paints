/**
 * One-off: creates a Postgres row for every painting JSON already in Vercel Blob, carrying its
 * like count over, then deletes the old paintings/index.json. Safe to rerun (upsert).
 *
 *   node --env-file=.env.local scripts/blob-to-db.ts
 */
import { del, get, list } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';

const PREFIX = 'paintings/';
const INDEX = `${PREFIX}index.json`;

for (const v of ['BLOB_READ_WRITE_TOKEN', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
  if (!process.env[v]) {
    console.error(`${v} is not set; run with --env-file=.env.local`);
    process.exit(1);
  }
}
const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

const rows = [];
let indexUrl: string | undefined;
let cursor: string | undefined;
do {
  const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
  for (const b of page.blobs) {
    if (b.pathname === INDEX) {
      indexUrl = b.url;
      continue;
    }
    if (!b.pathname.endsWith('.json')) continue;
    const r = await get(b.pathname, { access: 'public', useCache: false });
    if (!r || r.statusCode !== 200) continue;
    const p = JSON.parse(await new Response(r.stream).text());
    if (!p.image || !p.thumb) {
      console.warn(`skipping ${p.id}: no image or thumb`);
      continue;
    }
    rows.push({ id: p.id, created_at: p.createdAt, prompt: p.prompt, palette: p.setup.palette, style: p.setup.style, layout: p.setup.layout, steps: p.steps.length, likes: p.likes ?? 0, image: p.image, thumb: p.thumb, json_url: b.url });
  }
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);

const { error } = await db.from('paintings').upsert(rows, { onConflict: 'id' });
if (error) {
  console.error('upsert failed:', error.message);
  process.exit(1);
}
const { count } = await db.from('paintings').select('*', { count: 'exact', head: true });
console.log(`${rows.length} rows upserted, ${count} rows in the table`);
if (indexUrl) {
  await del(indexUrl);
  console.log('deleted paintings/index.json');
}
