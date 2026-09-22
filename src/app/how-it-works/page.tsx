import type { Metadata } from 'next';
import HowItWorks from '@/components/HowItWorks';
import { listPaintings, loadPainting } from '@/lib/store';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'How it works', description: 'How a model that cannot see or draw paints a picture: one real painting followed from prompt to last stroke.' };

/** The worked example. Falls back to the newest painting with at least 30 gestures when it is gone. */
const EXAMPLE_ID = '20260922152557-i18ii';

export default async function HowItWorksPage() {
  const all = await listPaintings();
  let painting = await loadPainting(EXAMPLE_ID).catch(() => null);
  if (!painting) {
    const candidate = all.find((p) => p.steps >= 30) ?? all[0];
    painting = candidate ? await loadPainting(candidate.id).catch(() => null) : null;
  }
  return (
    <main className="page how-page">
      <HowItWorks painting={painting} counts={{ paintings: all.length }} />
    </main>
  );
}
