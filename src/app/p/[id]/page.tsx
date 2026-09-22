import { notFound } from 'next/navigation';
import PaintingView from '@/components/PaintingView';
import { loadPainting } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function PaintingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const painting = await loadPainting(id).catch(() => null);
  if (!painting) notFound();
  return (
    <main className="page">
      <PaintingView painting={painting} />
    </main>
  );
}
