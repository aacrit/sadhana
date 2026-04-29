/**
 * Scholar — per-raga reference page (audit #16, the moat).
 *
 * Renders every Raga object straight from the engine. No new content is
 * authored: aroha, avaroha, vadi/samvadi, jati, thaat, prahara, rasa,
 * pakad, ornaments, related ragas, gharana variations — all read from
 * engine/theory/ragas/<id>.ts. Every phrase is playable via the existing
 * harmonium synth.
 *
 * This is the surface that turns the engine from invisible scholarship
 * into visible scholarship — the differentiator no copycat can ship in
 * less than a year.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RAGA_LIST, getRagaById } from '@/engine/theory';
import RagaReferencePlayer from './RagaReferencePlayer';
import styles from '../../../../../styles/scholar.module.css';

export function generateStaticParams() {
  return RAGA_LIST.map((raga) => ({ id: raga.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raga = getRagaById(id);
  if (!raga) return { title: 'Raga not found' };
  return {
    title: `${raga.name} — engine reference`,
    description: raga.description.slice(0, 160),
  };
}

export default async function RagaReferencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raga = getRagaById(id);
  if (!raga) notFound();

  const arohaSwaras = raga.aroha.map((n) => `${n.swara}${n.octave === 'taar' ? "'" : n.octave === 'mandra' ? ',' : ''}`);
  const avarohaSwaras = raga.avaroha.map((n) => `${n.swara}${n.octave === 'taar' ? "'" : n.octave === 'mandra' ? ',' : ''}`);

  return (
    <div className={styles.page}>
      <Link href="/journeys/scholar/reference" className={styles.backLink}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Reference
      </Link>

      <header className={styles.header}>
        <span className={styles.levelBadge}>
          {raga.thaat} thaat
        </span>
        <h1 className={styles.journeyName}>
          <span className="romanized-only raga-name">{raga.name}</span>
          <span className="devanagari-only raga-name">{raga.nameDevanagari}</span>
        </h1>
        <span className={styles.journeyEnglish}>
          {raga.prahara.length > 0 && `prahar ${raga.prahara.join(', ')}`}
          {raga.rasa.length > 0 && ` · ${raga.rasa.join(', ')}`}
        </span>
      </header>

      {/* Scale: aroha + avaroha */}
      <section className={styles.referenceSection} aria-label="Aroha and avaroha">
        <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'var(--text-xl)', color: 'var(--text)', textAlign: 'center', letterSpacing: 'var(--tracking-royal)' }}>
          The scale
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center', marginTop: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)', minWidth: 64, textAlign: 'right' }}>
              Aroha
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', color: 'var(--text)' }}>
              {arohaSwaras.join(' ')}
            </span>
            <RagaReferencePlayer phrase={raga.aroha} label={`Play ${raga.name} aroha`} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)', minWidth: 64, textAlign: 'right' }}>
              Avaroha
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', color: 'var(--text)' }}>
              {avarohaSwaras.join(' ')}
            </span>
            <RagaReferencePlayer phrase={raga.avaroha} label={`Play ${raga.name} avaroha`} />
          </div>
        </div>
      </section>

      {/* Vadi / samvadi — the architectural notes */}
      <section className={styles.referenceSection} aria-label="Vadi and samvadi">
        <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'var(--text-xl)', color: 'var(--text)', textAlign: 'center', letterSpacing: 'var(--tracking-royal)' }}>
          Vadi · samvadi
        </h2>
        <p className={styles.referenceNote}>
          The <strong>vadi</strong> ({raga.vadi}) is the dominant swara — emphasized,
          dwelt upon. The <strong>samvadi</strong> ({raga.samvadi}) is the
          consonant — the architectural counterpart.
          {raga.varjit.length > 0 && (
            <> The <strong>varjit</strong> swaras
              ({raga.varjit.join(', ')}) are forbidden — singing them
              leaves the raga.</>
          )}
        </p>
      </section>

      {/* Pakad — characteristic phrases */}
      {raga.pakad.length > 0 && (
        <section className={styles.referenceSection} aria-label="Pakad — characteristic phrases">
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'var(--text-xl)', color: 'var(--text)', textAlign: 'center', letterSpacing: 'var(--tracking-royal)' }}>
            Pakad
          </h2>
          <p className={styles.referenceNote} style={{ marginBottom: 'var(--space-4)' }}>
            The signature phrase. Recognise it, and you recognise the raga.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center' }}>
            {raga.pakad.map((phrase, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', color: 'var(--text)' }}>
                  {phrase.map((n) => `${n.swara}${n.octave === 'taar' ? "'" : n.octave === 'mandra' ? ',' : ''}`).join(' ')}
                </span>
                <RagaReferencePlayer phrase={phrase} label={`Play pakad ${idx + 1}`} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ornaments */}
      {raga.ornaments.length > 0 && (
        <section className={styles.referenceSection} aria-label="Ornaments">
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'var(--text-xl)', color: 'var(--text)', textAlign: 'center', letterSpacing: 'var(--tracking-royal)' }}>
            Ornaments
          </h2>
          <p className={styles.referenceNote}>
            {raga.ornaments.join(', ')}.
            {raga.ornaments.includes('andolan') && (
              <> The andolan — a slow oscillation around a swara — is what gives this
              raga its expressive depth.</>
            )}
          </p>
        </section>
      )}

      {/* Description */}
      <section className={styles.referenceSection} aria-label="Description">
        <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'var(--text-md)', color: 'var(--text-2)', lineHeight: 'var(--leading-relaxed)', maxWidth: '60ch', margin: '0 auto', textAlign: 'center' }}>
          {raga.description}
        </p>
      </section>

      {/* Western bridge — for students with Western training */}
      {raga.westernBridge && (
        <section className={styles.referenceSection} aria-label="Western bridge">
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'var(--text-lg)', color: 'var(--text-2)', textAlign: 'center' }}>
            For Western-trained ears
          </h2>
          <p className={styles.referenceNote}>{raga.westernBridge}</p>
        </section>
      )}

      {/* Gharana variations */}
      {raga.gharanaVariations && (
        <section className={styles.referenceSection} aria-label="Gharana variations">
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'var(--text-lg)', color: 'var(--text-2)', textAlign: 'center' }}>
            Gharana variations
          </h2>
          <p className={styles.referenceNote}>{raga.gharanaVariations}</p>
        </section>
      )}

      {/* Related ragas — internal navigation */}
      {raga.relatedRagas.length > 0 && (
        <section className={styles.referenceSection} aria-label="Related ragas">
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'var(--text-lg)', color: 'var(--text-2)', textAlign: 'center' }}>
            Related ragas
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center', flexWrap: 'wrap', marginTop: 'var(--space-3)' }}>
            {raga.relatedRagas.map((relId) => {
              const rel = getRagaById(relId);
              if (!rel) return null;
              return (
                <Link key={relId} href={`/journeys/scholar/reference/ragas/${relId}`}
                  className={styles.lessonTile} style={{ minWidth: 140 }}>
                  <span className={styles.lessonTitle}>{rel.name}</span>
                  <span className={styles.lessonRaga}>{rel.thaat}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
