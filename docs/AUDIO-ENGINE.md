# Audio Engine

Last updated: 2026-04-19

Voice capture, pitch detection, tanpura synthesis, and swara playback. Everything runs in the browser. $0 operational cost.

---

## Voice Pipeline

Source: `engine/voice/pipeline.ts`

**CURRENT pipeline** (shipping):
```
Mic (getUserMedia) -> AnalyserNode (FFT 2048) -> Pitchy McLeod (main thread) -> mapPitchToSwara
  -> raga grammar check -> pakad recognition -> VoiceEvent callbacks
```

**TARGET pipeline** (future — owned by `acoustics-engineer`):
```
Mic -> AudioWorklet (off-thread) -> RNNoise WASM (denoise) -> Pitchy McLeod -> mapPitchToSwara -> ...
```

### Architecture Decisions

1. **CURRENT: AnalyserNode + main-thread Pitchy** (not AudioWorklet). Pitchy runs in <5ms per frame -- fast enough without Worker overhead. AudioWorklet adds SharedArrayBuffer requirements and message passing latency with no measurable benefit at this scale. `audio-engineer` owns this layer.

2. **TARGET: AudioWorklet + RNNoise WASM.** `acoustics-engineer` owns the upgrade path. When RNNoise is integrated, it inserts between mic source and AnalyserNode with no changes to the rest of the chain. Trigger: profiling shows main-thread pressure on low-end devices, or user reports confirm noisy-environment demand.

3. **RNNoise WASM absent from CURRENT pipeline.** All browser-level audio processing (`echoCancellation`, `noiseSuppression`, `autoGainControl`) is **disabled** in getUserMedia constraints because they corrupt pitch detection. Echo cancellation modifies frequency content; noise suppression cuts soft vowel onset; AGC distorts amplitude which corrupts clarity scores.

3. **Callback-based events** (not buffered). Only the latest pitch matters for real-time feedback. VoicePipeline emits `VoiceEvent` objects via `onPitch`, `onSilence`, and `onPakadDetected` callbacks.

### Latency Budget

| Stage | Time |
|-------|------|
| getUserMedia | ~0ms (streaming) |
| AnalyserNode FFT | ~10ms (2048 samples at 48kHz) |
| Pitchy McLeod | <5ms |
| mapPitchToSwara | <0.5ms |
| React render | ~10-20ms |
| **Total** | **~25-35ms** (target: <50ms) |

### Detection Loop

Runs on `requestAnimationFrame`. Each frame:

1. Read time-domain data from AnalyserNode into Float32Array
2. Compute RMS -- if < 0.01, emit silence
3. Call `pitchDetector.findPitch(buffer, sampleRate)` -- returns [hz, clarity]
4. If clarity >= threshold (default 0.80) and 50 < hz < `sa_hz * 8` (max ~4200 Hz): valid pitch
5. Map pitch via `mapPitchToSwara(hz, saHz, clarity, ragaId, level)`
6. Add detected swara to rolling buffer (default size 20)
7. Check buffer for pakad match (5s cooldown between detections)
8. Emit VoiceEvent

**Threshold notes:** `clarityThreshold` defaults to 0.80 (not 0.85 -- corrected). There is no separate NOISE_RMS threshold; Pitchy runs whenever RMS > SILENCE_RMS (0.01) and clarity alone distinguishes valid pitch from noise. The pitch ceiling is `min(sa_hz * 8, 4200)` to accommodate the full vocal range for students with low Sa references (e.g., Sa = G2 at 98 Hz, ceiling = 784 Hz without the multiplier extension).

### VoicePipeline Class

```typescript
const pipeline = new VoicePipeline({
  sa_hz: 261.63,
  ragaId: 'yaman',
  level: 'shishya',
  onPitch: (event) => { /* update UI */ },
  onSilence: () => { /* clear visualization */ },
  onPakadDetected: (match) => { /* trigger cinematic moment */ },
});

await pipeline.start();  // Must be from user gesture on iOS
pipeline.stop();
```

Runtime methods: `updateSa(hz)`, `updateRaga(ragaId)`, `updateLevel(level)`, `getSwaraBuffer()`, `getPitchHistory()`.

### getUserMedia Constraints

All browser-level audio processing is disabled. This is critical for pitch detection accuracy:

```typescript
audio: {
  echoCancellation: false,   // Modifies frequency content
  noiseSuppression: false,   // Cuts soft vowel onset
  autoGainControl: false,    // Distorts amplitude/clarity scores
  sampleRate: { ideal: 44100 },
  channelCount: 1,
}
```

### VoiceEvent Pitch History

