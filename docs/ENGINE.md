# Engine Reference

Last updated: 2026-04-19

The engine lives at `/engine/`. Pure TypeScript. Zero UI. Zero dependencies except Tone.js (synthesis only). Single barrel export from `engine/index.ts`.

```
import { mapPitchToSwara, VoicePipeline, TanpuraDrone } from '@/engine'
```

---

## Layers

```
physics/ -> theory/ -> analysis/ -> synthesis/ -> voice/
```

Each layer depends only on the layers to its left.

---

## physics/

Harmonic series mathematics, just intonation, acoustic resonance.

### harmonics.ts

Core harmonic series functions and tanpura partial model.

| Export | Kind | Description |
|--------|------|-------------|
| `Partial` | interface | `{ number, frequency, amplitude }` |
| `TanpuraStringProfile` | interface | `{ name, ratio, partials[] }` |
| `harmonicRatio(n)` | fn | Ratio of nth harmonic (n:1) |
| `octaveReducedRatio(n)` | fn | Reduce ratio to [1, 2) |
| `partialFrequency(fundamental, n)` | fn | Hz of nth partial |
| `harmonicSeries(fundamental, count)` | fn | Array of first N partials |
| `overtoneAmplitude(n, {tanpura?})` | fn | Amplitude model: 1/n standard, jivari model for tanpura |
| `tanpuraPartials(saHz?, useMa?)` | fn | 4 string profiles with 10 partials each |
| `ratioToCents(ratio)` | fn | 1200 * log2(ratio) |
| `centsToRatio(cents)` | fn | Inverse of ratioToCents |
| `beatFrequency(f1, f2)` | fn | \|f1 - f2\| Hz |

Jivari amplitude coefficients: partials 1-10 modeled from spectral analysis. Beyond partial 10, exponential decay at 0.7 factor.

### just-intonation.ts

The 22 shrutis and 12 principal swaras with exact frequency ratios.

| Export | Kind | Description |
|--------|------|-------------|
| `Ratio` | interface | `{ p, q }` integer fraction |
| `Shruti` | interface | `{ number, name, ratio, cents, equalTempCents, deviation, swara }` |
| `SwaraName` | type | 12 names: `'Sa' \| 'Re_komal' \| ... \| 'Ni'` |
| `PrincipalSwara` | interface | Full metadata per swara including sanskrit, devanagari, sargam, shruti numbers |
| `SHRUTIS` | const | All 22 shrutis (Chandovati through Manda) |
| `PRINCIPAL_SWARAS` | const | 12 swaras with just-intonation ratios |
| `UPPER_SA` | const | `{ ratio: {2,1}, cents: 1200 }` |
| `shrutiToHz(shruti, saHz?)` | fn | Shruti to frequency |
| `swaraToHz(swara, saHz?)` | fn | Swara to frequency |
| `centsDeviation(hz, saHz, targetCents)` | fn | Deviation from target position |
| `nearestShruti(centsFromSa)` | fn | Nearest of 22 shrutis |
| `nearestSwara(centsFromSa)` | fn | Nearest principal swara + deviation |
| `getSwaraByName(name)` | fn | Lookup by SwaraName |
| `getShrutiByNumber(num)` | fn | Lookup by 1-22 |
| `shrutisForSwara(name)` | fn | All shrutis mapped to a swara |
| `frequencyTable(saHz?)` | fn | Map of SwaraName to Hz |

### resonance.ts

Acoustic consonance, roughness, and interval analysis.

| Export | Kind | Description |
|--------|------|-------------|
| `ResonanceProfile` | interface | `{ consonance, roughness, harmonicRelationship, nearestSwara, centsFromSa }` |
| `consonanceScore(ratio)` | fn | Euler/Helmholtz: `1 / (1 + log2(p*q))` |
| `criticalBandRoughness(f1, f2)` | fn | Plomp-Levelt model over 6 partials |
| `intervalResonance(centsFromSa, saHz?)` | fn | Complete resonance profile |
| `qualitativeConsonance(hz, saHz)` | fn | Returns `'consonant' \| 'mildly_tense' \| 'tense' \| 'between'` |
| `nearestTanpuraBeating(sungHz, saHz, maxPartial?)` | fn | Min beat frequency against Sa+Pa partials |

