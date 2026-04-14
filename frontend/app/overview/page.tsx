/**
 * /overview — Investor overview page
 *
 * A beautifully formatted, print-ready overview of the Sadhana product.
 * Accessible at /overview. Print to PDF from browser for sharing.
 *
 * Uses inline styles to be self-contained and render correctly
 * regardless of the app's design tokens.
 */

import type { Metadata } from 'next';
import styles from './overview.module.css';

export const metadata: Metadata = {
  title: 'Sadhana — Overview',
  description: 'A music physics engine for Hindustani classical vocal training.',
};

export default function OverviewPage() {
  return (
    <div className={styles.doc}>
      <Cover />
      <ExecutiveSummary />
      <TheProblem />
      <SystemArchitecture />
      <VoicePipeline />
      <UserLifecycle />
      <CurriculumCatalog />
      <DesignAndStack />
      <DataModelAndRoadmap />
      <PageFooter />
    </div>
  );
}

function Cover() {
  return (
    <div className={styles.cover}>
      <svg className={styles.coverLogo} width="200" height="40" viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg">
        <line x1="10" y1="8" x2="190" y2="8" stroke="#0A1A14" strokeWidth="1" opacity="0.3"/>
        <line x1="10" y1="15" x2="190" y2="15" stroke="#0A1A14" strokeWidth="1" opacity="0.4"/>
        <line x1="10" y1="20" x2="190" y2="20" stroke="#E8871E" strokeWidth="2"/>
        <circle cx="10" cy="20" r="3" fill="#E8871E"/>
        <line x1="10" y1="27" x2="190" y2="27" stroke="#0A1A14" strokeWidth="1" opacity="0.4"/>
        <line x1="10" y1="34" x2="190" y2="34" stroke="#0A1A14" strokeWidth="1" opacity="0.3"/>
        <path d="M 12 20 Q 30 14, 48 20 Q 66 26, 84 20 Q 102 14, 120 20 Q 138 26, 156 20 Q 174 14, 190 20"
              stroke="#E8871E" strokeWidth="1.5" fill="none" opacity="0.6"/>
      </svg>
      <h1 className={styles.coverTitle}>Sadhana</h1>
      <div className={styles.coverDevanagari}>{'\u0938\u093E\u0927\u0928\u093E'}</div>
      <div className={styles.coverTagline}>Disciplined practice toward mastery</div>
      <div className={styles.coverSubtitle}>
        A music physics engine for Hindustani classical vocal training.
        Real-time voice feedback. 30 ragas. Zero operational cost.
        The world&rsquo;s first browser-based Indian classical music learning platform.
      </div>
      <div className={styles.coverDate}>April 2026 | Confidential</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h2 className={styles.sectionTitle}>{children}</h2>
      <div className={styles.accentBar} />
    </>
  );
}

