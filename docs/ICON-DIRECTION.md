# Icon Direction -- Brand Director Approved

Date: 2026-04-12
Author: brand-director
Status: APPROVED for icon-creator execution

---

## Preamble

Icons and texture are standout features of Sadhana. They are not decorative supplements to text labels -- they are primary UI elements that carry the app's visual authority. Each icon must command its space at hero scale (120-200px), remain instantly legible at badge scale (40-64px), and survive as a recognizable silhouette at 16px.

This document provides the geometric concept, motion grammar, and jali texture thresholds that icon-creator must follow. It does not contain SVG code -- that is icon-creator's craft. It provides the musical and visual logic that every icon must encode.

---

## 1. Level Mega Icons

### Design Principle: Harmonic Accumulation

The four level icons form a single visual sentence. Each level's icon contains the geometry of all previous levels and adds one new structural element. The student who reaches Guru should be able to look at the Guru icon and see the Shishya icon nested inside it. This mirrors the musical truth: a Guru has not left behind the Shishya's practice of Sa. They have built upon it.

The unifying structure is the tanpura string -- the single vertical element that runs through all four levels, gaining complexity, overtones, and resonance.

### Shishya -- The Single String

**Geometric concept:** A single vertical line (the tanpura's Sa string) with a small circle at its base (the Sa convergence point from the logo). Nothing else. The Shishya knows only Sa. The icon is stark, minimal, honest -- one string, one note, one beginning.

**Color:** Rendered in `--text` (warm parchment) against `--level-shishya` (`#0A1A14`). No saffron -- nothing has been earned yet. The Sa point at the base is a hollow circle (stroke only), not filled.

**Scale behavior:** At 200px, the single line has quiet authority -- negative space dominates. At 40px, it reads as a vertical bar with a dot. At 16px, it is a line with a point.

### Sadhaka -- The Overtone Pair

**Geometric concept:** The Shishya's single string remains. A second string appears beside it, slightly shorter -- the Pa string (the first overtone, the 3:2 ratio, the most consonant interval after the octave). Between the two strings, a single horizontal connecting line marks the interval. The Sadhaka hears intervals, not just notes. Two strings. Two notes. The first relationship.

**Color:** Rendered in `--level-sadhaka` (`#2D6A4F`). The interval-marking line uses the same color at reduced opacity. The Sa point at the base is now filled (the Sadhaka has found their Sa). The Pa string's endpoint is a smaller filled circle.

### Varistha -- The Resonance Field

**Geometric concept:** The Sadhaka's two strings remain. Two more strings appear (four total, matching the tanpura's four strings). Between and around the strings, a subtle field of 3-4 concentric arc segments emerges -- the overtone series made visible, the resonance that surrounds a well-tuned tanpura. The arcs are not complete circles; they are fragments, like the open arc in the logo. The Varistha hears what is between the notes.