---

## theory/

Musicological constructs: swaras, ragas, thaats, talas, ornaments.

### types.ts

All core type definitions.

| Type | Description |
|------|-------------|
| `Swara` | 12 values: `'Sa' \| 'Re_k' \| 'Re' \| ... \| 'Ni'` |
| `Octave` | `'mandra' \| 'madhya' \| 'taar'` |
| `SwaraNote` | `{ swara: Swara, octave: Octave }` |
| `SwaraDefinition` | Full metadata: symbol, names, ratio, cents, western bridge |
| `Ornament` | `'meend' \| 'gamak' \| 'andolan' \| 'murki' \| 'khatka' \| 'zamzama' \| 'kan' \| 'sparsh'` |
| `OrnamentDefinition` | Sonic parameters: trajectory, duration, oscillation rate/amplitude |
| `RagaJati` | `'audava' \| 'shadava' \| 'sampoorna'` (5/6/7 notes) |
| `Rasa` | 9 rasas: shant, karuna, shringar, veer, adbhut, bhayanak, raudra, bibhatsa, hasya |
| `Prahara` | `1-8` (3-hour divisions of the day) |
| `Raga` | Complete raga: id, aroha, avaroha, vadi, samvadi, pakad, prahara, rasa, ornaments, ornamentMap, vakra, tanpuraTuning?, description |
| `Thaat` | Bhatkhande thaat: id, name, 7 swaras, description |
| `Tala` | Rhythmic cycle: beats, vibhag, sam, khali, theka |
| `n(swara, octave?)` | Helper to create SwaraNote |

### swaras.ts

12 SwaraDefinition constants: `SA, RE_K, RE, GA_K, GA, MA, MA_T, PA, DHA_K, DHA, NI_K, NI`.

| Export | Kind | Description |
|--------|------|-------------|
| `SWARAS` | const | Ordered array of all 12 |
| `SWARA_MAP` | const | Record<Swara, SwaraDefinition> for O(1) lookup |
| `getSwaraBySymbol(symbol)` | fn | Find definition |
| `getSwaraRatio(symbol)` | fn | Decimal ratio |
| `getSwaraFrequency(symbol, saHz?, octave?)` | fn | Hz with octave multiplier |

### thaats.ts

10 Bhatkhande thaats: `KALYAN, BILAWAL, KHAMAJ, BHAIRAV, POORVI, MARWA, KAFI, ASAVARI, BHAIRAVI, TODI`.

| Export | Kind | Description |
|--------|------|-------------|
| `THAATS` | const | Record<string, Thaat> |
| `THAAT_LIST` | const | Ordered array |
| `findThaat(swaras)` | fn | Match 7 swaras to a thaat |
| `getRagasByThaat(thaatId)` | fn | Returns raga IDs for a thaat |

### ragas/ (30 raga files)

The engine defines 30 ragas. The 5 v1 pedagogy ragas are ordered first:

v1 pedagogy ragas (fully used in journeys):

| Raga | Thaat | Jati | Vadi/Samvadi | Prahara | Key swaras |
|------|-------|------|-------------|---------|------------|
| Bhoopali | Kalyan | audava/audava | Ga / Dha | 5, 6 | Sa Re Ga Pa Dha (pentatonic, all shuddha) |
| Yaman | Kalyan | sampoorna/sampoorna | Ga / Ni | 5, 6 | All shuddha + Ma_t |
| Bhimpalasi | Kafi | shadava/sampoorna | Ma / Sa | 3, 4 | Ga_k, Ni_k (komal) |
| Bhairav | Bhairav | sampoorna/sampoorna | Dha_k / Re_k | 1, 8 | Re_k, Dha_k (andolan) |
| Bageshri | Kafi | shadava/sampoorna | Ma / Sa | 6, 7 | Ga_k, Ni_k |

