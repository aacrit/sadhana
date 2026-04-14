/**
 * Explorer — Guided raga practice page (dynamic route)
 *
 * Server Component that exports generateStaticParams for Next.js
 * static export, then delegates all interactive rendering to PracticeClient.
 *
 * Route: /journeys/explorer/[ragaId]/practice
 */

import { RAGA_LIST } from '@/engine/theory';
import PracticeClient from './PracticeClient';

// ---------------------------------------------------------------------------
// Static params
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

export default async function PracticePage(props: PageProps) {
  const params = await props.params;
  return <PracticeClient ragaId={params.ragaId} />;
}