function ExecutiveSummary() {
  return (
    <section>
      <div className={styles.pageBreak} />
      <SectionTitle>1. Executive Summary</SectionTitle>
      <p className={styles.text}>
        <strong>Sadhana</strong> is the world&rsquo;s first browser-based Hindustani classical music training application
        built on a comprehensive music physics engine. It transforms the student&rsquo;s device into an interactive
        instrument that listens, responds, and teaches &mdash; all at <strong>$0 operational cost</strong>.
      </p>
      <p className={styles.text}>
        <strong>The core insight:</strong> Existing music apps teach Western music theory or treat Indian music
        as a subset of Western frameworks. Sadhana builds from first principles: 22 shrutis, just intonation frequency
        ratios, raga grammar rules, and the oral-tradition pedagogy of Hindustani classical music.
      </p>
      <div className={styles.metrics}>
        {[
          ['~19,000', 'Lines of engine code'],
          ['30', 'Ragas in catalog'],
          ['57', 'Curriculum lessons'],
          ['318', 'Unit tests passing'],
          ['<50ms', 'Voice-to-visual latency'],
          ['$0/mo', 'Operational cost'],
        ].map(([value, label]) => (
          <div key={label} className={styles.metric}>
            <span className={styles.metricValue}>{value}</span>
            <span className={styles.metricLabel}>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function TheProblem() {
  return (
    <section>
      <SectionTitle>2. The Problem</SectionTitle>
      <h3 className={styles.h3}>Market Gap</h3>
      <p className={styles.text}>Hindustani classical music has <strong>300+ million practitioners</strong> across South Asia and the diaspora. Yet:</p>
      <ul className={styles.list}>
        <li><strong>No digital tool</strong> teaches raga grammar (melodic movement rules, not just scales)</li>
        <li><strong>No app</strong> uses just intonation &mdash; the mathematically correct tuning system</li>
        <li><strong>No platform</strong> provides context-aware pitch feedback that understands raga-specific microtonal positions</li>
        <li>Western music apps (Yousician, Simply Piano) serve 50M+ users but cannot teach Indian music correctly</li>
      </ul>
      <h3 className={styles.h3}>The Opportunity</h3>
      <ul className={styles.list}>
        <li><strong>Global Indian diaspora</strong>: 32 million people seeking cultural connection</li>
        <li><strong>Growing mindfulness market</strong>: Hindustani music is inherently meditative</li>
        <li><strong>Underserved market</strong>: No serious competitor exists</li>
      </ul>
    </section>
  );
}

function SystemArchitecture() {
  return (
    <section>
      <div className={styles.pageBreak} />
      <SectionTitle>3. System Architecture</SectionTitle>
      <p className={styles.text}>Sadhana is a <strong>music physics engine</strong> &mdash; the equivalent of NVIDIA PhysX, but for sound.</p>
      <div className={styles.archDiagram}>
        <div className={`${styles.archLayer} ${styles.archEngine}`}>
          <div className={styles.archLabel}>The Engine &mdash; /engine/ (19,000 lines TypeScript)</div>
          {'physics/ \u2192 theory/ \u2192 analysis/ \u2192 synthesis/ \u2192 voice/ \u2192 interaction/ (Tantri)'}
        </div>
        <div className={styles.archArrow}>{'\u2193 engine exposes typed API'}</div>
        <div className={`${styles.archLayer} ${styles.archJourney}`}>
          <div className={styles.archLabel}>Journeys &mdash; /frontend/app/journeys/</div>
          {'Beginner \u2022 Explorer \u2022 Scholar \u2022 Master \u2022 Freeform'}
        </div>
        <div className={styles.archArrow}>{'\u2193 React components'}</div>
        <div className={`${styles.archLayer} ${styles.archPresentation}`}>
          <div className={styles.archLabel}>Presentation &mdash; Next.js 15 / React 19</div>
          {'Framer Motion v12 \u2022 GSAP 3 \u2022 Three.js r170'}
        </div>
        <div className={styles.archArrow}>{'\u2193 Supabase JS client'}</div>
        <div className={`${styles.archLayer} ${styles.archData}`}>
          <div className={styles.archLabel}>Data &mdash; Supabase (free tier, $0)</div>
          {'profiles \u2022 sessions \u2022 streaks \u2022 raga_encounters'}
        </div>
      </div>
      <h3 className={styles.h3}>Engine Modules</h3>
      <table className={styles.table}>
        <thead><tr><th>Module</th><th>Purpose</th><th>Status</th></tr></thead>
        <tbody>
          {[
            ['physics/', 'Harmonic series, resonance, 22 shrutis in just intonation', 'Complete'],
            ['theory/swaras', '12 swaras with frequency ratios, cents, harmonic positions', 'Complete'],
            ['theory/ragas/', '30 ragas: aroha, avaroha, pakad, ornaments, prahara, rasa', 'Complete'],
            ['theory/talas/', 'Teentaal (16), Ektaal (12), Jhaptaal (10), Rupak (7)', 'Complete'],
            ['analysis/', 'Pitch mapping, raga grammar validation, pakad recognition', 'Complete'],
            ['synthesis/', 'Tanpura drone, harmonium voice, tala pulse', 'Complete'],
            ['interaction/tantri', '12-string interactive instrument with spring physics', 'Complete'],
            ['voice/', 'Real-time pipeline: mic \u2192 denoise \u2192 pitch \u2192 feedback', 'Complete'],
          ].map(([mod, purpose, status]) => (
            <tr key={mod}><td><strong>{mod}</strong></td><td>{purpose}</td><td>{status}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function VoicePipeline() {
  return (
    <section>
      <div className={styles.pageBreak} />
      <SectionTitle>4. The Technical Moat: Voice Pipeline</SectionTitle>
      <p className={styles.text}>Runs <strong>entirely in the browser</strong> at $0 cost, with &lt;50ms latency.</p>
      <div className={styles.flow}>
        {[
          ['Microphone', 'browser getUserMedia API'],
          ['AudioWorklet', 'off main thread, 128-sample chunks'],
          ['RNNoise WASM', 'neural noise suppression ($0)'],
          ['Pitchy McLeod', 'pitch detection: Hz + clarity'],
          ['Pitch Mapping', 'Hz \u2192 cents \u2192 nearest swara (raga-aware)'],
          ['Raga Grammar', 'aroha/avaroha/vakra/varjit validation'],
          ['Phrase Recognition', 'pakad detection via sliding window'],
          ['Accuracy Scoring', 'Gaussian: 0 cents = 1.0, tolerance = 0.5'],
          ['Tantri + Canvas', '60fps strings, pitch trail, feedback'],
        ].map(([label, desc], i) => (
          <div key={label}>
            {i > 0 && <div className={styles.flowArrow}>{'\u2193'}</div>}
            <div className={styles.flowStep}><strong>{label}</strong> &mdash; {desc}</div>
          </div>
        ))}
      </div>
      <h3 className={styles.h3}>Tantri: The Instrument Layer</h3>
      <ul className={styles.list}>
        <li><strong>Voice input</strong>: Strings vibrate near the student&rsquo;s pitch. Color = accuracy.</li>
        <li><strong>Sympathetic vibration</strong>: Pa vibrates when Sa is sung (real physics).</li>
        <li><strong>Spring physics</strong>: Kan snap (1000/30), Andolan (120/8), Tanpura Release (400/15).</li>
        <li><strong>Progressive disclosure</strong>: 1 string {'\u2192'} raga strings {'\u2192'} all 12.</li>
      </ul>
    </section>
  );
}

function UserLifecycle() {
  return (
    <section>
      <div className={styles.pageBreak} />
      <SectionTitle>5. User Lifecycle: Onboarding to Mastery</SectionTitle>
      <h3 className={styles.h3}>Onboarding (2 minutes)</h3>
      <ol className={styles.list}>
        <li><strong>Sa Detection</strong>: Hum 3&ndash;5 times. Engine proposes your tonic. Stored permanently.</li>
        <li><strong>Journey Selection</strong>: Four paths visible immediately. Full vision from day one.</li>
      </ol>
      <h3 className={styles.h3}>Daily Session Loop</h3>
      <ol className={styles.list}>
        <li>Raga chosen by time of day. Tanpura begins. ~10 min. Zero decisions.</li>
        <li>On completion: free practice. Daily goal ring updates on home page.</li>
      </ol>
      <h3 className={styles.h3}>Four Journey Paths</h3>
      <div className={styles.ragaGrid}>
        <div className={`${styles.ragaLevel} ${styles.shishya}`}><h4>Shishya (Beginner)</h4><p>8 lessons &bull; Sa detection, 5 core ragas, guided riyaz</p></div>
        <div className={`${styles.ragaLevel} ${styles.sadhaka}`}><h4>Sadhaka (Explorer)</h4><p>10 lessons &bull; Ornaments, ear/interval training</p></div>
        <div className={`${styles.ragaLevel} ${styles.varistha}`}><h4>Varistha (Scholar)</h4><p>11 lessons &bull; Shruti discrimination, composition</p></div>
        <div className={`${styles.ragaLevel} ${styles.guru}`}><h4>Guru (Master)</h4><p>10 lessons &bull; Bandish, taan, teaching tools</p></div>
      </div>
      <h3 className={styles.h3}>Progression</h3>
      <ul className={styles.list}>
        <li><strong>Levels by musical acts</strong>, not XP. Interface deepens invisibly.</li>
        <li><strong>Pakad recognition</strong>: cinematic moment when the engine hears you sing the raga&rsquo;s characteristic phrase.</li>
      </ul>
    </section>
  );
}

function CurriculumCatalog() {
  return (
    <section>
      <div className={styles.pageBreak} />
      <SectionTitle>6. Curriculum &amp; Raga Catalog</SectionTitle>
      <h3 className={styles.h3}>30-Raga Catalog</h3>
      <table className={styles.table}>
        <thead><tr><th>Level</th><th>Ragas</th><th>#</th></tr></thead>
        <tbody>
          <tr><td><strong>Shishya</strong></td><td>Bhoopali, Yaman, Bhairav, Bhimpalasi, Bageshri</td><td>5</td></tr>
          <tr><td><strong>Sadhaka</strong></td><td>Desh, Kafi, Pahadi, Durga, Hamsadhwani, Bilawal, Asavari, Khamaj, Jog, Tilak Kamod</td><td>10</td></tr>
          <tr><td><strong>Varistha</strong></td><td>Marwa, Darbari Kanada, Puriya Dhanashri, Malkauns, Todi, Kedar, Hameer, Puriya, Lalit, Multani, Madhuvanti</td><td>11</td></tr>
          <tr><td><strong>Guru</strong></td><td>Bhairavi, Sohini, Shree, Jaunpuri</td><td>4</td></tr>
        </tbody>
      </table>
      <h3 className={styles.h3}>Exercises</h3>
      <table className={styles.table}>
        <thead><tr><th>Exercise</th><th>Description</th><th>Level</th></tr></thead>
        <tbody>
          <tr><td>Swara Identification</td><td>Hear a swara, choose from 4</td><td>Explorer+</td></tr>
          <tr><td>Binaural Intervals</td><td>Sa left, target right; identify</td><td>Explorer+</td></tr>
          <tr><td>Phrase Playback</td><td>Hear, sing back, accuracy score</td><td>Beginner+</td></tr>
          <tr><td>Pakad Recognition</td><td>Engine detects characteristic phrases</td><td>All</td></tr>
          <tr><td>Shruti Discrimination</td><td>Identify microtonal variants</td><td>Varistha+</td></tr>
        </tbody>
      </table>
      <h3 className={styles.h3}>References</h3>
      <ul className={styles.list}>
        <li><strong>Bhatkhande, V.N.</strong> <em>Hindustani Sangeet Paddhati</em> &mdash; 10-thaat system</li>
        <li><strong>Jairazbhoy, N.A.</strong> <em>The Ragas of North Indian Music</em></li>
        <li><strong>Deva, B.C.</strong> <em>The Music of India: A Scientific Study</em></li>
        <li><strong>Raja, D.</strong> <em>Hindustani Music: A Tradition in Transition</em></li>
        <li><strong>Bharata Muni</strong> <em>Natya Shastra</em> &mdash; 22 shruti system</li>
      </ul>
    </section>
  );
}

function DesignAndStack() {
  return (
    <section>
      <div className={styles.pageBreak} />
      <SectionTitle>7. Design &amp; Technical Stack</SectionTitle>
      <table className={styles.table}>
        <thead><tr><th>Design</th><th>Choice</th></tr></thead>
        <tbody>
          <tr><td>Typography</td><td>Cormorant Garamond / Noto Serif Devanagari / Inter / IBM Plex Mono</td></tr>
          <tr><td>Accent</td><td>Saffron #E8871E &mdash; earned only</td></tr>
          <tr><td>Modes</td><td>Night: Deep Malachite #0A1A14 | Day: Ivory #F5F0E8</td></tr>
          <tr><td>Motion</td><td>Spring physics: Tanpura Release, Meend, Kan presets</td></tr>
          <tr><td>Logo</td><td>Tantri Resonance Mark: 5 strings at just-intonation intervals</td></tr>
        </tbody>
      </table>
      <table className={styles.table}>
        <thead><tr><th>Layer</th><th>Technology</th><th>Cost</th></tr></thead>
        <tbody>
          <tr><td>Frontend</td><td>Next.js 15, React 19, TypeScript strict</td><td>$0</td></tr>
          <tr><td>Animation</td><td>Framer Motion v12, GSAP 3, Three.js r170</td><td>$0</td></tr>
          <tr><td>Synthesis</td><td>Tone.js 15, Web Audio API</td><td>$0</td></tr>
          <tr><td>Voice</td><td>RNNoise WASM + Pitchy McLeod</td><td>$0</td></tr>
          <tr><td>Data</td><td>Supabase free tier</td><td>$0</td></tr>
          <tr><td>Hosting</td><td>Vercel (52 static pages)</td><td>$0</td></tr>
          <tr><td colSpan={2}><strong>Total monthly cost</strong></td><td><strong>$0</strong></td></tr>
        </tbody>
      </table>
    </section>
  );
}

function DataModelAndRoadmap() {
  return (
    <section>
      <div className={styles.pageBreak} />
      <SectionTitle>8. Data Model &amp; Roadmap</SectionTitle>
      <pre className={styles.pre}>{`profiles              -- user identity, Sa ref (Hz), level, XP
  +-- sessions        -- practice: raga, duration, accuracy, XP
  +-- streaks         -- current/longest streak, last riyaz date
  +-- raga_encounters -- per-raga: sessions, minutes, best accuracy`}</pre>
      <h3 className={styles.h3}>Roadmap</h3>
      <table className={styles.table}>
        <thead><tr><th>Version</th><th>Scope</th></tr></thead>
        <tbody>
          <tr><td><strong>v1.0</strong> (Built)</td><td>Full engine, 30 ragas, 4 journeys, voice pipeline, Tantri, training, PWA</td></tr>
          <tr><td><strong>v1.1</strong></td><td>Mastery gates, tala sessions, bandish, Hindi/Marathi</td></tr>
          <tr><td><strong>v2.0</strong></td><td>Social, gharana variations, AI phrase suggestions, offline PWA</td></tr>
          <tr><td><strong>v3.0</strong></td><td>Mobile native, live lessons, community bandish library</td></tr>
        </tbody>
      </table>
      <h3 className={styles.h3}>Why Now</h3>
      <ol className={styles.list}>
        <li><strong>Web Audio maturity</strong>: real-time pitch detection is now reliable</li>
        <li><strong>WASM performance</strong>: neural denoising without cloud compute</li>
        <li><strong>32M+ diaspora</strong> seeking cultural connection through music</li>
        <li><strong>$0 infrastructure</strong>: browser compute + free tiers</li>
        <li><strong>No competition</strong> in this intersection</li>
      </ol>
    </section>
  );
}

function PageFooter() {
  return (
    <div className={styles.footer}>
      <em>Sadhana: not learning about music. Becoming it.</em>
      <br /><br />
      Contact: aacrit@gmail.com
    </div>
  );
}