Additional engine ragas (defined, not yet wired to journeys): Asavari, Bhairavi, Bilawal, Darbari Kanada, Desh, Durga, Hameer, Hamsadhwani, Jaunpuri, Jog, Kafi, Kedar, Khamaj, Lalit, Madhuvanti, Malkauns, Marwa, Multani, Pahadi, Puriya, Puriya Dhanashri, Shree, Sohini, Tilak Kamod, Todi.

Each raga file exports a complete `Raga` object with pakad phrases, ornaments, description, western bridge, gharana variations.

### ragas.ts (registry)

| Export | Kind | Description |
|--------|------|-------------|
| `RAGAS` | const | Record<string, Raga> |
| `RAGA_LIST` | const | Ordered by pedagogical sequence |
| `getRagasByPrahara(prahara)` | fn | Filter by time of day |
| `getRagasByRasa(rasa)` | fn | Filter by emotion |
| `getRagasUsingSwara(swara)` | fn | Filter by swara presence |
| `getRagasByThaat(thaat)` | fn | Filter by parent scale |
| `getRagaForTimeOfDay(hour)` | fn | Map 24h clock to best raga |
| `getRagaById(id)` | fn | Direct lookup |
| `getArohaCount(raga)` | fn | Distinct swaras in aroha |
| `getRagaSwaras(raga)` | fn | Union of aroha + avaroha swaras |

### ornaments.ts

8 ornaments: `MEEND, GAMAK, ANDOLAN, MURKI, KHATKA, ZAMZAMA, KAN, SPARSH`.

Each defines: trajectory shape, duration range (ms), oscillation rate/amplitude (for sinusoidal), note count (for sequence), characteristic ragas and swaras.

| Export | Kind | Description |
|--------|------|-------------|
| `ORNAMENTS` | const | Record<string, OrnamentDefinition> |
| `ORNAMENT_LIST` | const | Ordered array |
| `getOrnament(type)` | fn | Lookup by type string |
| `getOrnamentsForRaga(ragaId)` | fn | Filter by raga |
| `getOrnamentsForSwara(swara)` | fn | Filter by swara |
| `generateMeendTrajectory(startHz, endHz, durationMs, steps?)` | fn | [timeMs, hz][] logarithmic glide |
| `generateOscillationTrajectory(centreHz, amplitudeCents, rateHz, durationMs, steps?)` | fn | [timeMs, hz][] sinusoidal |

### talas/teentaal.ts

Teentaal: 16 beats, 4 vibhags of 4 each. Sam at beat 1, khali at beat 9.

| Export | Kind | Description |
|--------|------|-------------|
| `teentaal` | const | Complete Tala object with theka |
| `getBolAtBeat(beat)` | fn | Tabla bol at position 1-16 |
| `getVibhagForBeat(beat)` | fn | Which vibhag (0-3) |
| `isSam(beat)` | fn | Is this beat 1? |
| `isKhali(beat)` | fn | Is this beat 9? |
| `getClapTypeForBeat(beat)` | fn | sam / tali / khali |
| `generateTheka(cycles)` | fn | Multi-cycle bol array |

---

## analysis/

Pitch mapping, raga grammar validation, pakad recognition.

### pitch-mapping.ts

Bridge from Hz to musical domain.

