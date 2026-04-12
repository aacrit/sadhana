/**
 * Explorer — Raga detail page (dynamic route)
 *
 * Server Component page that exports generateStaticParams for
 * Next.js static export, then delegates all interactive rendering
 * to the RagaDetailClient component.
 *
 * Static params generated for all five v1 ragas.
 */

import { RAGA_LIST } from '@/engine/theory';
import RagaDetailClient from './RagaDetailClient';

// ---------------------------------------------------------------------------
// Static params for export
// ---------------------------------------------------------------------------

export function generateStaticParams(): { ragaId: string }[] {
  return RAGA_LIST.map((raga) => ({ ragaId: raga.id }));
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ ragaId: string }>;
}

export default async function RagaDetailPage(props: PageProps) {
  const params = await props.params;
  return <RagaDetailClient ragaId={params.ragaId} />;
}