Each VoiceEvent includes a `pitchHistory: readonly [number, number][]` (last ~30 readings) passed as a readonly reference to the internal ring buffer -- not a spread copy. This eliminates ~60 array allocations per second in the render hot path. Consumers must not mutate the array. Feeds the waveform visualization canvas in VoiceVisualization.

---

## Pitch Mapping

Source: `engine/analysis/pitch-mapping.ts`

`mapPitchToSwara(hz, saHz, clarity?, ragaId?, level?)` -> `PitchResult`

Steps:
1. Cents from Sa: `1200 * log2(hz / saHz)`
2. Normalize to [0, 1200)
3. Nearest principal swara (12 swaras)
4. Nearest shruti (22 shrutis)
5. Raga validation (is this swara in aroha/avaroha? not in varjit?)
6. Expected ornament check (e.g., andolan on Re_k in Bhairav)
7. Accuracy score (Gaussian curve, sigma calibrated so score=0.5 at tolerance)

### Level Tolerance

| Level | Tolerance | Score 0.5 at |
|-------|-----------|--------------|
| Shishya | +/-50 cents | 50 cents deviation |
| Sadhaka | +/-25 cents | 25 cents deviation |
| Varistha | +/-15 cents | 15 cents deviation |
| Guru | +/-10 cents | 10 cents deviation |

---

## Tanpura Synthesis

Source: `engine/synthesis/tanpura.ts`

### Architecture

Additive synthesis using Web Audio API directly (not Tone.js). Each of 4 strings rendered as 10 sine oscillators with jivari amplitude model.

```
4 strings x 10 partials = 40 OscillatorNode -> individual GainNode -> master GainNode -> destination
```

### Default Configuration

| Parameter | Value |
|-----------|-------|
| Sa frequency | 261.63 Hz (C4) |
| Master volume | 0.3 |
| Strings | 4 (always) |
| Sa detuning | 2 cents between 2nd and 3rd strings |
| Partials per string | 10 |

### String Tuning

| String | Ratio | Role |
|--------|-------|------|
| 1 (low) | Pa: 3/4 (or Ma: 2/3 if useMa) | Bass drone |
| 2 | Sa: 1 | Middle reference |
| 3 | Sa: 1 (detuned +2 cents) | Shimmer/beating |
| 4 | Sa: 1/2 | Low Sa foundation |

Volume balance: Pa/Ma string 0.7, low Sa 0.6, middle Sa strings 1.0.

### Jivari Amplitude Model

Coefficients for partials 1-10: `[1.0, 0.95, 0.85, 0.72, 0.58, 0.45, 0.33, 0.24, 0.17, 0.12]`. Beyond partial 10: `0.12 * 0.7^(n-10)`.

The jivari bridge excites higher partials far more than a normal plucked string, peaking at partials 2-4. This creates the characteristic "buzzing" shimmer.

### Pluck Cycle

Strings are plucked sequentially — ground-string → Sa → Sa → low Sa — repeating on a configurable cycle. The ground string is Pa by default; ragas that omit Pa use Ma (Marwa, Malkauns) or Ni (Bageshri) via the `groundString` config field (reads `Raga.tanpuraTuning` automatically). Each pluck applies a jivari amplitude envelope: 35ms exponential ramp attack (previously 15ms linear — more natural string-contact character), then exponential decay with higher partials sustaining longer than lower ones. The `cycleDuration` parameter (default 7s) controls the full 4-string cycle; each string is plucked every `cycleDuration / 4` seconds (1.75s at 7s cycle). String sustain is extended to overlap across the full cycle so successive plucks crossfade rather than gap -- producing a continuous drone rather than discrete clicks. The scheduler uses `AudioContext.currentTime` for sample-accurate timing with 2-beat lookahead.

**Per-partial jivari detune:** Each of the 40 oscillators (4 strings × 10 partials) receives a deterministic ±0.4 cent offset. The offset is computed once per construction from a seeded xorshift32 PRNG (seed = string index × 31 + partial index). Deterministic seeding ensures the same shimmer pattern on every play, matching the physical consistency of a real jivari bridge finish.

### Lifecycle

- `start()`: creates AudioContext, builds oscillator graph, begins pluck cycle. Requires user gesture on iOS.
- `stop()`: 500ms linear fade-out, then cleanup.
- `setSa(hz)`: rebuilds oscillators with new frequencies (300ms crossfade to old).
- `setVolume(v)`: 50ms linear ramp to new level.

---

## Swara Playback — Multi-Instrument Additive Synthesis

Source: `engine/synthesis/swara-voice.ts`