| Export | Kind | Description |
|--------|------|-------------|
| `Level` | type | `'shishya' \| 'sadhaka' \| 'varistha' \| 'guru'` |
| `LEVEL_TOLERANCE` | const | shishya: 50c, sadhaka: 25c, varistha: 15c, guru: 10c |
| `PitchResult` | interface | hz, centsFromSa, nearestSwara, nearestShruti, deviationCents, clarity, inRagaContext, expectedOrnament, accuracy |
| `mapPitchToSwara(hz, saHz, clarity?, ragaId?, level?)` | fn | Primary pipeline function. <0.5ms per call. |
| `isValidInRaga(swara, raga)` | fn | Swara in aroha/avaroha and not varjit |
| `getAccuracyScore(deviationCents, level)` | fn | Gaussian curve: 1.0 at 0 cents, 0.5 at tolerance boundary |
| `isPitchCorrect(deviationCents, level)` | fn | Binary threshold check |
| `nearestValidSwaraInRaga(centsFromSa, raga)` | fn | Nearest allowed swara |
| `swaraToSwaraName(swara)` / `swaraNameToSwara(name)` | fn | Bridge between engine Swara and JI SwaraName |

### raga-grammar.ts

Validate sung phrases against raga rules.

| Export | Kind | Description |
|--------|------|-------------|
| `GrammarViolation` | interface | `{ type, swara, message, index }` |
| `GrammarResult` | interface | `{ valid, violations[], score }` |
| `validatePhrase(swaras, raga)` | fn | Checks: forbidden swaras, aroha/avaroha movement, vakra patterns, vadi emphasis (8+ notes) |
| `checkForbiddenSwaras(swaras, raga)` | fn | Varjit swara detection |

Scoring: forbidden_swara -0.25, aroha/avaroha_violated -0.10, vadi_ignored -0.15. Scaled by phrase length.

Vakra (oblique/zigzag) movement: when a raga defines `vakra` sequences, those specific out-of-order swara progressions are explicitly permitted. The validator pre-computes vakra swara sequences and skips the aroha/avaroha directional check for any transition that falls inside a defined vakra pattern.

### phrase-recognition.ts

Pakad detection -- the "wow" feature.

| Export | Kind | Description |
|--------|------|-------------|
| `PakadMatch` | interface | `{ matched, ragaId, ragaName, pakadPhrase, confidence, sargamNotation }` |
| `PrimedPhrase` | interface | `{ phrase, ragaId, primedAt, windowMs }` — active prime state |
| `recognizePakad(recentSwaras, ragas?, minConfidence?)` | fn | Search all ragas, default threshold 0.7 |
| `recognizePakadInRaga(recentSwaras, ragaId, minConfidence?)` | fn | Single-raga search, threshold 0.6 |
| `pakadToSargam(phrase)` | fn | SwaraNote[] to sargam string with octave marks |
| `primeExpectedPhrase(phrase, ragaId, windowMs?)` | fn | Prime a specific phrase for detection; if sung within `windowMs` (default 45 000ms), fires immediately at lower threshold. Used by YAML `prime_pakad` blocks in beginner-01 through beginner-06. |
| `clearPrimedPhrase()` | fn | Cancel an active prime |
| `getPrimedPhrase()` | fn | Read active prime state (null if none) |
| `checkPrimedPhrase(recentSwaras)` | fn | Called by VoicePipeline each frame; returns PakadMatch or null |

Algorithm: collapse consecutive repeats, sliding window subsequence match. Confidence based on extra-swara penalty. Minimum 3 swaras required.

### practice-scoring.ts

Star rating and XP model for guided practice sessions.

| Export | Kind | Description |
|--------|------|-------------|
| `StarRating` | type | `0 \| 1 \| 2 \| 3` |
| `StageResult` | interface | `{ stage, score, stars }` |
| `PracticeResult` | interface | `{ stages, overallScore, overallStars, xpEarned }` |
| `PRACTICE_STAGES` | const | `['swaras', 'aroha', 'avaroha', 'pakad']` -- the 4 guided practice stages |
| `scoreToStars(score)` | fn | Map 0-1 score to 0-3 stars using fixed thresholds |
| `starsToXp(stars)` | fn | XP earned per stage star rating |
| `computePracticeResult(stageScores, previousStars?)` | fn | Aggregate stage results, compute overall stars and XP delta |

Star thresholds: 0 stars < 0.40, 1 star >= 0.40, 2 stars >= 0.65, 3 stars >= 0.85. XP is awarded as the delta above the student's previous best for that raga (no repeat grinding).