**Color:** Rendered in `--level-varistha` (`#1E3A5F`). The resonance arcs use the same lapis at 30-40% opacity. The four strings have graduated opacity (matching the logo's string hierarchy). The Sa point remains saffron-filled.

### Guru -- The Complete Instrument

**Geometric concept:** The Varistha's four strings and resonance field remain. The open arc from the logo closes -- the top quadrant that was missing (the practice still to come) is now complete. The circle is whole. Around the complete circle, zarr-kashi hairlines radiate outward at the 22 shruti positions -- all 22 microtones are now perceived. The Guru hears the full spectrum. The instrument is complete.

**Color:** Rendered in `--level-guru` (`#D4AF37`). The closed circle and shruti hairlines use `--gold-hairline`. The four strings inside remain in their hierarchical opacity. The Sa point is gold. Zarr-kashi rule: the gold is hairline (1px or thinner at scale), never filled areas. The icon should have the weight of an illuminated manuscript initial.

### Progression Summary

| Level | What is added | Musical truth encoded |
|-------|--------------|----------------------|
| Shishya | Single string + hollow Sa point | Knows only Sa. Beginning. |
| Sadhaka | Second string (Pa) + interval mark + filled Sa | Hears intervals. Has a practice. |
| Varistha | Four strings + resonance arcs | Hears overtones. Perceives what is between. |
| Guru | Closed arc + 22 shruti radiants | Hears everything. The instrument is complete. |

---

## 2. Journey Icons

### Design Principle: The Journey is the Shape

Each journey icon must communicate the nature of the practice it offers, not its content. The Beginner icon does not show a musical note. It shows the quality of guided, step-by-step movement. The Master icon does not show a crown. It shows the quality of generative creation.

All five journey icons share a 64x64 viewBox and use the same stroke weight (1.5px at 64x64). They use `--text` / `--text-2` in their default state. When the journey is active or the student's current journey, the primary element shifts to `--accent` (saffron, earned).

### Beginner (Arambh) -- The Guided Breath

**Concept:** A single ascending curve -- a gentle arc rising from left to right, with evenly spaced tick marks along it (like rungs on a ladder, or beats in a tala). The curve is a meend (glide), the most fundamental ornament: smooth, guided, one swara flowing into the next. The ticks are the structure that guides the student through. The shape communicates: you will be led, step by step, upward.

### Explorer (Anveshana) -- The Branching Path

**Concept:** A single vertical line that branches into 3-4 diverging paths at its midpoint, like a tree or a river delta viewed from above. The paths curve outward at different angles. This is the raga browser made geometric: many possibilities radiating from a single root (Sa). The shape communicates: you will choose your own direction. The number of branches should echo the number of v1 ragas (five paths for five ragas, if it does not become cluttered; otherwise three principal paths).

### Scholar (Vidvan) -- The Shruti Grid

**Concept:** A precise grid or lattice -- a small section of the 22-shruti circle rendered as intersecting horizontal and vertical lines, with specific intersection points emphasized (filled dots at key shruti positions). The geometry is analytical, not organic. The shape communicates: you will see the structure beneath the music. This is the jali pattern distilled to its essence -- the geometric lattice that underlies everything.

### Master (Acharya) -- The Generative Spiral

**Concept:** A spiral that begins tight at center and opens outward, with small marks or nodes along its curve -- a phrase being generated, a composition unfurling. The spiral echoes the harmonic series (each ring wider than the last, as overtones space out). The shape communicates: you will create. The spiral is open-ended, not closed -- the master's work is never finished.

### Freeform (Swatantra) -- The Open Circle

**Concept:** A circle with a wide gap (approximately 90 degrees missing, like the logo's arc but larger). Inside the open circle, a single undulating wave (the voice, free, unstructured). No tick marks, no grid, no guide -- just the open space and the voice within it. The shape communicates: no structure, no goals, just practice. The missing segment is the absence of curriculum -- deliberate, not incomplete.

### Journey Icon Summary

| Journey | Shape | Quality encoded |
|---------|-------|----------------|
| Beginner | Ascending curve with tick marks | Guided, step-by-step, rising |
| Explorer | Branching paths from single root | Choice, divergence, discovery |
| Scholar | Precise lattice with emphasized nodes | Analysis, structure, precision |
| Master | Opening spiral with marks along curve | Generation, creation, unfolding |
| Freeform | Gapped circle with undulating wave | Freedom, openness, pure voice |

---

## 3. Arrival Motion Grammar

### Principle

Every icon arrival is a musical event. The spring preset determines the icon's "personality" at the moment it enters the viewport. An icon that snaps in instantly (Kan) feels like a grace note. An icon that settles slowly (Tanpura Release) feels like a string still vibrating after being plucked.

### Assignments

| Interaction | Spring preset | Rationale |
|-------------|--------------|-----------|
| **Page-load arrival** | **Tanpura Release** (stiffness 400, damping 15) | The icon appears as if plucked into existence -- a brief overshoot, then a natural settling. The fundamental oscillation of the app. All icons on a page arrive with this spring, staggered by 80ms per item. |
| **Hover state** | **Andolan** (stiffness 120, damping 8) | A subtle breath. The icon gains a gentle, barely perceptible oscillation -- a 2-3px vertical shift that does not fully settle while hovered. The same quality as the tanpura string's ambient vibration. Scale: 1.0 to 1.03 (3% growth, no more). |
| **Press/tap state** | **Kan** (stiffness 1000, damping 30) | Instantaneous snap downward (2-3px translateY), no oscillation, immediate return. The grace note: felt, not seen. This is the fastest gesture in the system. |
| **Level unlock ceremony** | **Meend** (stiffness 80, damping 20) + GSAP timeline | The mega icon does not bounce in. It glides. A 1200ms GSAP timeline orchestrates: (1) the previous level's icon scales down and fades to 40% opacity over 400ms, (2) the new level's icon fades in at center with Meend spring physics -- slow, smooth, deliberate, no overshoot, (3) the new structural element (the added string, the resonance arcs, the closed circle) draws itself in via GSAP strokeDashoffset over 800ms. The Meend spring handles position/opacity; GSAP handles the path drawing. Total ceremony: ~1600ms. No confetti. No sound effect. The icon draws itself into existence. |

### Stagger Rules

- Journey cards on home page: 80ms stagger, Tanpura Release spring.
- Level nodes on profile page: 60ms stagger, Tanpura Release spring.
- Raga icons in the explorer browser: 100ms stagger, Tanpura Release spring.
- Nav icons: no stagger (they are persistent, arrive with page).

### Reduced Motion

When `prefers-reduced-motion: reduce` is active, all spring animations collapse to instant opacity transitions (0ms). No positional animation. Icons appear at their final state immediately. The level unlock ceremony reduces to a simple crossfade (300ms ease).

---

## 4. Jali Texture Thresholds

### Principle

The jali lattice pattern is the connective tissue of the interface. At its default 4% opacity, it is felt more than seen -- a geometric rhythm underlying content, like the tanpura drone underlying melody. It intensifies in response to musical events, never in response to UI events. A button hover does not change jali opacity. A correct pitch does.

### Threshold Definitions

| Trigger | Jali opacity | Duration | Easing | Rationale |
|---------|-------------|----------|--------|-----------|
| **Default (ambient)** | 4% (`--jali-opacity: 0.04`) | Persistent | -- | The base state. Always present, barely visible. The geometric structure that exists whether or not you notice it. |
| **Raga world active** | 8% | Ramps up over 2400ms (matches ink diffusion) | `--ease-in-out` | When a raga color world activates, the jali pattern becomes slightly more visible -- the raga's architecture is surfacing. The 8% threshold is subtle enough to not compete with content but perceptible enough to register as "something changed." |
| **Correct pitch sustained (>2 seconds)** | 12% | Ramps up over 600ms | `--ease-out` | The student is holding a correct note. The geometric structure beneath the music becomes more visible -- a reward that is felt, not announced. Returns to raga-active level (8%) when pitch drifts. |
| **Pakad recognition moment** | 100% then settle to 15% | Full reveal over 400ms, hold 800ms, settle over 1200ms to 15%, then fade to 4% over 2400ms | GSAP timeline | The signature moment. The entire jali lattice becomes fully visible -- the architecture of the raga revealed. This is the only moment the jali reaches full opacity. The settle to 15% (the `--jali-opacity-settle` token) gives the student a brief afterglow before returning to ambient. |
| **Level unlock** | 20% | Ramps up over 1200ms, holds 2000ms, returns to 4% over 2400ms | GSAP timeline | The interface structure becomes visible during the level transition -- the student is seeing the app's skeleton as their level deepens. Less dramatic than pakad (which is the musical climax), more sustained. |
| **Session complete (daily riyaz finished)** | 10% | Ramps up over 800ms, holds 1200ms, returns to 4% over 1600ms | `--ease-in-out` | A gentle acknowledgment. The practice session is over. The structure briefly surfaces, then retreats. |

### Implementation Notes

- The jali opacity is controlled via the `--jali-opacity` CSS custom property on `.jali-surface::before`.
- Transitions between thresholds use CSS transitions for simple ramps and GSAP timelines for multi-phase sequences (pakad, level unlock).
- Multiple triggers can overlap. Use the highest applicable opacity (do not stack).
- The jali pattern SVG itself does not change -- only its opacity. No color shifts, no scale changes, no positional animation of the pattern.

---

## 5. Constraints for icon-creator

### Must Follow

1. **All SVG icons use `currentColor` for strokes.** Theme-awareness is inherited, not hardcoded. The only hardcoded colors are saffron (`#E8871E`) for earned states and gold (`#D4AF37`) for Guru-level zarr-kashi elements.

2. **Saffron is earned only.** Default icon state uses `--text` / `--text-2` / `--text-3`. Saffron appears only via the `earned` prop (raga mastered, level achieved, streak active). Never decorative.

3. **Gold is zarr-kashi only.** In the Guru mega icon, gold appears as hairlines (1px strokes) and single-point accents (small filled circles). Never as filled regions, backgrounds, or large strokes.

4. **Level icons must nest.** Each level's icon must visually contain the previous level's geometry. The Guru icon, when reduced to its innermost elements, must be recognizable as the Shishya icon. This is non-negotiable -- it encodes the musical truth that mastery contains all prior stages.

5. **Stroke weight: 1.5px at 64x64 viewBox.** This matches the logo's stroke weight. All icons in the system share this baseline. Thinner strokes (1px, 0.5px) are used for secondary elements (resonance arcs, shruti radiants, interval marks). Thicker strokes are never used.

6. **No fills except:** the Sa convergence point (small circle), earned-state saffron accents, and the Guru's zarr-kashi points. All other geometry is stroke-only.

7. **Every icon gets `role="img"` and `aria-label`.** The aria-label must describe the musical meaning, not the visual shape. "Shishya level: the single string" not "vertical line with circle."

8. **The `earned` prop must trigger a Kan spring (1000/30) micro-animation** on the saffron element when it first appears (when a raga is mastered, when a level is unlocked). A 2px scale-up snap on the saffron-colored element, then immediate return. One-shot, not looping.

9. **Level mega icons are delivered at three sizes:** 200px (hero, profile page), 64px (badge, inline), 16px (minimal, nav context). The 200px version may include the full resonance detail. The 16px version must be a recognizable silhouette -- remove resonance arcs and shruti radiants at this scale, keep only the string structure.

10. **Journey icons share a consistent bounding box** and visual weight. When displayed in a row (the home page journey grid), they must feel like a family -- same stroke weight, same visual density, same optical center.

### Must Not Do

- Do not draw literal musical instruments (sitars, tablas, tanpuras as objects).
- Do not use figurative imagery (hands, faces, meditating figures, lotus, Om).
- Do not use gradients. Flat color only (strokes + sparse fills).
- Do not animate icons by default. Animation is triggered by interaction or state change only.
- Do not change the existing logo (Logo.tsx) without a separate brand-director approval cycle.

---

## 6. File Expectations

icon-creator should deliver:

```
frontend/app/components/icons/
  levels/
    ShishyaIcon.tsx
    SadhakaIcon.tsx
    VarishthaIcon.tsx
    GuruIcon.tsx
    LevelIcon.tsx          # Registry: maps level ID to component
  journeys/
    BeginnerIcon.tsx
    ExplorerIcon.tsx
    ScholarIcon.tsx
    MasterIcon.tsx
    FreeformIcon.tsx
    JourneyIcon.tsx        # Registry: maps journey ID to component
  index.ts                 # Barrel export
```

Each component follows the pattern established in icon-creator.md:
- Props: `size`, `earned`, `className`, `style`
- Level icons add: `animated` prop for the unlock ceremony
- Journey icons add: `active` prop for current-journey highlighting

---

## 7. Integration Points

After icon-creator delivers, frontend-builder integrates:

1. **Home page (`page.tsx`):** Each journey card gains its journey icon, displayed at 40px above the journey name. Active journey icon uses saffron.

2. **Profile page (`profile/page.tsx`):** The level progression track replaces the current dot-based display with level mega icons. Current level at 120px (hero). Other levels at 40px (badge). The track reads left-to-right: Shishya -> Sadhaka -> Varistha -> Guru.

3. **Level unlock moment:** When `data-level` changes on `<html>`, the profile page triggers the Meend + GSAP ceremony described in section 3.

4. **Jali texture:** The `.jali-surface` class already exists in tokens.css. Frontend-builder wires the opacity thresholds from section 4 to the appropriate state changes in the practice session components.

---

APPROVED: brand-director, 2026-04-12
NEXT: icon-creator executes. Then frontend-builder integrates. Then uat-tester validates.
