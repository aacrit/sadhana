# Audio Engine

Last updated: 2026-04-11

Voice capture, pitch detection, tanpura synthesis, and swara playback. Everything runs in the browser. $0 operational cost.

---

## Voice Pipeline

Source: `engine/voice/pipeline.ts`

```
Mic (getUserMedia) -> AnalyserNode (FFT 2048) -> Pitchy McLeod -> mapPitchToSwara
  -> raga grammar check -> pakad recognition -> VoiceEvent callbacks
```

### Architecture Decisions

1. **AnalyserNode + main-thread Pitchy** (not AudioWorklet). Pitchy runs in <5ms per frame -- fast enough without Worker overhead. AudioWorklet adds SharedArrayBuffer requirements and message passing latency with no measurable benefit at this scale.

2. **RNNoise WASM: future enhancement.** Current pipeline works without denoising. All browser-level audio processing (`echoCancellation`, `noiseSuppression`, `autoGainControl`) is **disabled** in getUserMedia constraints because they corrupt pitch detection. Echo cancellation modifies frequency content; noise suppression cuts soft vowel onset; AGC distorts amplitude which corrupts clarity scores. When RNNoise is integrated, it inserts between mic source and AnalyserNode with no changes to the rest of the chain.

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
4. If clarity >= threshold (default 0.85) and 50 < hz < 2000: valid pitch
5. Map pitch via `mapPitchToSwara(hz, saHz, clarity, ragaId, level)`
6. Add detected swara to rolling buffer (default size 20)
7. Check buffer for pakad match (5s cooldown between detections)
8. Emit VoiceEvent

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

Each VoiceEvent includes a rolling `pitchHistory: [timestamp, hz][]` (last ~30 readings). This feeds the waveform visualization canvas in VoiceVisualization.

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

### Lifecycle

- `start()`: creates AudioContext, builds oscillator graph. Requires user gesture on iOS.
- `stop()`: 500ms linear fade-out, then cleanup.
- `setSa(hz)`: rebuilds oscillators with new frequencies (300ms crossfade to old).
- `setVolume(v)`: 50ms linear ramp to new level.

---

## Swara Playback

Source: `engine/synthesis/swara-voice.ts`

Sine oscillator with attack/release envelope. Separate AudioContext from tanpura drone for independent control.

### Functions

| Function | Default | Notes |
|----------|---------|-------|
| `playSwara(swara, saHz, opts?)` | 0.5s, vol 0.5 | Madhya octave |
| `playSwaraNote(note, saHz, opts?)` | 0.5s, vol 0.5 | Respects octave |
| `playPhrase(swaras, saHz, opts?)` | 60 BPM, 50ms gap | Sequential |
| `playPakad(raga, saHz, idx?, opts?)` | 50 BPM, 80ms gap | Slower for clarity |
| `playAroha/playAvaroha(raga, saHz, opts?)` | 60 BPM | Full ascending/descending |

### Ornament Application

Applied via `OscillatorNode.frequency` scheduling:

| Shape | Ornament | Method |
|-------|----------|--------|
| sinusoidal | gamak, andolan | `generateOscillationTrajectory` -> `setValueAtTime` per step |
| logarithmic | meend | `exponentialRampToValueAtTime` (0.7 * duration) |
| impulse | kan, sparsh | `setValueAtTime` to adjacent frequency for 30ms, then target |
| sequence | murki, khatka, zamzama | Multiple `playSwaraNote` calls (not oscillator modulation) |

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

Note: Ni_k in `swaras.ts` uses ratio 9/5 (1017.60 cents) while `just-intonation.ts` uses 16/9 (996.09 cents). The shruti system accounts for both variants; raga context determines which is used.

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

A swara must be stable for >= 300ms (`SWARA_DEBOUNCE_MS`) before emitting a SwaraEvent. If the student holds the same swara for > 2000ms (`SAME_SWARA_REPEAT_MS`), a repeat event is emitted. On silence, any pending swara that met the debounce threshold is emitted.

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