---

## synthesis/

Sound generation using Web Audio API.

### tanpura.ts

Additive synthesis drone from first principles.

| Export | Kind | Description |
|--------|------|-------------|
| `TanpuraConfig` | interface | `{ sa_hz, volume, stringCount?: 2\|3\|4, groundString?: 'Pa'\|'Ma'\|'Ni', useMa?, saDetuningCents?, cycleDuration?, jivariDetuneCents? }` |
| `DEFAULT_TANPURA_CONFIG` | const | 261.63 Hz, volume 0.3, stringCount 2, cycleDuration 2.0s, groundString 'Pa', 0.4 cents jivari detune |
| `TanpuraDrone` | class | `start()`, `stop()`, `setSa(hz)`, `setVolume(v, rampMs?)`, `getPartialFrequencies()`, `getProfiles()` |

Architecture: up to 4 strings x 10 partials (default 2 strings = 20 oscillators). Third string detuned 2 cents for shimmer when stringCount >= 3. String volume balance: Pa/Ma/Ni 0.7, low Sa 0.6, middle Sa 1.0. 500ms fade-out on stop. Web Audio API directly (no Tone.js).

Level-scaled stringCount: shishya=2 (Sa + ground), sadhaka=3, varistha=4. Progressive disclosure matches Tantri string visibility.

Per-partial jivari detune: each partial receives a deterministic ±0.4 cent offset computed from a seeded xorshift32 PRNG (seed derived from string index + partial index). The same detuning pattern plays back every pluck cycle, matching the physical consistency of a real jivari bridge.

Pluck cycle model: strings are plucked sequentially (ground-string → Sa → [Sa → low Sa] for stringCount >= 3/4 → repeat) with a jivari amplitude envelope per pluck. Attack: 35ms exponential ramp (was 15ms linear) for more natural string-contact character. The `cycleDuration` parameter controls the full cycle in seconds (default 2.0s; at stringCount=2 this gives 1.0s/pluck). String sustain overlaps the full cycle duration so successive plucks crossfade rather than gap, producing a continuous drone. Higher partials sustain longer than lower partials, matching the physical behaviour of the jivari bridge. `jivariSustainFactor` is tightened so tails no longer overlap across cycles.

`groundString` parameter: ragas that omit Pa traditionally use an alternate ground string. `tanpuraTuning` on the `Raga` interface drives this automatically: Marwa → 'Ma', Malkauns → 'Ma', Bageshri → 'Ni', all others default to 'Pa'. The legacy `useMa` boolean is still accepted for backward compatibility but deprecated in favour of `groundString`.

### swara-voice.ts

Individual swara and phrase playback.

| Export | Kind | Description |
|--------|------|-------------|
| `PlaySwaraOptions` | interface | duration, attack, release, volume, ornament |
| `PlayPhraseOptions` | interface | tempo, gap, volume |
| `playSwara(swara, saHz, options?)` | fn | Single swara with envelope |
| `playSwaraNote(note, saHz, options?)` | fn | SwaraNote with octave |
| `playPhrase(swaras, saHz, options?)` | fn | Sequential playback |
| `playPakad(raga, saHz, pakadIndex?, options?)` | fn | Raga pakad at tempo 50 |
| `playAroha(raga, saHz, options?)` | fn | Ascending scale |
| `playAvaroha(raga, saHz, options?)` | fn | Descending scale |
| `ensureAudioReady()` | fn | Resume AudioContext (iOS gesture) |

Ornament application via oscillator frequency modulation: sinusoidal for gamak/andolan, exponentialRamp for meend, setValueAtTime impulse for kan/sparsh.

---

## voice/

Real-time voice capture and analysis pipeline.

### pipeline.ts

