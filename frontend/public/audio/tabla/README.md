# Tabla Samples (Tier 3)

CC0 tabla bol samples for high-quality tala playback.

## Source

Find CC0-licensed tabla samples on Freesound or similar platforms.
Recommended search: "tabla bols CC0" on https://freesound.org

Licence requirement: CC0 1.0 Universal (Public Domain Dedication).

## How to add samples

1. Source individual bol recordings (one-shot, dry, close-mic).
2. Trim silence, normalize, and convert to OGG Vorbis at quality 5 (~96kbps).
3. Rename to match the expected file names below.
4. Place them in this directory.

## Expected files

| File | Bol | Drum | Character |
|------|-----|------|-----------|
| dha.ogg | Dha | dayan + bayan | Full resonant stroke |
| dhin.ogg | Dhin | dayan + bayan | Tighter combined |
| na.ogg | Na | dayan only | Short treble |
| ta.ogg | Ta | dayan only | Short treble |
| tin.ogg | Tin | dayan only | Ringing treble |
| ge.ogg | Ge | bayan only | Bass with pitch slide |
| ka.ogg | Ka | bayan only | Sharp damped slap |
| ti.ogg | Ti | dayan only | High frequency short |

## How it works

When these files are present, the TalaPlayer can use them instead of
the synthesised tabla sounds. If any file is missing, the synthesised
version for that bol plays instead. This is a per-bol fallback, not
all-or-nothing.

## Notes

- These files are NOT checked into git (too large for source control).
- If the files are missing, the engine uses synthesised tabla.
- No error is thrown for missing files.