12-partial additive synthesis with configurable spectral profiles, body resonance filters, and optional LFO. Three instrument timbres: harmonium (default), piano, and guitar. All share the same `createInstrumentNote()` core with per-instrument `InstrumentConfig`. Separate AudioContext from tanpura drone for independent control.

### Architecture

```
12 OscillatorNode (partials at f, 2f, 3f, ... 12f)
  -> individual GainNode (amplitude weight per partial)
    -> BiquadFilter (low formant 400Hz, peaking +4dB, Q=1.5)
      -> BiquadFilter (high formant 1500Hz, peaking +3dB, Q=2.0)
        -> master GainNode (ADSR envelope)
          -> destination

1 OscillatorNode (LFO, 4.5Hz sine)
  -> 12 GainNode (depth = 1.5Hz * partial_index)
    -> each partial OscillatorNode.frequency (pitch instability)
```

### Harmonium Spectral Model

12-partial amplitude weights derived from acoustic harmonium reed analysis:

| Partial | Amplitude |
|---------|-----------|
| 1 (fundamental) | 1.00 |
| 2 | 0.90 |
| 3 | 0.80 |
| 4 | 0.65 |
| 5 | 0.55 |
| 6 | 0.40 |
| 7 | 0.30 |
| 8 | 0.20 |
| 9 | 0.14 |
| 10 | 0.09 |
| 11 | 0.06 |
| 12 | 0.04 |

Each partial's amplitude is further scaled by 0.15 to prevent clipping with 12 simultaneous oscillators.

### Enclosure Resonance

Two biquad peaking filters in series simulate the wooden harmonium box:

| Filter | Frequency | Q | Gain |
|--------|-----------|---|------|
| Low formant | 400 Hz | 1.5 | +4 dB |
| High formant | 1500 Hz | 2.0 | +3 dB |

### ADSR Envelope

| Phase | Duration | Level |
|-------|----------|-------|
| Attack | 0.08s | 0 -> peak (bellows-to-reed delay) |
| Decay | 0.15s | peak -> 0.85 * peak (initial brightness fade) |
| Sustain | (note duration - attack - decay - release) | 0.85 * peak |
| Release | 0.20s | sustain -> 0 (air pressure release) |

### Bellows LFO (Pitch Instability)

| Parameter | Value |
|-----------|-------|
| LFO frequency | 4.5 Hz (typical hand-pump rate) |
| LFO depth | 1.5 Hz deviation (~10 cents at 261 Hz) |
| LFO scaling | depth * partial_index (higher partials wobble more) |

### Functions

| Function | Default | Notes |
|----------|---------|-------|
| `playSwara(swara, saHz, opts?)` | 0.5s, vol 0.5 | Madhya octave |
| `playSwaraNote(note, saHz, opts?)` | 0.5s, vol 0.5 | Respects octave |
| `playPhrase(swaras, saHz, opts?)` | 60 BPM, 50ms gap | Sequential |
| `playPakad(raga, saHz, idx?, opts?)` | 50 BPM, 80ms gap | Slower for clarity |
| `playAroha/playAvaroha(raga, saHz, opts?)` | 60 BPM | Full ascending/descending |

### Ornament Application

Applied via `OscillatorNode.frequency` scheduling across all 12 partials. Each partial's frequency modulation is scaled proportionally to its harmonic number:

| Shape | Ornament | Method |
|-------|----------|--------|
| sinusoidal | gamak, andolan | `generateOscillationTrajectory` -> `setValueAtTime` per partial per step |
| logarithmic | meend | `exponentialRampToValueAtTime` (0.7 * duration) on all partials |
| impulse | kan, sparsh | `setValueAtTime` to adjacent frequency for 30ms on all partials |
| sequence | murki, khatka, zamzama | Multiple `playSwaraNote` calls (not oscillator modulation) |

### ADSR Short-Note Handling

When note duration < attack + decay + release (common with piano/guitar whose decay constants exceed typical 0.5s swara durations), the ADSR logic truncates the decay phase. It computes where the linear decay ramp would be at release-start time and begins the release from that interpolated level. This prevents conflicting Web Audio `linearRampToValueAtTime` targets that would cause audible artifacts.

### Piano Spectral Model

Felt-hammer piano optimized for Sa range (C3-C5, 130-520 Hz):

| Partial | Amplitude | Note |
|---------|-----------|------|
| 1 | 1.00 | Strong fundamental |
| 2 | 0.75 | Hammer excites low modes |
| 3 | 0.55 | |
| 4 | 0.40 | |
| 5 | 0.30 | |
| 6 | 0.20 | |
| 7 | 0.05 | **Hammer position null** (~1/7 string length) |
| 8 | 0.12 | Recovery after null |
| 9 | 0.08 | |
| 10 | 0.04 | Felt absorption |
| 11 | 0.02 | |
| 12 | 0.01 | |