| Export | Kind | Description |
|--------|------|-------------|
| `VoiceEvent` | interface | `{ type: 'pitch'\|'silence'\|'noise', hz?, clarity?, swara?, deviationCents?, inRaga?, accuracy?, pitchResult?, timestamp }` |
| `VoicePipelineConfig` | interface | sa_hz, ragaId?, level?, onPitch, onSilence, onPakadDetected?, clarityThreshold?, fftSize?, swaraBufferSize? |
| `VoicePipeline` | class | `start()`, `stop()`, `updateSa(hz)`, `updateRaga(ragaId)`, `updateLevel(level)`, `getSwaraBuffer()`, `setClarityThreshold(t)`, `getClarityThreshold()` |

Chain: `getUserMedia -> AnalyserNode -> Pitchy (McLeod) -> mapPitchToSwara -> pakad check -> events`. Target <50ms mic-to-visual. Detection via `requestAnimationFrame`. Rolling swara buffer (default 20) for pakad detection with 5s cooldown. RMS < 0.01 = silence. Clarity threshold default **0.80**. FFT size default 2048. Pitch ceiling: `min(sa_hz * 8, 4200)` Hz (covers full vocal range for low Sa references).

### accuracy.ts

| Export | Kind | Description |
|--------|------|-------------|
| `SessionStats` | interface | duration, pitch/silence/noise counts, distinct swaras, dominant swara, clarity, singing% |
| `AccuracyScore` | interface | overall, pitchAccuracy, ragaCompliance, pakadsFound, sessionStats |
| `scoreSession(events, raga, level, pakadsFound?)` | fn | Weighted: pitch 55%, raga compliance 35%, singing% 10%, pakad bonus up to 15% |
| `scorePhrase(events, targetPhrase, saHz, level?)` | fn | Sequence match (LCS) 60% + pitch accuracy 40% |

### feedback.ts

| Export | Kind | Description |
|--------|------|-------------|
| `FeedbackMessage` | interface | `{ type, message, technical, hint?, color }` |
| `generateFeedback(result, raga?, level?, consecutiveErrors?)` | fn | Returns specific feedback: correct, sharp, flat, wrong_swara, ornament_hint, raga_violation |
| `generateSilenceFeedback()` | fn | "Listening..." message |

Feedback is terse and specific. Hints appear after 2+ consecutive errors. Color maps to RAG: correct / in-progress / needs-work. Raga-aware: knows when Re_k needs andolan in Bhairav.

### ornament-evaluator.ts

Scores a sung ornament attempt against the expected ornament shape for meend, andolan, gamak, kan, murki, khatka, and zamzama.

| Export | Kind | Description |
|--------|------|-------------|
| `OrnamentId` | type | `'meend' \| 'andolan' \| 'gamak' \| 'kan' \| 'murki' \| 'khatka' \| 'zamzama'` |
| `OrnamentPitchSample` | interface | `{ timeMs, hz, clarity }` — single voice frame |
| `OrnamentAttempt` | interface | `{ ornamentId, samples[], toSwara, fromSwara?, ragaId? }` |
| `OrnamentScore` | interface | `{ overall, shapeFit, timing, arrivalAccuracyCents }` |
| `evaluateOrnament(attempt)` | fn | Returns fully populated OrnamentScore. Never throws. |

Scoring weights: `overall = 0.5 * shapeFit + 0.2 * timing + 0.3 * arrivalScore`.

- **shapeFit**: DTW-free approach — resamples both student and expected curves to a fixed grid, computes RMS of the cents difference weighted by an exponential decay envelope (σ = 40 cents). Shape-specific expected curves: logarithmic glide for meend, sinusoidal for andolan/gamak, impulse for kan/sparsh.
- **timing**: ±30% of the ornament's nominal duration range scores 1.0; decays linearly beyond that.
- **arrival**: Gaussian (σ = 25 cents) scoring of the average cents deviation across the final 120ms window. Used to check the student lands on the target swara.

Wired into `OrnamentExercisePhase` in `LessonRenderer.tsx`. `ornament_exercise`, `andolan`, and `meend` added to `VOICE_PHASE_TYPES` (fixes a latent mic-closed bug where those phase types were silently skipped).
