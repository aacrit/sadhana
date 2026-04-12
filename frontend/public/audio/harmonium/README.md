# Harmonium Samples (Tier 3)

CC0 harmonium samples for high-quality swara playback.

## Source

**Freesound -- cabled_mess harmonium pack**
- Pack URL: https://freesound.org/people/cabled_mess/packs/29512/
- Licence: CC0 1.0 Universal (Public Domain Dedication)
- No attribution required. Free for any use.

## How to add samples

1. Download the pack from the URL above (requires free Freesound account).
2. Select 7 samples covering C3 to C5, spaced by minor 3rds.
3. Convert to OGG Vorbis at quality 5 (~96kbps) if not already in OGG format.
4. Rename to match the expected file names below.
5. Place them in this directory.

## Expected files

| File | Note | MIDI | Hz (12-TET) |
|------|------|------|-------------|
| harmonium-C3.ogg | C3 | 48 | 130.81 |
| harmonium-E3.ogg | E3 | 52 | 164.81 |
| harmonium-G3.ogg | G3 | 55 | 196.00 |
| harmonium-C4.ogg | C4 | 60 | 261.63 |
| harmonium-E4.ogg | E4 | 64 | 329.63 |
| harmonium-G4.ogg | G4 | 67 | 392.00 |
| harmonium-C5.ogg | C5 | 72 | 523.25 |

Total expected size: ~210KB (7 x ~30KB each).

## How it works

The engine uses playbackRate correction on AudioBufferSourceNode to pitch
each sample to the exact just-intonation frequency. Samples between the
7 anchor points are interpolated by choosing the nearest sample and adjusting
its playbackRate. This keeps the timbre natural up to about a minor 3rd of
pitch shift in either direction.

## Notes

- These files are NOT checked into git (too large for source control).
- If the files are missing, the engine falls back to Tier 2 (WebAudioFont)
  or Tier 1 (additive synthesis). No error is thrown.
- The engine checks for at least 3 loaded samples before activating Tier 3.
