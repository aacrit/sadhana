/**
 * /overview — Comprehensive investor overview page (25-30 pages)
 *
 * A beautifully formatted, print-ready overview of the Sadhana product.
 * Accessible at /overview. Print to PDF from browser for sharing.
 *
 * Sections: Cover, TOC, Executive Summary, Problem/Market, Vision,
 * Architecture, Engine Deep Dive, Voice Pipeline, Tantri, User Lifecycle,
 * Curriculum (full 39-lesson catalog), 30-Raga Catalog, Design System,
 * Tech Stack, Data Model, Pedagogy/References, Roadmap.
 */

import type { Metadata } from 'next';
import styles from './overview.module.css';

export const metadata: Metadata = {
  title: 'S\u0101dhan\u0101 — Comprehensive Overview',
  description: 'A music physics engine for Hindustani classical vocal training. 25-page investor overview.',
};

export default function OverviewPage() {
  return (
    <div className={styles.doc}>
      <Cover />
      <TOC />
      <ExecutiveSummary />
      <TheProblem />
      <ProductVision />
      <SystemArchitecture />
      <EngineDeepDive />
      <VoicePipeline />
      <TantriSection />
      <UserLifecycle />
      <CurriculumArchitecture />
      <RagaCatalog />
      <DesignSystem />
      <TechStack />
      <DataModel />
      <PedagogicalFramework />
      <Roadmap />
      <PageFooter />
    </div>
  );
}

/* ================================================================
   COVER
   ================================================================ */

function Cover() {
  return (
    <div className={styles.cover}>
      <div className={styles.coverTitle}>S&#x101;dhan&#x101;</div>
      <div className={styles.coverDevanagari}>{'\u0938\u093E\u0927\u0928\u093E'}</div>
      <div className={styles.coverTagline}>Disciplined practice toward mastery</div>

      {/* Tantri string accent */}
      <svg className={styles.coverLogo} width="280" height="40" viewBox="0 0 280 40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="csg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E8871E" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#E8871E" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="csf" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopOpacity="1"/>
            <stop offset="72%" stopOpacity="1"/>
            <stop offset="100%" stopOpacity="0"/>
          </linearGradient>
          <mask id="csm"><rect x="10" y="0" width="262" height="40" fill="url(#csf)"/></mask>
        </defs>
        <g mask="url(#csm)">
          <line x1="10" y1="6" x2="270" y2="6" stroke="#0A1A14" strokeWidth="0.6" opacity="0.20"/>
          <line x1="10" y1="11" x2="270" y2="11" stroke="#0A1A14" strokeWidth="0.6" opacity="0.20"/>
          <line x1="10" y1="17" x2="270" y2="17" stroke="#0A1A14" strokeWidth="0.7" opacity="0.25"/>
          <line x1="10" y1="25" x2="270" y2="25" stroke="#0A1A14" strokeWidth="1.0" opacity="0.30"/>
          <path d="M 10 35 Q 75 29, 140 35 Q 205 41, 270 35" stroke="#E8871E" strokeWidth="1.5" fill="none" opacity="0.35"/>
          <line x1="10" y1="35" x2="270" y2="35" stroke="#0A1A14" strokeWidth="1.5" opacity="0.50"/>
        </g>
        <circle cx="10" cy="35" r="5" fill="url(#csg)"/>
        <circle cx="10" cy="35" r="2" fill="#E8871E"/>
      </svg>

      <div className={styles.coverSubtitle}>
        A music physics engine for Hindustani classical vocal training.
        Real-time voice feedback. 30 ragas. 39 structured lessons.
        Zero operational cost. The world&rsquo;s first browser-based
        Indian classical music learning platform.
      </div>
      <div className={styles.coverDate}>April 2026 | Confidential | Comprehensive Product Overview</div>
    </div>
  );
}

/* ================================================================
   TABLE OF CONTENTS
   ================================================================ */

