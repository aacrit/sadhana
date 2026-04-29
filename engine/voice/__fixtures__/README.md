# Voice corpus — pipeline regression fixtures (audit #9)

The pipeline (`engine/voice/pipeline.ts`) is the moat. Every change to it
needs a regression check against real voices, not just synthetic test
sweeps. Without a corpus, the first user complaint — "it says I'm flat
when I'm on pitch" — has no reproducible test, and every "improve the
pipeline" PR is a guess.

## Recording protocol

Record on a quiet device with no DSP. Sample rate 44.1 kHz, mono, 16-bit
WAV preferred (PCM). 5–8 seconds per fixture. Sing the named swara at the
named Sa, hold it as cleanly as you can, no vibrato.

## Naming

```
<voice-id>_<sa-hz>_<swara>_<ornament>.wav

  voice-id  — short label: 'aacrit', 'guest1', 'female1'
  sa-hz     — integer Hz of the singer's Sa: 130 / 165 / 220 / 261
  swara     — engine symbol: Sa, Re, Re_k, Ga, Ga_k, Ma, Ma_t, Pa,
              Dha, Dha_k, Ni, Ni_k
  ornament  — 'plain' | 'andolan' | 'meend' | 'gamak'

Examples:
  aacrit_165_Sa_plain.wav
  aacrit_165_Re_k_plain.wav
  aacrit_165_Ga_andolan.wav
```

## Target corpus

Minimum useful: 4 Sa frequencies × 1 voice × 4 swaras × 1 plain mode
= 16 fixtures. Better: 3 voices × 4 swaras × 2 ornaments = 24.

## Adding to the regression suite

Each fixture in this directory should have an entry in
`engine/voice/pipeline.regression.test.ts` with the expected swara label
and acceptable cents window. The test fails when the pipeline regresses
on a known-good fixture.

## Why not synthetic?

Synthetic sweeps (sine waves, swept tones) do not exercise:
  - real-mic noise floor
  - vibrato / breath onset
  - voice formants (whose harmonics confuse simple autocorrelation)
  - hoarseness, breathiness, child voices
  - browser DSP artifacts (some browsers re-apply AGC despite our flags)

Real recordings catch all of these. A synthetic-only suite passes when
the pipeline is broken in the only way that matters in production.

## Storage cost

WAV at 44.1 kHz mono 16-bit ≈ 88 KB / second. 24 fixtures × 6 s
≈ 12 MB. Within the GitHub Pages 1 GB repo budget by orders of
magnitude.

## $0 constraint

Recordings are made on existing hardware (laptop / phone built-in mic).
No paid services, no recording studio. Future contributors can record
their own and add via PR.
