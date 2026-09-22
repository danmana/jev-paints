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
export TYPESAFE_AI_API_KEY=...   # server-side only
npm run dev                       # http://localhost:3000
```

Paintings are saved locally under `data/paintings/` (JSON of every decision plus a PNG) until a database and blob storage are wired in.

## Layout

- `src/lib/` libraries Jev chooses from (`palettes`, `styles`, `layouts`, `motifs`, `brushes`), the prompts (`prompts.ts`), the plan walker (`plan.ts`), the pixel-to-text grid (`grid.ts`), geometry (`gesture.ts`), the TypeSafe client and the local store.
- `src/app/api/` route handlers: `setup`, `step`, `paintings` (list, save, like, image).
- `src/components/` the p5 canvas wrapper, the painter page, the painting page and the Jev probability panel.