Note: Real piano strings have inharmonic partials (higher partials are slightly sharp due to string stiffness). The current integer-harmonic synthesis cannot model this. Partial weights are tuned to sound musical despite perfectly harmonic oscillators.

**Piano ADSR:**

| Phase | Duration | Level |
|-------|----------|-------|
| Attack | 0.003s | Hammer impact |
| Decay | 1.2s | Long brightness fade |
| Sustain | 0.55 * peak | Middle-register sustain |
| Release | 0.5s | Damper fall |

**Piano Body Resonance:**

| Filter | Frequency | Q | Gain | Model |
|--------|-----------|---|------|-------|
| Low | 220 Hz | 1.0 | +3 dB | Soundboard bass bar |
| High | 2800 Hz | 1.2 | +2 dB | Bridge presence peak |

No LFO (piano has stable pitch).

### Guitar Spectral Model (Nylon-String Classical)

| Partial | Amplitude | Note |
|---------|-----------|------|
| 1 | 1.00 | Dominant fundamental (nylon mass) |
| 2 | 0.72 | Octave — body and fullness |
| 3 | 0.45 | Fifth — depth |
| 4 | 0.30 | Nail contact shimmer |
| 5 | 0.22 | |
| 6 | 0.06 | **Pluck position null** (~1/6 string length) |
| 7 | 0.12 | Recovery after null |
| 8 | 0.07 | |
| 9 | 0.03 | Nylon absorption |
| 10 | 0.015 | |
| 11 | 0.008 | |
| 12 | 0.004 | |

Compared to steel-string guitar, nylon has ~6 dB less energy above the 5th partial.

**Guitar ADSR:**

| Phase | Duration | Level |
|-------|----------|-------|
| Attack | 0.008s | Nylon pluck (softer than steel) |
| Decay | 2.0s | Long natural decay |
| Sustain | 0.15 * peak | No sustain mechanism |
| Release | 1.0s | Natural tail through bridge |

**Guitar Body Resonance:**

| Filter | Frequency | Q | Gain | Model |
|--------|-----------|---|------|-------|
| Low | 110 Hz | 1.8 | +5 dB | Helmholtz air resonance |
| High | 350 Hz | 1.4 | +3 dB | Spruce top plate |

No LFO (classical guitar has stable pitch).

---

## Tala Engine — Synthesised Tabla

Source: `engine/synthesis/tala-engine.ts`

Additive tabla synthesis for tala playback. All sounds are synthesised from first principles, not samples. Two drum models (dayan and bayan) are combined according to bol dispatch tables.

### Dayan Synthesis (Treble Drum, Pitched)

The dayan has near-harmonic partials due to the syahi (iron-paste) loading:

| Partial ratio | Amplitude |
|---------------|-----------|
| 1.0 | 1.0 |
| 2.0 | 0.6 |
| 3.01 | 0.3 |
| 4.1 | 0.15 |

Pitch envelope: starts at 2x fundamental, drops to fundamental over 25ms.
5ms attack noise burst: bandpass filtered at fundamental * 3, Q=2.

### Bayan Synthesis (Bass Drum, Inharmonic)

The bayan has inharmonic membrane modes:

| Partial ratio | Amplitude |
|---------------|-----------|
| 1.0 | 1.0 |
| 1.47 | 0.5 |
| 2.09 | 0.25 |
| 2.56 | 0.12 |

Open strokes ("Ge" character): fundamental slides down 50% over 200ms.
Damped strokes ("Ka" style): no pitch slide, very short decay (max 80ms).

### Bol Dispatch Table

| Bol | Dayan | Bayan | Dayan Decay | Bayan Decay | Notes |
|-----|-------|-------|-------------|-------------|-------|
| Dha | yes | yes (open) | 0.35s | 0.40s | Full resonant stroke |
| Dhin | yes | yes (open) | 0.25s | 0.25s | Tighter combined |
| Na/Ta | yes | no | 0.15s | -- | Short treble |
| Tin | yes | no | 0.30s | -- | Ringing treble |
| Ge/Ghe | no | yes (open) | -- | 0.35s | Bass with pitch slide |
| Ka/Ke | no | yes (damped) | -- | 0.08s | Sharp slap |
| Ti | yes | no | 0.10s | -- | High freq (fund * 2.5) |

Additional bols for Ektaal/Jhaptaal thekas: Dhi, Tu, Kat, DhaGe, TrKt.

### TalaPlayer API

