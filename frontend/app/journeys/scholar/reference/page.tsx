/**
 * Scholar — Engine reference (T2.4 of the enhancement plan).
 *
 * Renders the engine's swara definitions directly as readable scholarship.
 * Each swara shows its just-intonation ratio, cents deviation from equal
 * temperament, alternate names, and the harmonic-position rationale.
 *
 * No new content is authored here — every value comes straight from
 * engine/theory/swaras.ts. The point is to surface the rigor of the
 * engine to the student so they can read music theory the way a
 * musicologist would, but interactively.
 *
 * This is a server component (the static export embeds the data; no
 * client-side fetch needed). The Listen buttons need a client child to
 * trigger Tone.js, so they live in a small inline client component.
 */

import Link from 'next/link';
import { SWARAS } from '@/engine/theory/swaras';
import ShrutiPlayer from './ShrutiPlayer';
import styles from '../../../styles/scholar.module.css';

export const metadata = {
  title: 'Engine Reference',
};

export default function ScholarReferencePage() {
  return (
    <div className={styles.page}>
      <Link href="/journeys/scholar" className={styles.backLink}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Scholar
      </Link>

      <header className={styles.header}>
        <h1 className={styles.journeyName}>
          <span className="romanized-only raga-name">Engine Reference</span>
          <span className="devanagari-only raga-name">यन्त्र-निर्देशिका</span>
        </h1>
        <span className={styles.journeyEnglish}>The 12 swaras as the engine knows them</span>
      </header>

      {/* Swara reference table — read straight from engine/theory/swaras.ts */}
      <section
        className={styles.referenceSection}
        aria-label="Swara reference table"
      >
        <table className={styles.referenceTable}>
          <thead>
            <tr>
              <th scope="col">Symbol</th>
              <th scope="col">Sanskrit</th>
              <th scope="col">Devanagari</th>
              <th scope="col">Just ratio</th>
              <th scope="col">Cents from Sa</th>
              <th scope="col">Δ ET</th>
              <th scope="col">Listen</th>
            </tr>
          </thead>
          <tbody>
            {SWARAS.map((s) => (
              <tr key={s.symbol}>
                <td className={styles.refSymbol}>{s.symbol}</td>
                <td>{s.name}</td>
                <td className="swara-text">{s.nameDevanagari}</td>
                <td className={styles.refMono}>
                  {s.ratioNumerator}/{s.ratioDenominator}
                </td>
                <td className={styles.refMono}>
                  {Math.round(s.centsFromSa)}¢
                </td>
                <td className={styles.refMono}>
                  {s.centsDeviationFromET >= 0 ? '+' : ''}
                  {Math.round(s.centsDeviationFromET)}¢
                </td>
                <td>
                  <ShrutiPlayer swara={s.symbol} label={s.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className={styles.referenceNote}>
          The ratios above are the just-intonation values used internally by
          the engine. Cents deviation from equal temperament shows how far
          each swara sits from the corresponding Western piano key — the
          flat notes of Bhairav, the sharp tivra Ma of Yaman, the slightly
          flat shuddha Ga that gives Yaman its characteristic colour.
        </p>
      </section>
    </div>
  );
}
