# Jev Paints

Tell Jev what to paint and watch it happen, one gesture at a time.

[Jev](https://typesafe.ai) is TypeSafe's System One model: it answers typed questions with probabilities and never generates text or images. Jev Paints turns that into a painter. Jev never sees a pixel. It gets a text description of the canvas and picks, from fixed lists, what to paint next; code turns each pick into [p5.brush](https://github.com/acamposuribe/p5.brush) strokes.

## How a painting happens

1. **Setup request** (one Jev call, ~1 s). The prompt goes in with seven independent questions: three moderation checks (only clearly sexual, hateful or gory requests are blocked), the palette (60 named palettes), the style (50 painters and movements), the composition (16 layout templates with named regions and a painting order) and the stroke character (p5.brush vector field).
2. **Step loop** (one Jev call per gesture, ~300 ms). The state describes the request, style, palette, composition, the plan with the current phase ("step 7 of 30, now painting the sky"), a 5×5 grid read back from the real pixels ("A1: mostly storm grey, C3: blank paper") and the recent gestures. Eight independent questions come back in one round trip: gesture motif, region, size, medium, colour, how the paint is applied, mark weight, and whether the painting already feels finished.
3. **Code resolves geometry.** A motif (band, blob, radiating lines, flowing ribbon, scribble, ...) plus a region plus a size becomes concrete strokes with a seeded random generator, so every painting replays exactly from its saved decisions.

The prompts describe state only; nothing tells Jev how to paint. Every option Jev could legally pick is always offered.

## Run it

```bash
npm install
cp .env.example .env.local        # add your TypeSafe key
npm run dev                       # http://localhost:3000
```

Paintings are one JSON (every decision Jev made) plus a full-size WebP and a 400 px thumbnail, written once to Vercel Blob, and one row in Supabase Postgres (`supabase/migrations/`) that carries the gallery index and the like count. Without `BLOB_READ_WRITE_TOKEN` and the Supabase keys, everything is written to `data/paintings/` on disk instead.

The server owns every painting. Setup returns a signed session (id, seed, step count, picks); each step answer is signed too; saving verifies every signature and that the image is a real 1200×1200 WebP or PNG, so a painting can only contain what Jev returned through these routes. `PAINT_SIGNING_SECRET` is the HMAC key.

Rate limits live in the same database (`hit_rate_limit`): per IP 200 paintings started and 5,000 gestures per hour; site-wide 30,000 gestures per hour and 100,000 per day, which caps Jev spend at roughly $20 a day whatever happens. Likes and the gallery are never limited.

Deployed on Vercel: the app is stateless apart from Blob, so a fresh clone with the env vars from `.env.example` is the whole setup.

## Layout

- `src/lib/` libraries Jev chooses from (`palettes`, `styles`, `layouts`, `motifs`, `brushes`), the prompts (`prompts.ts`), the plan walker (`plan.ts`), the pixel-to-text grid (`grid.ts`), geometry (`gesture.ts`), the TypeSafe client and the local store.
- `src/app/api/` route handlers: `setup`, `step`, `paintings` (list, save, like, image).
- `src/components/` the p5 canvas wrapper, the painter page, the painting page and the Jev probability panel.