function TOC() {
  const items = [
    ['Executive Summary', '3'],
    ['The Problem & Market Opportunity', '4'],
    ['Product Vision & Philosophy', '5'],
    ['System Architecture', '6'],
    ['The Music Engine \u2014 Deep Dive', '7'],
    ['The Voice Pipeline \u2014 The Technical Moat', '11'],
    ['Tantri \u2014 The Instrument Layer', '13'],
    ['User Lifecycle: Onboarding to Mastery', '14'],
    ['Curriculum Architecture \u2014 Complete Lesson Catalog', '16'],
    ['The 30-Raga Catalog', '21'],
    ['Design System \u2014 Ragamala', '22'],
    ['Technical Stack & $0 Architecture', '24'],
    ['Data Model & Schema', '25'],
    ['Pedagogical Framework & References', '26'],
    ['Roadmap & Go-to-Market', '27'],
  ];

  return (
    <section>
      <div className={styles.pageBreak} />
      <h2 className={styles.sectionTitle}>Table of Contents</h2>
      <div className={styles.accentBar} />
      <ol className={styles.toc}>
        {items.map(([title, page]) => (
          <li key={title} className={styles.tocItem}>
            <span>{title}</span>
            <span className={styles.tocPage}>{page}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ================================================================
   HELPERS
   ================================================================ */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h2 className={styles.sectionTitle}>{children}</h2>
      <div className={styles.accentBar} />
    </>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.metric}>
      <span className={styles.metricValue}>{value}</span>
      <span className={styles.metricLabel}>{label}</span>
    </div>
  );
}

/* ================================================================
   1. EXECUTIVE SUMMARY
   ================================================================ */

function ExecutiveSummary() {
  return (
    <section>
      <div className={styles.pageBreak} />
      <SectionTitle>1. Executive Summary</SectionTitle>
      <p className={styles.text}>
        <strong>S&#x101;dhan&#x101;</strong> (Sanskrit: <span className={styles.devanagari}>{'\u0938\u093E\u0927\u0928\u093E'}</span> &mdash; disciplined practice toward mastery) is the world&rsquo;s first browser-based Hindustani classical music training application built on a comprehensive music physics engine. It transforms the student&rsquo;s device into an interactive instrument that listens, responds, and teaches &mdash; all at <strong>$0 operational cost</strong>.
      </p>
      <p className={styles.text}>
        <strong>The core insight:</strong> Existing music apps teach Western music theory or treat Indian music as a subset of Western frameworks. S&#x101;dhan&#x101; builds from first principles: 22 shrutis (microtonal intervals from the Natya Shastra), just intonation frequency ratios, raga grammar rules, and the oral-tradition pedagogy of Hindustani classical music.
      </p>
      <div className={styles.metrics}>
        <Metric value="19,106" label="Lines of Engine Code" />
        <Metric value="30" label="Ragas in Catalog" />
        <Metric value="39" label="Structured Lessons" />
        <Metric value="318" label="Unit Tests Passing" />
        <Metric value="<50ms" label="Voice-to-Visual Latency" />
        <Metric value="$0/mo" label="Operational Cost" />
      </div>
      <div className={styles.callout}>
        <strong>What makes this defensible:</strong> The engine is not a wrapper around music APIs. It IS music &mdash; 19,106 lines of TypeScript encoding harmonic physics, 22 microtonal positions, raga grammar rules for 30 ragas, real-time pakad (characteristic phrase) recognition, and a voice pipeline that runs entirely in the browser using WebAssembly neural denoising and McLeod pitch detection.
      </div>
    </section>
  );
}

/* ================================================================
   2. THE PROBLEM
   ================================================================ */

function TheProblem() {
  return (
    <section>
      <div className={styles.pageBreak} />
      <SectionTitle>2. The Problem &amp; Market Opportunity</SectionTitle>
      <h3 className={styles.h3}>The Gap</h3>
      <p className={styles.text}>Hindustani classical music has an estimated <strong>300+ million practitioners</strong> across South Asia, with a global Indian diaspora of <strong>32 million</strong> seeking cultural connection. Yet the digital tools available to them are fundamentally broken:</p>
      <ul className={styles.list}>
        <li><strong>No digital tool teaches raga grammar</strong> &mdash; the rules of melodic movement (aroha/avaroha, vakra phrases, varjit swaras) that define a raga&rsquo;s identity</li>
        <li><strong>No app uses just intonation</strong> &mdash; the mathematically correct tuning system where intervals are exact frequency ratios (3:2 for Pa, 5:4 for Ga)</li>
        <li><strong>No platform provides context-aware pitch feedback</strong> &mdash; understanding that komal Re in Bhairav is a different musical object from komal Re in Kafi</li>
        <li>Western music apps (Yousician, Simply Piano) serve 50M+ users but cannot teach Indian music correctly</li>
      </ul>
      <h3 className={styles.h3}>The Opportunity</h3>
      <table className={styles.table}>
        <thead><tr><th>Segment</th><th>Size</th><th>Need</th></tr></thead>
        <tbody>
          <tr><td>South Asian music learners</td><td>300M+</td><td>Quality, affordable instruction</td></tr>
          <tr><td>Global Indian diaspora</td><td>32M</td><td>Cultural connection through music</td></tr>
          <tr><td>Mindfulness &amp; wellness</td><td>$1.5B market</td><td>HCM is inherently meditative</td></tr>
          <tr><td>Music education technology</td><td>$5.5B by 2027</td><td>No competitor in Indian music vertical</td></tr>
          <tr><td>Yoga/meditation practitioners</td><td>300M globally</td><td>Sound as spiritual practice</td></tr>
        </tbody>
      </table>
      <h3 className={styles.h3}>Competitive Landscape</h3>
      <table className={styles.table}>
        <thead><tr><th>Competitor</th><th>What They Do</th><th>What They Cannot Do</th></tr></thead>
        <tbody>
          <tr><td>Yousician</td><td>Guitar/piano with pitch detection</td><td>No Indian music, no just intonation, no raga grammar</td></tr>
          <tr><td>Simply Piano</td><td>Piano learning with note recognition</td><td>Western-only, no voice, no microtonal awareness</td></tr>
          <tr><td>Riyaz (app)</td><td>Basic tanpura + scale practice</td><td>No voice feedback, no raga grammar, no curriculum</td></tr>
          <tr><td>SwarShala</td><td>Indian instrument samples</td><td>No learning system, no voice detection</td></tr>
          <tr><td><strong>S&#x101;dhan&#x101;</strong></td><td colSpan={2}><strong>Full music physics engine + voice pipeline + 39-lesson curriculum + $0 cost</strong></td></tr>
        </tbody>
      </table>
    </section>
  );
}

/* ================================================================
   3. PRODUCT VISION
   ================================================================ */

function ProductVision() {
  return (
    <section>
      <div className={styles.pageBreak} />
      <SectionTitle>3. Product Vision &amp; Philosophy</SectionTitle>
      <div className={styles.callout}>
        <strong>THE ENGINE IS MUSIC. MUSIC IS THE ENGINE.</strong><br/>
        This is not a music learning app that uses audio. This is a music physics engine &mdash; the equivalent of NVIDIA PhysX, but for sound. The engine does not imitate music. It IS music.
      </div>
      <h3 className={styles.h3}>Core Principles</h3>
      <ol className={styles.list}>
        <li><strong>Audio Before Everything (The Presence Rule)</strong>: Every concept is heard before it is named. The student meets a raga through its sound, not its theory.</li>
        <li><strong>Hindustani-First</strong>: Rooted in HCM tradition. Western equivalents are bridges for context, never the frame. Sa is not &ldquo;C&rdquo; &mdash; it is whatever the performer&rsquo;s voice naturally settles on.</li>
        <li><strong>$0 End-to-End</strong>: No paid APIs. No paid services. Everything runs in the browser or on Supabase free tier.</li>
        <li><strong>Journeys Serve the Engine</strong>: The four journey interfaces adapt to the student. The engine never compromises its musical accuracy.</li>
        <li><strong>The S&#x101;dhan&#x101; Principle</strong>: 5&ndash;15 minute daily sessions. One new musical capability per session. Mastery through consistency.</li>
      </ol>
      <h3 className={styles.h3}>The Three-Layer Architecture Philosophy</h3>
      <pre className={styles.pre}>{`Engine  (/engine/)            — Pure music: frequencies, ratios, ragas, shrutis
  ↓
Tantri  (engine/interaction/)  — The instrument: 12 strings, voice mapping, spring physics
  ↓
Application  (/frontend/)     — Lessons, freeform, exercises — rendered THROUGH Tantri`}</pre>
    </section>
  );
}

/* ================================================================
   4. SYSTEM ARCHITECTURE
   ================================================================ */

function SystemArchitecture() {
  return (
    <section>
      <div className={styles.pageBreak} />
      <SectionTitle>4. System Architecture</SectionTitle>
      <div className={styles.archDiagram}>
        <div className={`${styles.archLayer} ${styles.archEngine}`}>
          <div className={styles.archLabel}>THE ENGINE &mdash; /engine/ &mdash; 19,106 lines TypeScript, zero UI</div>
          {'physics/ \u2192 theory/ \u2192 analysis/ \u2192 synthesis/ \u2192 voice/ \u2192 interaction/ (Tantri)'}
        </div>
        <div className={styles.archArrow}>{'\u2193 engine exposes typed API'}</div>
        <div className={`${styles.archLayer} ${styles.archJourney}`}>
          <div className={styles.archLabel}>JOURNEYS &mdash; /frontend/app/journeys/</div>
          {'Beginner (Shishya) \u2022 Explorer (Sadhaka) \u2022 Scholar (Varistha) \u2022 Master (Guru) \u2022 Freeform'}
        </div>
        <div className={styles.archArrow}>{'\u2193 React components'}</div>
        <div className={`${styles.archLayer} ${styles.archPresentation}`}>
          <div className={styles.archLabel}>PRESENTATION &mdash; Next.js 15 / React 19 / TypeScript strict</div>
          {'Framer Motion v12 \u2022 GSAP 3 \u2022 Three.js r170 \u2022 Ragamala Design System'}
        </div>
        <div className={styles.archArrow}>{'\u2193 Supabase JS client'}</div>
        <div className={`${styles.archLayer} ${styles.archData}`}>
          <div className={styles.archLabel}>DATA &mdash; Supabase (free tier, $0)</div>
          {'profiles \u2022 sessions \u2022 exercise_attempts \u2022 lesson_progress \u2022 streaks \u2022 raga_encounters'}
        </div>
      </div>
      <h3 className={styles.h3}>Engine Module Inventory</h3>
      <table className={styles.table}>
        <thead><tr><th>Module</th><th>Purpose</th><th>Key Contents</th></tr></thead>
        <tbody>
          {([
            ['physics/harmonics', 'Harmonic series mathematics', 'Overtone ratios, string modes, jivari model (12 partials)'],
            ['physics/resonance', 'Acoustic consonance theory', 'Helmholtz consonance, critical band roughness, Euler gradus'],
            ['physics/just-intonation', '22 shrutis from Natya Shastra', 'All 22 positions with exact p/q ratios, cents, ET deviation'],
            ['theory/swaras', '12 principal swaras', 'Frequency ratios, Devanagari names, harmonic positions'],
            ['theory/ragas/', '30 raga definitions', 'Aroha, avaroha, pakad, vadi/samvadi, ornamentMap, vakra'],
            ['theory/thaats', '10 Bhatkhande thaats', 'Parent scales, swara sets, common ragas per thaat'],
            ['theory/talas/', '4 tala definitions', 'Beat structures, vibhag, sam/khali, theka bols'],
            ['theory/ornaments', '8 ornament definitions', 'Trajectory, duration, oscillation rate, amplitude'],
            ['analysis/pitch-mapping', 'Hz \u2192 swara mapping', 'Context-aware: raga-specific microtonal positions'],
            ['analysis/raga-grammar', 'Phrase validation', 'Aroha/avaroha rules, forbidden swaras, vakra detection'],
            ['analysis/phrase-recognition', 'Pakad detection', 'Sliding window + subsequence matching, confidence'],
            ['synthesis/tanpura', 'Drone synthesis', '4-string model with jivari overtones, pluck cycle'],
            ['synthesis/swara-voice', 'Swara playback', '12-partial harmonium synthesis, just intonation tuned'],
            ['interaction/tantri', 'The instrument', '12-string field, voice mapping, spring physics'],
            ['voice/pipeline', 'Real-time voice chain', 'Mic \u2192 AnalyserNode \u2192 Pitchy \u2192 pitch mapping \u2192 events'],
            ['voice/accuracy', 'Session scoring', 'Weighted: pitch accuracy + raga compliance + pakad bonus'],
          ] as const).map(([mod, purpose, contents]) => (
            <tr key={mod}><td><strong>{mod}</strong></td><td>{purpose}</td><td>{contents}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* ================================================================
   5. ENGINE DEEP DIVE
   ================================================================ */

function EngineDeepDive() {
  return (
    <section>
      <div className={styles.pageBreak} />
      <SectionTitle>5. The Music Engine &mdash; Deep Dive</SectionTitle>

      <h3 className={styles.h3}>5.1 The 12 Swaras &mdash; Just Intonation Foundation</h3>
      <p className={styles.text}>The Natya Shastra (c. 200 BCE&ndash;200 CE) codified 22 microtonal intervals. The 12 principal swaras used in modern Hindustani practice are defined with exact frequency ratios from the harmonic series:</p>
      <table className={styles.table}>
        <thead><tr><th>Swara</th><th>Name</th><th className={styles.devanagari}>Devanagari</th><th>Ratio</th><th>Cents</th><th>ET Dev.</th></tr></thead>
        <tbody>
          {([
            ['Sa', 'Shadja', '\u0937\u0921\u094D\u091C', '1/1', '0.00', '0.00'],
            ['Re\u2082', 'Komal Rishabh', '\u0915\u094B\u092E\u0932 \u090B\u0937\u092D', '16/15', '111.73', '+11.73'],
            ['Re', 'Shuddha Rishabh', '\u0936\u0941\u0926\u094D\u0927 \u090B\u0937\u092D', '9/8', '203.91', '+3.91'],
            ['Ga\u2082', 'Komal Gandhar', '\u0915\u094B\u092E\u0932 \u0917\u093E\u0928\u094D\u0927\u093E\u0930', '6/5', '315.64', '+15.64'],
            ['Ga', 'Shuddha Gandhar', '\u0936\u0941\u0926\u094D\u0927 \u0917\u093E\u0928\u094D\u0927\u093E\u0930', '5/4', '386.31', '-13.69'],
            ['Ma', 'Shuddha Madhyam', '\u0936\u0941\u0926\u094D\u0927 \u092E\u0927\u094D\u092F\u092E', '4/3', '498.04', '-1.96'],
            ['Ma\u2020', 'Tivra Madhyam', '\u0924\u0940\u0935\u094D\u0930 \u092E\u0927\u094D\u092F\u092E', '45/32', '590.22', '-9.78'],
            ['Pa', 'Pancham', '\u092A\u091E\u094D\u091A\u092E', '3/2', '701.96', '+1.96'],
            ['Dha\u2082', 'Komal Dhaivat', '\u0915\u094B\u092E\u0932 \u0927\u0948\u0935\u0924', '8/5', '813.69', '+13.69'],
            ['Dha', 'Shuddha Dhaivat', '\u0936\u0941\u0926\u094D\u0927 \u0927\u0948\u0935\u0924', '5/3', '884.36', '-15.64'],
            ['Ni\u2082', 'Komal Nishad', '\u0915\u094B\u092E\u0932 \u0928\u093F\u0937\u093E\u0926', '9/5', '1017.60', '+17.60'],
            ['Ni', 'Shuddha Nishad', '\u0936\u0941\u0926\u094D\u0927 \u0928\u093F\u0937\u093E\u0926', '15/8', '1088.27', '-11.73'],
          ] as const).map(([swara, name, dev, ratio, cents, etDev]) => (
            <tr key={swara}>
              <td><strong>{swara}</strong></td>
              <td>{name}</td>
              <td className={styles.devanagari}>{dev}</td>
              <td className={styles.mono}>{ratio}</td>
              <td className={styles.mono}>{cents}</td>
              <td className={styles.mono}>{etDev}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.muted}>Cents deviation from equal temperament ranges from -15.64 to +17.60 &mdash; musically significant differences that every trained musician can hear.</p>

      <h3 className={styles.h3}>5.2 The 10 Bhatkhande Thaats</h3>
      <table className={styles.table}>
        <thead><tr><th>Thaat</th><th>Swara Set</th><th>Western</th><th>Key Ragas</th></tr></thead>
        <tbody>
          {([
            ['Kalyan', 'S R G M\u2020 P D N', 'Lydian', 'Yaman, Bhoopali, Hameer, Kedar'],
            ['Bilawal', 'S R G M P D N', 'Ionian', 'Bilawal, Alhaiya Bilawal'],
            ['Khamaj', 'S R G M P D n', 'Mixolydian', 'Khamaj, Desh, Tilak Kamod'],
            ['Bhairav', 'S r G M P d N', '\u2014', 'Bhairav'],
            ['Poorvi', 'S r G M\u2020 P d N', '\u2014', 'Puriya Dhanashri, Puriya'],
            ['Marwa', 'S r G M\u2020 P D N', '\u2014', 'Marwa, Sohini'],
            ['Kafi', 'S R g M P D n', 'Dorian', 'Kafi, Bhimpalasi, Bageshri'],
            ['Asavari', 'S R g M P d n', 'Aeolian', 'Asavari, Darbari Kanada'],
            ['Bhairavi', 'S r g M P d n', 'Phrygian', 'Bhairavi, Malkauns'],
            ['Todi', 'S r g M\u2020 P d N', '\u2014', 'Todi, Multani, Madhuvanti'],
          ] as const).map(([thaat, swaras, western, ragas]) => (
            <tr key={thaat}><td><strong>{thaat}</strong></td><td className={styles.mono}>{swaras}</td><td>{western}</td><td>{ragas}</td></tr>
          ))}
        </tbody>
      </table>

      <div className={styles.pageBreak} />

      <h3 className={styles.h3}>5.3 Ornaments &mdash; The Soul of Expression</h3>
      <table className={styles.table}>
        <thead><tr><th>Ornament</th><th>Trajectory</th><th>Duration (ms)</th><th>Rate (Hz)</th><th>Amplitude</th></tr></thead>
        <tbody>
          {([
            ['Meend', 'Logarithmic glide', '300\u20133000', '\u2014', 'Full interval'],
            ['Gamak', 'Sinusoidal', '200\u20131500', '4\u20138', '50\u2013150 cents'],
            ['Andolan', 'Sinusoidal (gentle)', '500\u20135000', '2\u20134', '15\u201340 cents'],
            ['Murki', 'Sequence (fast)', '100\u2013400', '\u2014', '2\u20134 notes'],
            ['Khatka', 'Impulse', '50\u2013200', '\u2014', '1\u20133 notes'],
            ['Zamzama', 'Sequence (extended)', '200\u2013800', '\u2014', '4\u20138 notes'],
            ['Kan', 'Impulse (grace)', '30\u2013100', '\u2014', '1 note'],
            ['Sparsh', 'Impulse (touch)', '30\u201380', '\u2014', '1 note'],
          ] as const).map(([name, traj, dur, rate, amp]) => (
            <tr key={name}><td><strong>{name}</strong></td><td>{traj}</td><td className={styles.mono}>{dur}</td><td className={styles.mono}>{rate}</td><td>{amp}</td></tr>
          ))}
        </tbody>
      </table>

      <h3 className={styles.h3}>5.4 Tala System</h3>
      <table className={styles.table}>
        <thead><tr><th>Tala</th><th>Beats</th><th>Vibhag</th><th>Sam</th><th>Khali</th></tr></thead>
        <tbody>
          <tr><td><strong>Teentaal</strong></td><td>16</td><td>4+4+4+4</td><td>Beat 1</td><td>Beat 9</td></tr>
          <tr><td><strong>Ektaal</strong></td><td>12</td><td>2+2+2+2+2+2</td><td>Beat 1</td><td>Beats 3, 7</td></tr>
          <tr><td><strong>Jhaptaal</strong></td><td>10</td><td>2+3+2+3</td><td>Beat 1</td><td>Beat 6</td></tr>
          <tr><td><strong>Rupak</strong></td><td>7</td><td>3+2+2</td><td>Beat 1 (= khali)</td><td>Beat 1</td></tr>
        </tbody>
      </table>

      <h3 className={styles.h3}>5.5 Tanpura Synthesis</h3>
      <ul className={styles.list}>
        <li><strong>4 strings</strong>: Pa(low), Sa, Sa, Sa(lower octave). Alternative: Ma replaces Pa for Ma-dominant ragas.</li>
        <li><strong>12 partials per string</strong>: Amplitudes derived from jivari bridge coupling model.</li>
        <li><strong>Characteristic shimmer</strong> from: rich overtone content, 2-cent detuning between the two Sa strings, natural beating between overlapping partials.</li>
        <li><strong>Pluck cycle</strong>: 4-second cycle (1.0s per string), configurable tempo.</li>
      </ul>
    </section>
  );
}

/* ================================================================
   6. VOICE PIPELINE
   ================================================================ */

function VoicePipeline() {
  return (
    <section>
      <div className={styles.pageBreak} />
      <SectionTitle>6. The Voice Pipeline &mdash; The Technical Moat</SectionTitle>
      <p className={styles.text}>Runs <strong>entirely in the browser</strong> at <strong>$0 cost</strong>, achieving <strong>&lt;50ms mic-to-visual latency</strong>.</p>

      <div className={styles.flow}>
        {([
          ['1. Microphone', 'browser getUserMedia API, permission-gated'],
          ['2. AnalyserNode', '2048-sample FFT window at 48kHz, overlapping updates'],
          ['3. RNNoise WASM', 'neural noise suppression, compiled to WebAssembly ($0)'],
          ['4. Pitchy McLeod', 'pitch detection: Hz + clarity score, <5ms per frame'],
          ['5. Pitch Mapping', 'Hz \u2192 cents \u2192 nearest swara (raga-context-aware)'],
          ['6. Raga Grammar', 'aroha/avaroha/vakra/varjit validation in real time'],
          ['7. Pakad Recognition', 'sliding window + subsequence matching across 30 ragas'],
          ['8. Accuracy Scoring', 'Gaussian model: exp(-(dev\u00B2) / (2\u03C3\u00B2)), level-adaptive'],
          ['9. Tantri + Canvas', '60fps string vibration, pitch trail, colour-coded feedback'],
        ] as const).map(([label, desc], i) => (
          <div key={label}>
            {i > 0 && <div className={styles.flowArrow}>{'\u2193'}</div>}
            <div className={styles.flowStep}><strong>{label}</strong> &mdash; {desc}</div>
          </div>
        ))}
      </div>

      <h3 className={styles.h3}>Latency Budget</h3>
      <table className={styles.table}>
        <thead><tr><th>Stage</th><th>Latency</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td>getUserMedia streaming</td><td>~0ms</td><td>Already buffered</td></tr>
          <tr><td>AnalyserNode FFT</td><td>~10ms</td><td>2048 samples at 48kHz, overlapping</td></tr>
          <tr><td>Pitchy McLeod detection</td><td>&lt;5ms</td><td>Runs on main thread</td></tr>
          <tr><td>Pitch mapping + raga grammar</td><td>&lt;0.5ms</td><td>Pure math, no allocation</td></tr>
          <tr><td>React state + render</td><td>~10&ndash;20ms</td><td>Concurrent mode, batched</td></tr>
          <tr><td><strong>Total</strong></td><td><strong>~25&ndash;35ms</strong></td><td><strong>Well within 50ms target</strong></td></tr>
        </tbody>
      </table>

      <h3 className={styles.h3}>Level-Adaptive Tolerance</h3>
      <table className={styles.table}>
        <thead><tr><th>Level</th><th>Tolerance</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>Shishya (Beginner)</td><td>&plusmn;50 cents</td><td>Generous &mdash; encourages exploration</td></tr>
          <tr><td>Sadhaka (Explorer)</td><td>&plusmn;25 cents</td><td>Tightening &mdash; precision matters</td></tr>
          <tr><td>Varistha (Scholar)</td><td>&plusmn;15 cents</td><td>Demanding &mdash; approaching shruti precision</td></tr>
          <tr><td>Guru (Master)</td><td>&plusmn;10 cents</td><td>Near-perfect intonation required</td></tr>
        </tbody>
      </table>
    </section>
  );
}

/* ================================================================
   7. TANTRI
   ================================================================ */

function TantriSection() {
  return (
    <section>
      <div className={styles.pageBreak} />
      <SectionTitle>7. Tantri &mdash; The Instrument Layer</SectionTitle>
      <p className={styles.text}><strong>Tantri</strong> (<span className={styles.devanagari}>{'\u0924\u0928\u094D\u0924\u094D\u0930\u0940'}</span> &mdash; string of a veena) is the bridge between the music engine&rsquo;s mathematics and the human ear. 12 horizontal strings, one per chromatic swara, positioned by just-intonation frequency ratio on a logarithmic scale.</p>

      <h3 className={styles.h3}>Spring Physics (Ragamala Motion Grammar)</h3>
      <table className={styles.table}>
        <thead><tr><th>Preset</th><th>Stiffness</th><th>Damping</th><th>Use Case</th></tr></thead>
        <tbody>
          <tr><td><strong>Tanpura Release</strong></td><td>400</td><td>15</td><td>Natural decay (~800ms), page load stagger</td></tr>
          <tr><td><strong>Andolan</strong></td><td>120</td><td>8</td><td>Gentle oscillation, hover states</td></tr>
          <tr><td><strong>Kan</strong></td><td>1000</td><td>30</td><td>Instant snap, press/tap feedback</td></tr>
          <tr><td><strong>Meend</strong></td><td>80</td><td>20</td><td>Slow glide, modal transitions</td></tr>
        </tbody>
      </table>

      <h3 className={styles.h3}>Progressive Disclosure</h3>
      <table className={styles.table}>
        <thead><tr><th>Level</th><th>Visible Strings</th><th>Behaviour</th></tr></thead>
        <tbody>
          <tr><td>Shishya</td><td>1 (Sa), then raga&rsquo;s aroha strings</td><td>Strings appear when earned through musical acts</td></tr>
          <tr><td>Sadhaka</td><td>Full thaat (7 swaras)</td><td>All swaras in parent scale visible</td></tr>
          <tr><td>Varistha</td><td>All 12 chromatic swaras</td><td>Full instrument revealed</td></tr>
          <tr><td>Guru</td><td>All 12 + precision overlay</td><td>Cents needle visible by default</td></tr>
        </tbody>
      </table>

      <div className={styles.calloutBlue}>
        <strong>Design principle:</strong> No announcements when new strings appear. The instrument grows as the student grows. The student notices one day &mdash; that discovery IS the ceremony.
      </div>
    </section>
  );
}

/* ================================================================
   8. USER LIFECYCLE
   ================================================================ */

function UserLifecycle() {
  return (
    <section>
      <div className={styles.pageBreak} />
      <SectionTitle>8. User Lifecycle: Onboarding to Mastery</SectionTitle>

      <h3 className={styles.h3}>8.1 Onboarding (2 minutes)</h3>
      <ol className={styles.list}>
        <li><strong>Sa Detection</strong>: Hum 3&ndash;5 times. Engine proposes your tonic (&ldquo;Your Sa is G3 (196 Hz)&rdquo;). Stored permanently in profile.</li>
        <li><strong>Journey Selection</strong>: Four paths visible immediately. Full vision from day one.</li>
        <li><strong>First Riyaz</strong>: Within 90 seconds, the tanpura is playing and the student is singing.</li>
      </ol>

      <h3 className={styles.h3}>8.2 Daily Session Loop</h3>
      <p className={styles.text}>Raga chosen by time of day: Dawn {'\u2192'} Bhairav, Morning {'\u2192'} Bhoopali, Afternoon {'\u2192'} Bhimpalasi, Evening {'\u2192'} Yaman, Night {'\u2192'} Bageshri. ~10 minutes. Zero decisions required. On completion: free practice.</p>

      <h3 className={styles.h3}>8.3 Four Journey Paths</h3>
      <div className={styles.levelGrid}>
        <div className={`${styles.levelCard} ${styles.levelShishya}`}>
          <h4>Shishya <span className={styles.devanagari}>{'\u0936\u093F\u0937\u094D\u092F'}</span></h4>
          <p>Levels 1&ndash;3 &bull; 8 lessons &bull; 355 XP &bull; 5 ragas &bull; &plusmn;50 cents<br/>
          <strong>Gate</strong>: 3-session challenge with 4-hour cooldown</p>
        </div>
        <div className={`${styles.levelCard} ${styles.levelSadhaka}`}>
          <h4>Sadhaka <span className={styles.devanagari}>{'\u0938\u093E\u0927\u0915'}</span></h4>
          <p>Levels 4&ndash;6 &bull; 10 lessons &bull; 420 XP &bull; 7 ragas &bull; &plusmn;25 cents<br/>
          <strong>Gate</strong>: 5 challenges including ornament execution</p>
        </div>
        <div className={`${styles.levelCard} ${styles.levelVaristha}`}>
          <h4>Varistha <span className={styles.devanagari}>{'\u0935\u0930\u093F\u0937\u094D\u0920'}</span></h4>
          <p>Levels 7&ndash;9 &bull; 11 lessons &bull; 645 XP &bull; 12+ ragas &bull; &plusmn;15 cents<br/>
          <strong>Gate</strong>: 5-session gate with 6-hour cooldown</p>
        </div>
        <div className={`${styles.levelCard} ${styles.levelGuru}`}>
          <h4>Guru <span className={styles.devanagari}>{'\u0917\u0941\u0930\u0941'}</span></h4>
          <p>Levels 10+ &bull; 10 exercises &bull; 510+ XP &bull; All 30 ragas &bull; &plusmn;10 cents<br/>
          <strong>Capstone</strong>: Open mastery, no upper bound</p>
        </div>
      </div>

      <h3 className={styles.h3}>8.4 The Pakad Recognition Moment</h3>
      <p className={styles.text}>When the engine detects the student singing a raga&rsquo;s characteristic phrase, a <strong>2-layer cinematic moment</strong> unfolds: tanpura continues, background deepens, raga name appears large center screen with the phrase in sargam notation. Fades to a quiet record at the bottom. Unrepeatable in its first-time impact.</p>
    </section>
  );
}

/* ================================================================
   9. CURRICULUM ARCHITECTURE
   ================================================================ */

function CurriculumArchitecture() {
  return (
    <section>
      <div className={styles.pageBreak} />
      <SectionTitle>9. Curriculum Architecture &mdash; Complete Lesson Catalog</SectionTitle>
      <p className={styles.text}>39 lessons across 4 levels. Pedagogical arc: <strong>listen before naming, hear before singing, sing before analysing, analyse before creating</strong>.</p>

      <h3 className={styles.h3}>9.1 Shishya Level (Beginner) &mdash; 8 Lessons, 355 XP</h3>
      <table className={styles.table}>
        <thead><tr><th>#</th><th>Title</th><th>Raga</th><th>Min</th><th>XP</th><th>Key Concepts</th></tr></thead>
        <tbody>
          <tr><td>B-01</td><td><strong>Your First Raga</strong></td><td>Bhoopali</td><td>10</td><td>30</td><td>5-note pentatonic, first singing, passive pakad recognition</td></tr>
          <tr><td>B-02</td><td><strong>Sa and Pa</strong></td><td>Pre-raga</td><td>8</td><td>25</td><td>Sa-Pa interval (3:2), call-and-response</td></tr>
          <tr><td>B-03</td><td><strong>The Evening Raga</strong></td><td>Yaman</td><td>12</td><td>35</td><td>Tivra Ma, 7-note scale, Ni-Re-Ga opening</td></tr>
          <tr><td>B-04</td><td><strong>The Dawn Raga</strong></td><td>Bhairav</td><td>12</td><td>35</td><td>Komal Re + Dha, andolan preview</td></tr>
          <tr><td>B-05</td><td><strong>The Afternoon Raga</strong></td><td>Bhimpalasi</td><td>12</td><td>40</td><td>Asymmetric aroha/avaroha (5 up, 7 down)</td></tr>
          <tr><td>B-06</td><td><strong>The Midnight Raga</strong></td><td>Bageshri</td><td>12</td><td>40</td><td>Same swaras as Bhimpalasi, different identity</td></tr>
          <tr><td>B-07</td><td><strong>The Five Ragas</strong></td><td>Multi</td><td>10</td><td>50</td><td>Raga identification ear training, 5 rounds</td></tr>
          <tr><td>B-08</td><td><strong>Shishya Challenge</strong></td><td>Multi</td><td>10</td><td>100</td><td>3-session gate: Sa/Pa &plusmn;30c, pakad of 2 ragas</td></tr>
        </tbody>
      </table>

      <h3 className={styles.h3}>9.2 Sadhaka Level (Explorer) &mdash; 10 Lessons, 420 XP</h3>
      <table className={styles.table}>
        <thead><tr><th>#</th><th>Title</th><th>Raga</th><th>Min</th><th>XP</th><th>Key Concepts</th></tr></thead>
        <tbody>
          <tr><td>S-01</td><td><strong>The Monsoon Raga</strong></td><td>Desh</td><td>12</td><td>45</td><td>Mixed swaras, meend preview</td></tr>
          <tr><td>S-02</td><td><strong>The Glide</strong></td><td>Bhoopali</td><td>10</td><td>40</td><td>Meend: Sa-Re, Sa-Ga, Sa-Pa trajectories</td></tr>
          <tr><td>S-03</td><td><strong>The Gentle Wave</strong></td><td>Bhairav</td><td>10</td><td>40</td><td>Andolan: 2&ndash;4 Hz, 15&ndash;40 cents amplitude</td></tr>
          <tr><td>S-04</td><td><strong>The Parent Raga</strong></td><td>Kafi</td><td>12</td><td>45</td><td>Raga comparison: 3 ragas, 1 thaat</td></tr>
          <tr><td>S-05</td><td><strong>The First Rhythm</strong></td><td>&mdash;</td><td>10</td><td>35</td><td>Teentaal: 16 beats, sam/khali</td></tr>
          <tr><td>S-06</td><td><strong>Rules of Movement</strong></td><td>Multi</td><td>12</td><td>40</td><td>Raga grammar, valid/invalid phrases</td></tr>
          <tr><td>S-07</td><td><strong>The Shake</strong></td><td>Bhimpalasi</td><td>10</td><td>40</td><td>Gamak: 4&ndash;8 Hz, 50&ndash;150 cents</td></tr>
          <tr><td>S-08</td><td><strong>Call and Response</strong></td><td>Multi</td><td>12</td><td>40</td><td>Ornamented phrases, ornament detection</td></tr>
          <tr><td>S-09</td><td><strong>Hearing Distance</strong></td><td>&mdash;</td><td>10</td><td>40</td><td>Interval recognition: 6 intervals</td></tr>
          <tr><td>S-10</td><td><strong>Sadhaka Challenge</strong></td><td>Multi</td><td>12</td><td>150</td><td>5 challenges, 3-session gate</td></tr>
        </tbody>
      </table>

      <div className={styles.pageBreak} />

      <h3 className={styles.h3}>9.3 Varistha Level (Scholar) &mdash; 11 Lessons, 645 XP</h3>
      <table className={styles.table}>
        <thead><tr><th>#</th><th>Title</th><th>Raga</th><th>XP</th><th>Key Concepts</th></tr></thead>
        <tbody>
          <tr><td>V-01</td><td><strong>The Absent Fifth</strong></td><td>Marwa</td><td>60</td><td>Pa omitted &mdash; fundamental instability</td></tr>
          <tr><td>V-02</td><td><strong>Same Thaat, Different Worlds</strong></td><td>Multi</td><td>50</td><td>Advanced raga comparison</td></tr>
          <tr><td>V-03</td><td><strong>The Profound Andolan</strong></td><td>Darbari Kanada</td><td>60</td><td>Ornament as structure, vakra avaroha</td></tr>
          <tr><td>V-04</td><td><strong>Creating Valid Phrases</strong></td><td>Multi</td><td>50</td><td>Composition: student creates, engine validates</td></tr>
          <tr><td>V-05</td><td><strong>Evening Tension</strong></td><td>Puriya Dhanashri</td><td>55</td><td>Poorvi thaat, 3 altered swaras</td></tr>
          <tr><td>V-06</td><td><strong>Where Ornaments Belong</strong></td><td>Multi</td><td>50</td><td>Ornament context grammar</td></tr>
          <tr><td>V-07</td><td><strong>Power in Five Notes</strong></td><td>Malkauns</td><td>55</td><td>Pentatonic komal &mdash; mirror of Bhoopali</td></tr>
          <tr><td>V-08</td><td><strong>The 22 Positions</strong></td><td>Multi</td><td>55</td><td>Shruti discrimination exercise</td></tr>
          <tr><td>V-09</td><td><strong>Chromatic Density</strong></td><td>Todi</td><td>60</td><td>4 altered swaras, maximum density</td></tr>
          <tr><td>V-10</td><td><strong>Melody Meets Rhythm</strong></td><td>Multi</td><td>50</td><td>Tala-melody integration</td></tr>
          <tr><td>V-11</td><td><strong>Varistha Challenge</strong></td><td>Multi</td><td>250</td><td>5-session gate, unlocks Guru</td></tr>
        </tbody>
      </table>

      <h3 className={styles.h3}>9.4 Guru Level (Master) &mdash; 10 Exercises, 510+ XP</h3>
      <table className={styles.table}>
        <thead><tr><th>#</th><th>Title</th><th>Raga</th><th>XP</th><th>Key Concepts</th></tr></thead>
        <tbody>
          <tr><td>G-01</td><td><strong>The Listening Guru</strong></td><td>Multi</td><td>60</td><td>Advanced raga identification</td></tr>
          <tr><td>G-02</td><td><strong>The Fixed Composition</strong></td><td>Yaman</td><td>60</td><td>Bandish: mukhda and antara</td></tr>
          <tr><td>G-03</td><td><strong>The Flexible Raga</strong></td><td>Bhairavi</td><td>65</td><td>Controlled deviation (chhayanat)</td></tr>
          <tr><td>G-04</td><td><strong>Where One Becomes Another</strong></td><td>Multi</td><td>55</td><td>Cross-raga modulation awareness</td></tr>
          <tr><td>G-05</td><td><strong>The Fast Run</strong></td><td>Yaman</td><td>55</td><td>Taan patterns at speed</td></tr>
          <tr><td>G-06</td><td><strong>The Two Mas</strong></td><td>Kedar/Hameer</td><td>60</td><td>Dual Ma (shuddha + tivra) in one raga</td></tr>
          <tr><td>G-07</td><td><strong>Same Constraint</strong></td><td>Sohini/Marwa</td><td>60</td><td>Both omit Pa, different identities</td></tr>
          <tr><td>G-08</td><td><strong>The Complete Rendering</strong></td><td>Choice</td><td>80</td><td>Capstone: Alap {'\u2192'} Jod {'\u2192'} Jhala</td></tr>
          <tr><td>G-09</td><td><strong>The Guru Teaches</strong></td><td>Choice</td><td>70</td><td>Teaching exercise</td></tr>
          <tr><td>G-10</td><td><strong>No Ceiling</strong></td><td>Choice</td><td>0</td><td>Infinite open mastery</td></tr>
        </tbody>
      </table>

      <h3 className={styles.h3}>Curriculum Summary</h3>
      <table className={styles.table}>
        <thead><tr><th>Level</th><th>Lessons</th><th>XP</th><th>Ragas</th><th>Tolerance</th><th>Gate</th></tr></thead>
        <tbody>
          <tr><td>Shishya</td><td>8</td><td>355</td><td>5</td><td>&plusmn;50c</td><td>3-session, 4hr cooldown</td></tr>
          <tr><td>Sadhaka</td><td>10</td><td>420</td><td>7</td><td>&plusmn;25c</td><td>3-session, multi-challenge</td></tr>
          <tr><td>Varistha</td><td>11</td><td>645</td><td>12+</td><td>&plusmn;15c</td><td>5-session, 6hr cooldown</td></tr>
          <tr><td>Guru</td><td>10</td><td>510+</td><td>30</td><td>&plusmn;10c</td><td>Open mastery</td></tr>
          <tr><td><strong>Total</strong></td><td><strong>39</strong></td><td><strong>~1,930</strong></td><td><strong>30</strong></td><td>&mdash;</td><td>&mdash;</td></tr>
        </tbody>
      </table>
      <p className={styles.muted}>20 unique phase types introduced progressively across levels.</p>
    </section>
  );
}

/* ================================================================
   10. RAGA CATALOG
   ================================================================ */

function RagaCatalog() {
  return (
    <section>
      <div className={styles.pageBreak} />
      <SectionTitle>10. The 30-Raga Catalog</SectionTitle>
      <p className={styles.text}>Each raga is a complete TypeScript object: aroha, avaroha, pakad, vadi/samvadi, jati, thaat, prahara, rasa, ornamentMap, vakra, gharana variations, and related ragas.</p>
      <table className={styles.table}>
        <thead><tr><th>Raga</th><th className={styles.devanagari}>Devanagari</th><th>Thaat</th><th>Time</th><th>Jati</th><th>Level</th></tr></thead>
        <tbody>
          {([
            ['Bhoopali', '\u092D\u0942\u092A\u093E\u0932\u0940', 'Kalyan', 'Dusk', 'Audava-Audava', 'Shishya'],
            ['Yaman', '\u092F\u092E\u0928', 'Kalyan', 'Evening', 'Sampoorna', 'Shishya'],
            ['Bhairav', '\u092D\u0948\u0930\u0935', 'Bhairav', 'Dawn', 'Sampoorna', 'Shishya'],
            ['Bhimpalasi', '\u092D\u0940\u092E\u092A\u0932\u093E\u0938\u0940', 'Kafi', 'Afternoon', 'Audava-Samp.', 'Shishya'],
            ['Bageshri', '\u092C\u093E\u0917\u0947\u0936\u094D\u0930\u0940', 'Kafi', 'Night', 'Audava-Samp.', 'Shishya'],
            ['Desh', '\u0926\u0947\u0936', 'Khamaj', 'Night', 'Audava-Samp.', 'Sadhaka'],
            ['Kafi', '\u0915\u093E\u095E\u0940', 'Kafi', 'Night', 'Sampoorna', 'Sadhaka'],
            ['Pahadi', '\u092A\u0939\u093E\u0921\u093C\u0940', 'Bilawal', 'Night', 'Audava', 'Sadhaka'],
            ['Durga', '\u0926\u0941\u0930\u094D\u0917\u093E', 'Bilawal', 'Night', 'Audava', 'Sadhaka'],
            ['Hamsadhwani', '\u0939\u0902\u0938\u0927\u094D\u0935\u0928\u093F', 'Bilawal', 'Night', 'Audava', 'Sadhaka'],
            ['Bilawal', '\u092C\u093F\u0932\u093E\u0935\u0932', 'Bilawal', 'Morning', 'Sampoorna', 'Sadhaka'],
            ['Asavari', '\u0906\u0938\u093E\u0935\u0930\u0940', 'Asavari', 'Morning', 'Sampoorna', 'Sadhaka'],
            ['Khamaj', '\u0916\u092E\u093E\u091C', 'Khamaj', 'Night', 'Sampoorna', 'Sadhaka'],
            ['Jog', '\u091C\u094B\u0917', 'Khamaj', 'Night', 'Shadava-Samp.', 'Sadhaka'],
            ['Tilak Kamod', '\u0924\u093F\u0932\u0915 \u0915\u093E\u092E\u094B\u0926', 'Khamaj', 'Night', 'Shadava-Samp.', 'Sadhaka'],
            ['Marwa', '\u092E\u093E\u0930\u0935\u093E', 'Marwa', 'Sunset', 'Shadava', 'Varistha'],
            ['Darbari Kanada', '\u0926\u0930\u092C\u093E\u0930\u0940', 'Asavari', 'Night', 'Sampoorna', 'Varistha'],
            ['Puriya Dhanashri', '\u092A\u0942\u0930\u093F\u092F\u093E \u0927\u0928\u093E\u0936\u094D\u0930\u0940', 'Poorvi', 'Sunset', 'Sampoorna', 'Varistha'],
            ['Malkauns', '\u092E\u093E\u0932\u0915\u094C\u0902\u0938', 'Bhairavi', 'Night', 'Audava', 'Varistha'],
            ['Todi', '\u0924\u094B\u0921\u093C\u0940', 'Todi', 'Morning', 'Sampoorna', 'Varistha'],
            ['Kedar', '\u0915\u0947\u0926\u093E\u0930', 'Kalyan', 'Night', 'Shadava-Samp.', 'Varistha'],
            ['Hameer', '\u0939\u092E\u0940\u0930', 'Kalyan', 'Night', 'Sampoorna', 'Varistha'],
            ['Puriya', '\u092A\u0942\u0930\u093F\u092F\u093E', 'Marwa', 'Sunset', 'Sampoorna', 'Varistha'],
            ['Lalit', '\u0932\u0932\u093F\u0924', 'Marwa', 'Dawn', 'Sampoorna', 'Varistha'],
            ['Multani', '\u092E\u0941\u0932\u094D\u0924\u093E\u0928\u0940', 'Todi', 'Afternoon', 'Shadava-Samp.', 'Varistha'],
            ['Madhuvanti', '\u092E\u0927\u0941\u0935\u0902\u0924\u0940', 'Todi', 'Afternoon', 'Shadava-Samp.', 'Varistha'],
            ['Bhairavi', '\u092D\u0948\u0930\u0935\u0940', 'Bhairavi', 'Morning', 'Sampoorna', 'Guru'],
            ['Sohini', '\u0938\u094B\u0939\u093F\u0928\u0940', 'Marwa', 'Night', 'Audava', 'Guru'],
            ['Shree', '\u0936\u094D\u0930\u0940', 'Poorvi', 'Sunset', 'Sampoorna', 'Guru'],
            ['Jaunpuri', '\u091C\u094C\u0928\u092A\u0941\u0930\u0940', 'Asavari', 'Morning', 'Sampoorna', 'Guru'],
          ] as const).map(([name, dev, thaat, time, jati, level]) => (
            <tr key={name}><td><strong>{name}</strong></td><td className={styles.devanagari}>{dev}</td><td>{thaat}</td><td>{time}</td><td>{jati}</td><td>{level}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* ================================================================
   11. DESIGN SYSTEM
   ================================================================ */

function DesignSystem() {
  return (
    <section>
      <div className={styles.pageBreak} />
      <SectionTitle>11. Design System &mdash; Ragamala</SectionTitle>
      <p className={styles.text}>Named after the Ragamala tradition of Indian miniature painting: a garland of ragas, each given a visual world of colour, mood, season, and time of day.</p>

      <table className={styles.table}>
        <thead><tr><th>Element</th><th>Choice</th></tr></thead>
        <tbody>
          <tr><td>Layout</td><td>Single-column practice. One thing at a time.</td></tr>
          <tr><td>Typography</td><td>Cormorant Garamond / Noto Serif Devanagari / Inter / IBM Plex Mono</td></tr>
          <tr><td>Accent</td><td>Saffron #E8871E &mdash; earned only. Never decorative.</td></tr>
          <tr><td>Mastery</td><td>Gold #D4AF37 &mdash; Guru level. Zarr-kashi only.</td></tr>
          <tr><td>Night bg</td><td>Deep Malachite #0A1A14</td></tr>
          <tr><td>Day bg</td><td>Ivory #F5F0E8</td></tr>
          <tr><td>Logo</td><td>Tantri Resonance Mark: text-dominant wordmark with string accent</td></tr>
          <tr><td>Motion</td><td>Spring physics: named ornament presets (Tanpura Release, Meend, Kan, Andolan)</td></tr>
        </tbody>
      </table>

      <h3 className={styles.h3}>Voice Feedback Visualisation (3 Layers)</h3>
      <ol className={styles.list}>
        <li><strong>Layer 1 (ambient)</strong>: Live voice waveform alongside tanpura waveform. In tune = waves align. Three.js.</li>
        <li><strong>Layer 2 (primary)</strong>: Target swara as glowing circle. Student pitch as moving dot with trail.</li>
        <li><strong>Layer 3 (precision)</strong>: Cents needle (&minus;50 to +50). Varistha/Guru see by default; others on-demand.</li>
      </ol>

      <h3 className={styles.h3}>Raga Colour Worlds</h3>
      <table className={styles.table}>
        <thead><tr><th>Raga</th><th>Palette</th><th>Time</th></tr></thead>
        <tbody>
          <tr><td>Bhairav</td><td>Pre-dawn grey, temple ochre, ash</td><td>Dawn</td></tr>
          <tr><td>Yaman</td><td>Deep indigo, lamp gold, sandalwood</td><td>Evening</td></tr>
          <tr><td>Bhoopali</td><td>Sunset amber, warm ivory</td><td>Dusk</td></tr>
          <tr><td>Bhimpalasi</td><td>Monsoon green, rain grey</td><td>Afternoon</td></tr>
          <tr><td>Bageshri</td><td>Midnight blue, moonlight silver</td><td>Night</td></tr>
        </tbody>
      </table>
    </section>
  );
}

/* ================================================================
   12. TECH STACK
   ================================================================ */

function TechStack() {
  return (
    <section>
      <div className={styles.pageBreak} />
      <SectionTitle>12. Technical Stack &amp; $0 Architecture</SectionTitle>
      <p className={styles.text}>S&#x101;dhan&#x101; operates at <strong>$0 monthly cost</strong>. Every computational task runs in the user&rsquo;s browser. This is not a limitation &mdash; it makes the product infinitely scalable without marginal cost per user.</p>

      <table className={styles.table}>
        <thead><tr><th>Layer</th><th>Technology</th><th>Purpose</th><th>Cost</th></tr></thead>
        <tbody>
          <tr><td>Frontend</td><td>Next.js 15, React 19, TypeScript</td><td>Application shell, SSR, routing</td><td>$0</td></tr>
          <tr><td>Animation</td><td>Framer Motion v12, GSAP 3</td><td>Spring physics, cinematic sequences</td><td>$0</td></tr>
          <tr><td>3D</td><td>Three.js r170</td><td>Tanpura waveform visualisation</td><td>$0</td></tr>
          <tr><td>Synthesis</td><td>Tone.js 15, Web Audio API</td><td>Tanpura, harmonium, tala pulse</td><td>$0</td></tr>
          <tr><td>Denoising</td><td>RNNoise WASM</td><td>Neural noise suppression</td><td>$0</td></tr>
          <tr><td>Pitch</td><td>Pitchy (McLeod Method)</td><td>Real-time Hz + clarity</td><td>$0</td></tr>
          <tr><td>Data</td><td>Supabase free tier</td><td>Auth, profiles, sessions, progress</td><td>$0</td></tr>
          <tr><td>Hosting</td><td>Vercel free tier</td><td>Static export, CDN</td><td>$0</td></tr>
          <tr><td colSpan={3}><strong>Total monthly cost</strong></td><td><strong>$0</strong></td></tr>
        </tbody>
      </table>

      <div className={styles.calloutBlue}>
        <strong>Scaling implication:</strong> Cost per user is effectively $0. The 1,000th user costs the same as the 1st. Revenue is 100% margin from the first dollar.
      </div>
    </section>
  );
}

/* ================================================================
   13. DATA MODEL
   ================================================================ */

function DataModel() {
  return (
    <section>
      <div className={styles.pageBreak} />
      <SectionTitle>13. Data Model &amp; Schema</SectionTitle>
      <p className={styles.text}>6 tables in Supabase PostgreSQL, all with Row Level Security (RLS).</p>

      <table className={styles.table}>
        <thead><tr><th>Table</th><th>Purpose</th><th>Key Columns</th></tr></thead>
        <tbody>
          <tr><td><strong>profiles</strong></td><td>User identity</td><td>id, display_name, journey, level, xp, sa_hz (default 261.63), current_raga</td></tr>
          <tr><td><strong>sessions</strong></td><td>Practice sessions</td><td>user_id, raga_id, duration_s, xp_earned, avg_accuracy, pakad_found</td></tr>
          <tr><td><strong>exercise_attempts</strong></td><td>Individual attempts</td><td>session_id, exercise_type, swara_target, hz_sung, cents_dev, accuracy</td></tr>
          <tr><td><strong>lesson_progress</strong></td><td>Lesson completion</td><td>user_id, lesson_id, status, best_accuracy, attempt_count</td></tr>
          <tr><td><strong>streaks</strong></td><td>Daily riyaz</td><td>user_id, current_streak, longest_streak, last_riyaz_date</td></tr>
          <tr><td><strong>raga_encounters</strong></td><td>Per-raga depth</td><td>user_id, raga_id, session_count, total_minutes, best_accuracy</td></tr>
        </tbody>
      </table>

      <pre className={styles.pre}>{`profiles                 -- auto-created on auth signup
  +-- sessions           -- one row per practice session
  |     +-- exercise_attempts  -- each pitch/phrase/pakad attempt
  +-- lesson_progress    -- tracks completion across curriculum
  +-- streaks            -- current/longest streak
  +-- raga_encounters    -- per-raga: sessions, minutes, accuracy`}</pre>
    </section>
  );
}

/* ================================================================
   14. PEDAGOGICAL FRAMEWORK
   ================================================================ */

function PedagogicalFramework() {
  return (
    <section>
      <div className={styles.pageBreak} />
      <SectionTitle>14. Pedagogical Framework &amp; References</SectionTitle>

      <h3 className={styles.h3}>Principles</h3>
      <ol className={styles.list}>
        <li><strong>The Presence Rule</strong>: Hear before label. Every concept experienced through sound before receiving a name.</li>
        <li><strong>Progressive Disclosure</strong>: Interface reveals complexity as earned through musical acts. No announcements.</li>
        <li><strong>Spaced Consistency</strong>: Mastery gates require passing across multiple sessions with cooldowns (4&ndash;6 hours).</li>
        <li><strong>Raga as Teacher</strong>: Each raga teaches a specific concept through its own nature.</li>
        <li><strong>Error as Exploration</strong>: Deviation is information, not failure.</li>
      </ol>

      <h3 className={styles.h3}>Academic References</h3>
      <table className={styles.table}>
        <thead><tr><th>Author</th><th>Work</th><th>Contribution</th></tr></thead>
        <tbody>
          <tr><td>Bharata Muni</td><td><em>Natya Shastra</em> (c. 200 BCE)</td><td>22-shruti system, frequency foundations</td></tr>
          <tr><td>Bhatkhande, V.N.</td><td><em>Hindustani Sangeet Paddhati</em></td><td>10-thaat classification system</td></tr>
          <tr><td>Jairazbhoy, N.A.</td><td><em>The Rags of North Indian Music</em></td><td>Raga structure, melodic rules</td></tr>
          <tr><td>Deva, B.C.</td><td><em>The Music of India: A Scientific Study</em></td><td>Acoustic analysis of instruments</td></tr>
          <tr><td>Raja, Deepak</td><td><em>Hindustani Music: Tradition in Transition</em></td><td>Contemporary raga practice</td></tr>
          <tr><td>Dani&eacute;lou, Alain</td><td><em>Music and the Power of Sound</em></td><td>Just intonation ratios</td></tr>
          <tr><td>Helmholtz, H.L.F.</td><td><em>On the Sensations of Tone</em></td><td>Consonance theory, critical bands</td></tr>
          <tr><td>McLeod &amp; Wyvill</td><td>&ldquo;A smarter way to find pitch&rdquo; (2005)</td><td>McLeod Pitch Method algorithm</td></tr>
          <tr><td>Valin, J-M.</td><td>RNNoise (2018)</td><td>Neural noise suppression</td></tr>
        </tbody>
      </table>
    </section>
  );
}

/* ================================================================
   15. ROADMAP
   ================================================================ */

function Roadmap() {
  return (
    <section>
      <div className={styles.pageBreak} />
      <SectionTitle>15. Roadmap &amp; Go-to-Market</SectionTitle>

      <table className={styles.table}>
        <thead><tr><th>Version</th><th>Scope</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td><strong>v1.0</strong></td><td>Full engine, 30 ragas, 4 journeys + freeform, voice pipeline, Tantri, 39 lessons, 318 tests, PWA</td><td className={styles.saffron}><strong>Built</strong></td></tr>
          <tr><td><strong>v1.1</strong></td><td>Mastery gates enforced, expanded tala, bandish library, Hindi/Marathi localisation</td><td>Planned</td></tr>
          <tr><td><strong>v1.5</strong></td><td>Offline PWA, session sync, expanded to 50 ragas</td><td>Planned</td></tr>
          <tr><td><strong>v2.0</strong></td><td>Social features, gharana variations, AI phrase suggestions</td><td>Planned</td></tr>
          <tr><td><strong>v3.0</strong></td><td>Mobile native, live lesson marketplace, institutional licensing</td><td>Vision</td></tr>
        </tbody>
      </table>

      <h3 className={styles.h3}>Revenue Model</h3>
      <table className={styles.table}>
        <thead><tr><th>Tier</th><th>Price</th><th>Access</th></tr></thead>
        <tbody>
          <tr><td><strong>Free</strong></td><td>$0</td><td>Shishya level (8 lessons, 5 ragas), freeform, daily riyaz</td></tr>
          <tr><td><strong>Sadhaka</strong></td><td>$4.99/mo</td><td>+ Explorer journey (ornaments, ear training, 7 ragas)</td></tr>
          <tr><td><strong>Guru</strong></td><td>$9.99/mo</td><td>Full access: all 39 lessons, all 30 ragas, analytics</td></tr>
          <tr><td><strong>Institutional</strong></td><td>Custom</td><td>Bulk licensing, student management</td></tr>
        </tbody>
      </table>

      <h3 className={styles.h3}>Why Now</h3>
      <ol className={styles.list}>
        <li><strong>Web Audio maturity</strong>: Real-time pitch detection is reliable in modern browsers</li>
        <li><strong>WASM performance</strong>: Neural denoising without cloud compute</li>
        <li><strong>32M+ diaspora</strong> seeking cultural connection through music</li>
        <li><strong>$0 infrastructure</strong>: Browser compute + free tiers eliminate scaling costs</li>
        <li><strong>No competition</strong> at this intersection of technology and tradition</li>
        <li><strong>Post-pandemic</strong>: Remote music education is a permanent shift</li>
      </ol>
    </section>
  );
}

/* ================================================================
   FOOTER
   ================================================================ */

function PageFooter() {
  return (
    <div className={styles.footer}>
      <em>S&#x101;dhan&#x101;: not learning about music. Becoming it.</em>
      <br /><br />
      Contact: aacrit@gmail.com | April 2026 | Confidential
    </div>
  );
}