```typescript
const player = new TalaPlayer(audioContext, saHz);

// Play a single bol
player.playBol('Dha');
player.playBol('Tin', audioContext.currentTime + 0.5, 0.8);

// Start a continuous theka
player.startTheka('teentaal', 80, (beat, isSam, isKhali) => {
  // Update UI on each beat
});

// Control
player.setTempo(100);
player.setSa(293.66);
player.stopTheka();
player.dispose();
```

### Timing Model

Uses `AudioContext.currentTime` scheduling (NOT `setInterval`). Schedules 4 beats ahead into the Web Audio timeline. Re-schedules when within 2 beats of the buffer end. The scheduling loop runs on `requestAnimationFrame`.

Beat callbacks are fired via `setTimeout` timed to the scheduled audio event, providing approximate UI sync. The audio itself is always sample-accurate.

### Supported Talas

| Tala | Beats | Vibhag | Theka Source |
|------|-------|--------|-------------|
| Teentaal | 16 | 4+4+4+4 | `engine/theory/talas/teentaal.ts` |
| Ektaal | 12 | 2+2+2+2+2+2 | `engine/theory/talas/ektaal.ts` |
| Jhaptaal | 10 | 2+3+2+3 | `engine/theory/talas/jhaptaal.ts` |
| Rupak | 7 | 3+2+2 | `engine/theory/talas/rupak.ts` |

### Browser Audio Processing — Disabled

All browser-level audio processing is disabled in `getUserMedia` constraints. This is critical for pitch detection accuracy and applies to the voice pipeline, not to synthesis output:

```typescript
audio: {
  echoCancellation: false,   // Modifies frequency content
  noiseSuppression: false,   // Cuts soft vowel onset
  autoGainControl: false,    // Distorts amplitude/clarity scores
}
```

Echo cancellation modifies the frequency spectrum, which corrupts pitch detection. Noise suppression cuts soft vowel onsets. AGC distorts amplitude, which corrupts Pitchy clarity scores. These are disabled at the `getUserMedia` constraint level, not via `AudioContext` processing.

---

## Frequency Tables

### 12 Principal Swaras (Just Intonation, Sa = 261.63 Hz)

| Swara | Ratio | Cents | Hz | ET deviation |
|-------|-------|-------|----|-------------|
| Sa | 1/1 | 0.00 | 261.63 | 0.00 |
| Re_k | 16/15 | 111.73 | 279.07 | +11.73 |
| Re | 9/8 | 203.91 | 294.33 | +3.91 |
| Ga_k | 6/5 | 315.64 | 313.96 | +15.64 |
| Ga | 5/4 | 386.31 | 327.04 | -13.69 |
| Ma | 4/3 | 498.04 | 348.84 | -1.96 |
| Ma_t | 45/32 | 590.22 | 367.92 | -9.78 |
| Pa | 3/2 | 701.96 | 392.44 | +1.96 |
| Dha_k | 8/5 | 813.69 | 418.61 | +13.69 |
| Dha | 5/3 | 884.36 | 436.05 | -15.64 |
| Ni_k | 16/9 | 996.09 | 465.12 | -3.91 |
| Ni | 15/8 | 1088.27 | 490.55 | -11.73 |

Note: Ni_k in `swaras.ts` uses ratio 16/9 (996.09 cents), matching `just-intonation.ts`. Both files agree. The 9/5 variant (1017.60 cents) exists in the shruti system for raga contexts that require it (e.g., some Bhairavi traditions), but the principal swara definition uses 16/9.

---

## Session Scoring

Source: `engine/voice/accuracy.ts`

### Session Score Weights

| Component | Weight |
|-----------|--------|
| Pitch accuracy | 55% |
| Raga compliance | 35% |
| Singing percentage | 10% |
| Pakad bonus | Up to +15% (5% per pakad, max 3) |

### Phrase Score Weights

| Component | Weight |
|-----------|--------|
| Sequence match (LCS) | 60% |
| Pitch accuracy | 40% |

---

## Feedback System

Source: `engine/voice/feedback.ts`

Feedback types: `correct`, `sharp`, `flat`, `wrong_swara`, `ornament_hint`, `raga_violation`, `silence`.

Principles:
- Specific: "+23 cents" not "a bit off"
- Musical: uses swara names and raga context
- Terse: no praise inflation
- Progressive: hints after 2+ consecutive errors, not immediately
- Contextual: knows ornament expectations per raga per swara

Color mapping: `correct` -> green, `in-progress` -> amber, `needs-work` -> red.

---

## useFreeformSession Hook

Source: `frontend/app/lib/useFreeformSession.ts`

