# Music Team Standards

Last updated: 2026-04-13

Raga database standards, shruti science, and cultural guidelines for all musicological content in the engine.

---

## Raga Database Standards

### Raga Object Structure

Every raga file (`engine/theory/ragas/*.ts`) exports a single `Raga` object. All fields are `readonly`. Required fields:

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Lowercase, no spaces: `'yaman'`, `'bhairav'` |
| `name` | string | Romanised Sanskrit: `'Yaman'`, `'Bhairav'` |
| `nameDevanagari` | string | Devanagari script |
| `thaat` | string | One of the 10 Bhatkhande thaat IDs |
| `aroha` | SwaraNote[] | Ascending scale with octave register per swara |
| `avaroha` | SwaraNote[] | Descending scale (may differ from aroha) |
| `jati` | { aroha, avaroha } | audava (5) / shadava (6) / sampoorna (7) each |
| `vadi` | Swara | Most important swara |
| `samvadi` | Swara | Second most important (typically a 4th or 5th from vadi) |
| `anuvadi` | Swara[] | Supporting swaras |
| `varjit` | Swara[] | Forbidden swaras |
| `pakad` | SwaraNote[][] | Characteristic phrases (minimum 3 swaras each) |
| `prahara` | Prahara[] | Traditional performance times (1-8) |
| `rasa` | Rasa[] | Emotional essences |
| `ornaments` | Ornament[] | Characteristic ornament types |
| `description` | string | Evocative, precise, written for first encounter |
| `westernBridge` | string | "Western listeners may notice..." -- never "This is like..." |
| `relatedRagas` | string[] | IDs of similar/easily-confused ragas |
| `gharanaVariations?` | string | Optional: treatment differences across schools |

### Naming Conventions

| Engine symbol | Full name | Sargam |
|---------------|-----------|--------|
| `Sa` | Shadja | S |
| `Re_k` | Komal Rishabh | r |
| `Re` | Shuddha Rishabh | R |
| `Ga_k` | Komal Gandhar | g |
| `Ga` | Shuddha Gandhar | G |
| `Ma` | Shuddha Madhyam | m |
| `Ma_t` | Tivra Madhyam | M |
| `Pa` | Pancham | P |
| `Dha_k` | Komal Dhaivat | d |
| `Dha` | Shuddha Dhaivat | D |
| `Ni_k` | Komal Nishad | n |
| `Ni` | Shuddha Nishad | N |

Sargam display: lowercase = komal or tivra, uppercase = shuddha. Octave marks: `.S` (mandra), `S` (madhya), `S'` (taar).

### v1 Raga Set (Journey-Active)

Five ragas wired to journeys, in pedagogical order:

1. **Bhoopali** (Kalyan thaat) -- pentatonic, all shuddha. Entry point.
2. **Yaman** (Kalyan thaat) -- sampoorna, one alteration (Ma_t). Evening devotion.
3. **Bhimpalasi** (Kafi thaat) -- komal swaras (Ga_k, Ni_k), vakra movement. Afternoon longing.
4. **Bhairav** (Bhairav thaat) -- andolan on Re_k and Dha_k. Dawn gravity.
5. **Bageshri** (Kafi thaat) -- midnight depth, emotional complexity.

The engine defines 11 additional ragas not yet wired to journeys: Bhairavi, Darbari Kanada, Desh, Hameer, Kafi, Kedar, Malkauns, Marwa, Puriya Dhanashri, Sohini, Todi. All pass `npm run test:engine`.

### Adding a New Raga

1. Create `engine/theory/ragas/{ragaId}.ts`
2. Export a `Raga` constant matching the interface exactly
3. Add import and re-export in `engine/theory/ragas.ts`
4. Add to `RAGAS` record and `RAGA_LIST` array (in pedagogical position)
5. Add raga ID to the parent thaat's `commonRagas` in `thaats.ts`
6. Run `npm run test:engine` to validate raga grammar

---

## Shruti Science

### The 22 Shrutis

The engine encodes all 22 shrutis from the Natya Shastra in `engine/physics/just-intonation.ts`. Every shruti is a 5-limit just intonation ratio (products of powers of 2, 3, and 5).

Sa (shruti 1) and Pa (shruti 14) are achala -- immovable. They have exactly one shruti position each. All other swaras have 2 shruti variants, allowing ragas to colour the "same" swara differently.

