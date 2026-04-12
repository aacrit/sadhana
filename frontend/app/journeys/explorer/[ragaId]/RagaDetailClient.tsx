'use client';

/**
 * RagaDetailClient — Placeholder for raga detail view.
 *
 * This component will be fully built when the Explorer journey
 * is implemented. For now, it renders a minimal placeholder
 * that shows the raga name and a back link.
 */

import Link from 'next/link';
import { RAGA_LIST } from '@/engine/theory';

interface RagaDetailClientProps {
  readonly ragaId: string;
}

export default function RagaDetailClient({ ragaId }: RagaDetailClientProps) {
  const raga = RAGA_LIST.find((r) => r.id === ragaId);

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6) var(--space-4)',
        gap: 'var(--space-6)',
      }}
    >
      <Link
        href="/journeys/explorer"
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-3)',
          textDecoration: 'none',
        }}
      >
        Back to Explorer
      </Link>
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'var(--text-3xl)',
          fontWeight: 'var(--weight-light)',
          color: 'var(--text)',
        }}
      >
        {raga?.name ?? ragaId}
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-3)',
          textAlign: 'center',
          maxWidth: '36ch',
        }}
      >
        Full raga detail view coming soon.
      </p>
    </div>
  );
}