React hook that manages the entire freeform riyaz audio session. Wires together TanpuraDrone, VoicePipeline, harmony strength calculation, swara event detection, and session persistence. All audio objects are ref-stored to avoid unnecessary re-renders.

### Signature

```typescript
useFreeformSession(saHz?: number): FreeformState & FreeformControls
```

### FreeformState

| Field | Type | Description |
|-------|------|-------------|
| `currentHz` | `number \| null` | Live detected frequency |
| `currentSwara` | `string \| null` | Short name: "Sa", "Re", "Ga", etc. |
| `currentSwaraFull` | `string \| null` | Full name: "Komal Re", "Shuddha Ga", etc. |
| `currentDevanagari` | `string \| null` | Devanagari glyph for the current swara |
| `centsDev` | `number \| null` | Cents deviation from nearest shruti |
| `inTune` | `boolean` | Within +/-20 cents |
| `harmonyStrength` | `number` | 0-1 consonance with Sa (overtone-derived) |
| `swaraHistory` | `SwaraEvent[]` | Rolling buffer of emitted swara events (max 30) |
| `sessionDurationS` | `number` | Elapsed session time in seconds |
| `totalSwaraCount` | `number` | Total swaras detected this session |
| `isListening` | `boolean` | Voice pipeline active |
| `tanpuraActive` | `boolean` | Tanpura drone playing |
| `micPermission` | `'unknown' \| 'granted' \| 'denied'` | Microphone permission state |
| `saHz` | `number` | Student's Sa frequency |

### FreeformControls

| Method | Description |
|--------|-------------|
| `startListening()` | Starts voice pipeline + tanpura. Requires user gesture on iOS. |
| `stopListening()` | Stops pipeline, emits final pending swara, saves session to Supabase. |
| `toggleTanpura()` | Mute/unmute the tanpura drone independently. |
| `dispose()` | Full cleanup -- stops pipeline, timer, tanpura. Called on unmount. |

### SwaraEvent Type

```typescript
interface SwaraEvent {
  swara: string;           // Short name: "Sa" | "Re" | ...
  swaraFull: string;       // Full: "Komal Re" | "Shuddha Ga" | ...
  devanagari: string;      // Devanagari glyph
  hz: number;              // Detected frequency
  timestamp: number;       // performance.now() ms
  durationMs: number;      // How long the swara was held
  inTune: boolean;         // Within +/-20 cents
  harmonyStrength: number; // 0-1 consonance with Sa
}
```

### Swara Event Detection

A swara must be stable for >= 60ms (`SWARA_DEBOUNCE_MS`) before emitting a SwaraEvent. If the student holds the same swara for > 2000ms (`SAME_SWARA_REPEAT_MS`), a repeat event is emitted. On silence, any pending swara that met the debounce threshold is emitted.

### Harmony Strength

Consonance values are derived from the overtone series:

| Swara | Strength | Ratio |
|-------|----------|-------|
| Sa | 1.00 | 1:1 (unison) |
| Pa | 0.85 | 3:2 (perfect fifth) |
| Ma | 0.70 | 4:3 (perfect fourth) |
| Ga | 0.65 | 5:4 (major third) |
| Re, Dha | 0.50 | 9:8, 5:3 |
| Re_k, Ga_k, Ma_t, Dha_k, Ni_k, Ni | 0.30 | Dissonant intervals |

If the student is > 25 cents off, harmony strength is reduced by 0.4 (floor 0).

### Session Persistence

Sessions >= 30s are saved to Supabase `sessions` table via dynamic import (fire-and-forget). Fields: `user_id`, `raga_id: 'freeform'`, `sa_hz`, `duration_s`, `xp_earned` (2 per minute), `journey: 'freeform'`, timestamps. Guest sessions are not persisted.

---

## Tiered Instrument System

Source: `engine/synthesis/harmonium-sampler.ts`, `engine/synthesis/harmonium-samples.ts`, `engine/synthesis/tabla-samples.ts`

### Tier Cascade

The harmonium player implements a three-tier fallback system. On first load, Tier 1 plays immediately with zero latency. In the background, the player attempts to load Tier 2, then Tier 3. When a higher tier loads, playback seamlessly upgrades. If any tier fails, the system falls back silently.

```
Tier 3 (CC0 samples)  ->  Tier 2 (WebAudioFont)  ->  Tier 1 (additive synthesis)
       best quality         good quality, fast load        instant, always available
```

| Tier | Source | Quality | Load Time | Size |
|------|--------|---------|-----------|------|
| 1 | 12-partial additive synthesis | Good (synthesised harmonium) | 0ms (code) | 0KB |
| 2 | WebAudioFont reed organ (GM program 20) | Better (real sample-based) | ~500ms (CDN) | ~50KB |
| 3 | CC0 harmonium samples (Freesound) | Best (multi-sampled, interpolated) | ~1-2s (self-hosted) | ~210KB |