### Just Intonation vs Equal Temperament

The engine operates entirely in just intonation. Equal temperament values exist only for reference (`equalTempCents`, `deviation` fields) and are never used for pitch evaluation.

Key deviations from 12-TET:

| Swara | JI cents | ET cents | Deviation |
|-------|---------|---------|-----------|
| Ga (5/4) | 386.31 | 400 | -13.69 cents |
| Dha (5/3) | 884.36 | 900 | -15.64 cents |
| Ga_k (6/5) | 315.64 | 300 | +15.64 cents |
| Dha_k (8/5) | 813.69 | 800 | +13.69 cents |

These are the most audibly different from ET. A trained ear hears them immediately.

### Consonance Model

The engine uses the Euler/Helmholtz consonance model: `score = 1 / (1 + log2(p*q))`. Plomp-Levelt critical band roughness (ERB formula from Glasberg & Moore 1990) for physical roughness measurement. Both are in `engine/physics/resonance.ts`.

---

## Cultural Guidelines

### Hindustani-First

- A swara is not a Western note. Western equivalents are bridges, never the frame.
- Raga descriptions use `westernBridge` field: "Western listeners may notice..." not "This is like the Lydian mode."
- Sa is whatever the performer chooses. Sa is not C.
- Sargam notation is primary. Staff notation is never used.

### Audio Before Everything

Every concept is heard before it is named. The engine provides `playSwara`, `playPakad`, `playAroha`, `playAvaroha` for this purpose. No lesson introduces a raga without the student hearing it first.

### Ornament Context

Ornaments are not generic -- they are raga-specific and swara-specific. The engine tracks expected ornaments per raga per swara (currently: andolan on Re_k/Dha_k in Bhairav, meend on Ga in Yaman). The feedback system uses this to give contextual guidance.

### Time-of-Day Association

Ragas are mapped to praharas (3-hour divisions). The daily riyaz feature (`getRagaForTimeOfDay`) selects raga by current hour. This is traditional guidance, not prohibition -- the engine suggests, the student chooses.

### The Ten Thaats

The 10 Bhatkhande thaats in `engine/theory/thaats.ts` are organisational framework only. A raga's identity comes from its movement, ornament, and emphasis -- not its thaat. Two ragas in the same thaat can sound utterly different.

| Thaat | Swaras | Character |
|-------|--------|-----------|
| Bilawal | S R G m P D N | All shuddha. Pure, bright. |
| Kalyan | S R G M P D N | Ma_t only alteration. Aspiring, devotional. |
| Khamaj | S R G m P D n | Ni_k. Romantic, light. |
| Bhairav | S r G m P d N | Re_k + Dha_k. Dawn gravity. |
| Poorvi | S r G M P d N | Re_k + Ma_t + Dha_k. Intense tension. |
| Marwa | S r G M P D N | Re_k + Ma_t. Searching, sunset. |
| Kafi | S R g m P D n | Ga_k + Ni_k. Emotional, folk-connected. |
| Asavari | S R g m P d n | Ga_k + Dha_k + Ni_k. Heavy, contemplative. |
| Bhairavi | S r g m P d n | 4 komal swaras. Devotional, conclusive. |
| Todi | S r g M P d N | 3 komal + Ma_t. Dense, intellectual. |

---

## Ornament Reference

8 ornaments defined in `engine/theory/ornaments.ts`:

| Ornament | Shape | Duration | Key parameter |
|----------|-------|----------|---------------|
| Meend | logarithmic glide | 300-3000ms | Start/end swaras |
| Gamak | sinusoidal | 200-1500ms | 4-8 Hz, 50-150 cents |
| Andolan | sinusoidal | 500-4000ms | 2-4 Hz, 15-40 cents |
| Murki | sequence | 50-200ms | 3-4 notes |
| Khatka | sequence | 50-150ms | 2-4 notes |
| Zamzama | sequence | 150-500ms | 5-12 notes |
| Kan | impulse | 10-50ms | Grace note, <50ms |
| Sparsh | impulse | 20-80ms | Touch, slightly longer than kan |

Andolan is the gentlest oscillation. Gamak is vigorous. Meend is the defining ornament of Hindustani vocal music. Kan is used in all ragas. Murki/khatka/zamzama are sequence ornaments (multiple notes, not frequency modulation of a single oscillator).