### HarmoniumPlayer API

```typescript
const player = new HarmoniumPlayer(audioContext, saHz);

// Tier 1 plays immediately
player.playNote(440, 0.5, 0.5);  // hz, duration, volume

// Start background upgrade (call once after user gesture)
await player.loadHigherTiers();

// Now uses highest loaded tier
player.playNote(440, 0.5, 0.5);

// Check current tier
player.currentTier;  // 1 | 2 | 3

// Play a phrase
await player.playPhrase([
  { hz: 261.63, duration: 0.5 },
  { hz: 294.33, duration: 0.5 },
], 0.05);

player.dispose();
```

### Tier 2: WebAudioFont Integration

The `webaudiofont` npm package provides sample-based instrument playback. We use the Reed Organ preset (GM program 20), loaded from the CDN at `https://surikov.github.io/webaudiofontdata/sound/0200_GeneralUserGS_sf2_file.js`.

**Just-intonation detune correction**: WebAudioFont samples are tuned to 12-tone equal temperament. Every note must be detuned to match the just-intonation ratios used throughout the engine:

```typescript
function hzToMidiWithDetune(hz: number): { midi: number; detune: number } {
  const exactMidi = 69 + 12 * Math.log2(hz / 440);
  const midi = Math.round(exactMidi);
  const detune = (exactMidi - midi) * 100; // cents offset
  return { midi, detune };
}
// detune applied via fractional pitch: adjustedPitch = midi + detune / 100
```

**Loading**: Dynamic import of the `webaudiofont` module, preset loaded via script tag injection. The preset JS file defines a global variable (`_tone_0200_...`) which is extracted after the script loads.

### Tier 3: CC0 Harmonium Samples

Source: Freesound -- cabled_mess harmonium pack (CC0, public domain)
Pack URL: `https://freesound.org/people/cabled_mess/packs/29512/`

7 samples spaced by minor 3rds covering C3 to C5. The engine uses `AudioBufferSourceNode.playbackRate` to pitch each sample to the exact just-intonation frequency:

```typescript
source.playbackRate.value = targetHz / sampleHz;
```

| Sample | MIDI | Hz (12-TET) |
|--------|------|-------------|
| harmonium-C3.ogg | 48 | 130.81 |
| harmonium-E3.ogg | 52 | 164.81 |
| harmonium-G3.ogg | 55 | 196.00 |
| harmonium-C4.ogg | 60 | 261.63 |
| harmonium-E4.ogg | 64 | 329.63 |
| harmonium-G4.ogg | 67 | 392.00 |
| harmonium-C5.ogg | 72 | 523.25 |

Sample files are NOT checked into git. See `frontend/public/audio/harmonium/README.md` for download and preparation instructions. The engine requires at least 3 loaded samples before activating Tier 3.

### Tabla Sample Upgrade

Source: `engine/synthesis/tabla-samples.ts`

Same tiered pattern for tabla. Tier 1 is the existing synthesised tabla (always available). When CC0 tabla bol samples are placed in `frontend/public/audio/tabla/`, TalaPlayer can use them as a per-bol upgrade. Missing bols fall back to synthesis individually.

| Sample | Bol | Drum |
|--------|-----|------|
| dha.ogg | Dha | dayan + bayan |
| dhin.ogg | Dhin | dayan + bayan |
| na.ogg | Na | dayan only |
| ta.ogg | Ta | dayan only |
| tin.ogg | Tin | dayan only |
| ge.ogg | Ge | bayan only |
| ka.ogg | Ka | bayan only |
| ti.ogg | Ti | dayan only |

### lesson-audio.ts Integration

The `useLessonAudio` hook accepts a `timbre: TantriTimbre` parameter (`'harmonium'` | `'voice-male'` | `'voice-female'`, default `'harmonium'`). When `timbre` is `'voice-male'` or `'voice-female'`, playback routes to `engine/synthesis/voice` (`playVocalSwaraNote`) with the matching `voiceType`. When `timbre` is `'harmonium'`, the hook creates a `HarmoniumPlayer` instance on first swara playback request. `loadHigherTiers()` is called immediately after construction (non-blocking). All `playSwara` and `playPhrase` calls delegate to the HarmoniumPlayer, which uses the highest available tier. If HarmoniumPlayer construction fails (e.g. no AudioContext), the hook falls back to direct `swara-voice.ts` calls.

Signature: `useLessonAudio(sa_hz?, ragaId, timbre?): LessonAudioControls`. All journey pages pass `timbre` from `useTimbreSelection()`.

`LessonAudioControls` includes a `setTanpuraVolume(volume: number)` method that ramps the tanpura drone master gain. `useLessonEngine` calls this on every phase transition: full volume (0.3) during singing phases (`tanpura_drone`, `pitch_exercise`, `phrase_exercise`, `passive_phrase_recognition`), reduced to 30% of normal (0.09) during all other phase types (listen, read, speak). The tanpura never stops between phases — it persists as an ambient presence throughout the lesson.

### PWA Offline Caching

The service worker (`frontend/public/sw.js`) implements cache-first strategy for audio assets:

- `sadhana-audio-v1` cache stores all `/audio/` requests (harmonium + tabla samples)
- First fetch loads from network and caches the response
- Subsequent fetches serve from cache (offline-capable)
- External CDN requests (WebAudioFont presets from `surikov.github.io`) are not cached by the SW (loaded via script tag, not fetch)
- Stale caches from previous versions are automatically cleaned on SW activation

---

## TantriVoice — Vocal Synthesis Engine

Source: `engine/synthesis/voice/` (index.ts, source-model.ts, formants.ts, tract-model.ts, voice-presets.ts, ornament-voice.ts, raga-voice.ts, composition.ts, composition-player.ts)

Formant-based vocal synthesis using the Fant source-filter model, implemented entirely in the Web Audio API at $0 cost. Produces singing voice for all 12 Hindustani swaras across 4 voice types with raga-aware ornamentation.

### Signal Chain

```
GlottalSource (PeriodicWave, LF model, output gain 2.0)
  -> VocalTract (5 series peaking BiquadFilters + singer's formant + nasal notch)
    -> ADSR GainNode
      -> DynamicsCompressorNode (soft limiter, prevents formant stack clipping)
        -> destination
```

15 audio nodes per voice instance. Touch-to-sound latency: ~3-6ms.

### Voice Types

| VoiceType | Typical range | Character |
|-----------|--------------|-----------|
| `'baritone'` | Low, dark | Classical male |
| `'tenor'` | Mid male | Bright, carrying |
| `'alto'` | Mid female | Warm, mellow |
| `'soprano'` | High female | Clear, forward |

`inferVoiceType(hz)` maps frequency to the closest voice type.

### Gain Staging (critical — corrected in commit 286e257)

PeriodicWave normalization produces peak 1.0 / RMS ~0.25. Source output gain is set to **2.0** to compensate. Formant gainDb values are scaled for **series peaking filters** (2–12 dB), not the speech-spectroscopy values (15–22 dB) which are only valid for parallel filter banks. The DynamicsCompressor at chain end acts as a soft limiter to prevent clipping when formant peaks align.

### Swara-to-Vowel Mapping

Each swara is assigned a characteristic vowel from Indian vocal tradition (e.g., Sa = 'aa', Re = 'ri', Ma = 'ma'). The `SWARA_VOWEL_MAP` in `formants.ts` drives formant selection per note.

### Primary API

```typescript
import { createVocalSynth } from '@/engine/synthesis/voice';

const synth = await createVocalSynth('tenor');
await synth.playSwara('Ga', 196);
await synth.playPakad(yamanRaga, 196, { ornamentLevel: 'natural' });
synth.dispose();
```

| Export | Kind | Description |
|--------|------|-------------|
| `createVocalSynth(voiceType, ctx?)` | fn | Creates VocalSynth instance. Constructs audio graph. |
| `VocalSynth` | interface | `playSwara`, `playSwaraNote`, `playPhrase`, `playPakad`, `playAroha`, `playAvaroha`, `dispose` |
| `PlayVocalOptions` | interface | duration, volume, attack, release, ornament, vowel, ragaId |
| `PlayVocalPhraseOptions` | interface | tempo, gap, volume, ornamentLevel, legato, ragaId |
| `inferVoiceType(hz)` | fn | Map Sa Hz to closest voice type |
| `createCompositionPlayer(synth, ctx)` | fn | Full composition engine for structured songs |

### Composition Engine

`composition.ts` + `composition-player.ts` provide structured song/alap playback: `Composition`, `CompositionSection`, `CompositionLine`, `BeatNote`. Helpers: `createArohaAvarohaBandish`, `createPakadBandish`, `createSongComposition`.

### Integration with Tiered Instrument System

When `timbre` is `'voice-male'` or `'voice-female'`, `useLessonAudio` routes playback to `createVocalSynth` with the matching voice type via `playVocalSwaraNote`. Harmonium tier cascade is bypassed entirely for vocal timbre.
