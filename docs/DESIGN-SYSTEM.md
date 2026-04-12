# Design System -- Ragamala

Last updated: 2026-04-11

---

## Philosophy

Ragamala is the visual identity system for Sadhana. The name comes from the Ragamala tradition of Indian miniature painting -- "a garland of ragas" -- where each musical mode was given a visual world of color, mood, season, and time of day. Painters in the courts of Mewar, Bundi, and Kota translated sound into image: Bhairav became dawn's pale austerity, Yaman became the deep violet hour when lamps are lit. Ragamala continues this tradition in code.

The foundation remains Dhrupad: austere, geometric, meditative, precise. That austerity is the structural grammar -- single-column layouts, earned-only color, silence as a design element. Ragamala is Dhrupad's full flowering: the same rigor, now capable of shifting its entire color world in response to the raga being practiced.

**Core principles:**

1. **Earned color.** Saffron and gold never appear decoratively. Saffron signals correct pitch, active streak, musical achievement. Gold signals mastery -- Guru level, raga fully internalized. All other states live in the neutral register.
2. **Raga-responsive environment.** The interface shifts its color world based on the active raga, via the `data-raga` attribute. Transitions are slow (2400ms) -- ink diffusing across a page, not a toggle.
3. **Dhrupad austerity as default.** When no raga is active, the interface is Deep Malachite (night) or Ivory (day). No decoration. The raga brings the color.
4. **Texture over ornament.** Jali lattice patterns at near-invisible opacity. Zarr-kashi gold as hairline rules, never fills. Ink diffusion at edges. The interface has the material quality of a Mughal manuscript, not a software product.
5. **Invisible progression.** Level advancement changes the color temperature of the interface silently. The student notices one day that gold has entered their space. That is the ceremony.

Tokens live in `frontend/app/styles/tokens.css`.

---

## Color System

### Base Palette

| Name | Hex | Role |
|------|-----|------|
| Deep Malachite | `#0A1A14` | Night mode background. The color of a practice room before dawn. |
| Ivory | `#F5F0E8` | Day mode background. Handmade paper receiving notation. |
| Saffron | `#E8871E` | Earned accent. Correct pitch, active streak, musical achievement. Never decorative. |
| Gold | `#D4AF37` | Mastery register. Above Saffron. Guru level, raga mastered. Hairline rules and single-point accents only (zarr-kashi). Never filled, never decorative. |
| Slate | `#6B7280` | Neutral state. Not wrong, not yet right. |

### Night Mode (default)

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#0A1A14` | Deep Malachite -- primary background |
| `--bg-2` | `#0F241C` | Card backgrounds |
| `--bg-3` | `#142E24` | Elevated surfaces |
| `--bg-4` | `#1A3A2E` | Highest elevation |
| `--text` | `#F0E6D3` | Primary text (warm parchment) |
| `--text-2` | `#B8A99A` | Secondary text |
| `--text-3` | `#7A6B5E` | Tertiary / muted |
| `--border` | `rgba(240, 230, 211, 0.1)` | Subtle borders |
| `--border-2` | `rgba(240, 230, 211, 0.06)` | Faintest borders |

### Day Mode

Applied via `[data-theme="day"]` on `<html>`, or via `@media (prefers-color-scheme: light)` when no manual override is set.

| Token | Value |
|-------|-------|
| `--bg` | `#F5F0E8` (Ivory) |
| `--bg-2` | `#EDE7DB` |
| `--bg-3` | `#E5DDD0` |
| `--bg-4` | `#DDD4C5` |
| `--text` | `#1A1A2E` |
| `--text-2` | `#4A4553` |
| `--text-3` | `#8A8494` |

### Accent -- Saffron (earned only)

Saffron appears only when earned: correct pitch, mastered raga, active streak. It is the first ray of dawn. Never decorative.

| Token | Value |
|-------|-------|
| `--accent` | `#E8871E` |
| `--accent-hover` | `#D07518` |
| `--accent-dim` | `rgba(232, 135, 30, 0.15)` |
| `--accent-glow` | `rgba(232, 135, 30, 0.25)` |

### Mastery -- Gold (zarr-kashi only)

Gold is the mastery register. It lives above Saffron in the hierarchy. Used only as:
- Hairline (1px) rules separating sections at Guru level
- Single-point accents (a dot, a convergence point)
- Never as fills, backgrounds, gradients, or large areas of color

| Token | Value |
|-------|-------|
| `--gold` | `#D4AF37` |
| `--gold-dim` | `rgba(212, 175, 55, 0.15)` |
| `--gold-glow` | `rgba(212, 175, 55, 0.25)` |
| `--gold-hairline` | `rgba(212, 175, 55, 0.6)` |

### RAG Status

| Token | Value | Meaning |
|-------|-------|---------|
| `--correct` | `#22C55E` | On pitch / passed |
| `--correct-dim` | `rgba(34, 197, 94, 0.15)` | Background tint |
| `--in-progress` | `#F59E0B` | Close but not there |
| `--in-progress-dim` | `rgba(245, 158, 11, 0.15)` | Background tint |
| `--needs-work` | `#EF4444` | Off pitch / violation |
| `--needs-work-dim` | `rgba(239, 68, 68, 0.15)` | Background tint |

### Level Colors

Interface deepens invisibly as the student progresses. No announcements. Gold enters the space slowly.

| Level | Token | Value | Visual behavior |
|-------|-------|-------|-----------------|
| Shishya (1-3) | `--level-shishya` | `#0A1A14` | Base malachite. No accent color. The student lives in the deep green darkness. |
| Sadhaka (4-6) | `--level-sadhaka` | `#2D6A4F` | Forest malachite. The interface warms slightly. Borders gain faint green. |
| Varistha (7-9) | `--level-varistha` | `#1E3A5F` | Lapis. Blue enters the palette. Precision instruments (cents needle) surface by default. |
| Guru (10) | `--level-guru` | `#D4AF37` | Gold. Zarr-kashi rules appear. The convergence point in the logo shifts to gold. Interface has the authority of an illuminated manuscript. |

---

## Raga Color Worlds

The Ragamala system. Each of the 5 initial ragas has a complete color world, grounded in the visual tradition of Mewar and Bundi-Kota Ragamala miniature paintings. When a student begins practicing a raga, the interface transitions into that raga's color world over 2400ms -- ink diffusing across handmade paper.

Set via `data-raga` attribute on the root container. Each raga provides 5 CSS custom properties:
- `--raga-bg` -- deep base color (replaces `--bg` in raga-active contexts)
- `--raga-mid` -- mid-tone for cards and surfaces
- `--raga-accent` -- characteristic accent (used for active elements within the raga world)
- `--raga-text` -- text color optimized for legibility on `--raga-bg`
- `--raga-glow` -- translucent accent for resonance effects, halos, pitch visualizations

### Bhairav -- Dawn

**Time:** Early morning, before sunrise. **Rasa:** Awe, solemnity, devotion.

In Ragamala paintings, Bhairav is Shiva as the ascetic at dawn -- pale skies, ash-smeared skin, the first light touching temple walls. The Mewar tradition renders this as cool greys and pale rose against a sky that has not yet committed to blue. Restraint is the visual signature.

| Token | Value | Source |
|-------|-------|--------|
| `--raga-bg` | `#1A1520` | Pre-dawn sky -- not quite black, not yet blue. A muted violet-grey. |
| `--raga-mid` | `#2A2233` | The sky lightening at its lowest edge. |
| `--raga-accent` | `#C4A0A0` | Pale rose. Ash and sandalwood. The color of first light on stone. |
| `--raga-text` | `#E8DDD5` | Warm parchment against the cool dawn. |
| `--raga-glow` | `rgba(196, 160, 160, 0.2)` | Rose diffusion -- the sky before the sun breaks. |

### Yaman -- Evening (first lamp)

**Time:** Early evening, when lamps are lit. **Rasa:** Shringara (romance), devotion, gentle grandeur.

Yaman (Kalyan) in the Ragamala tradition is the hour of lamp-lighting -- deep violet skies, interiors warm with oil-lamp gold, the transition from day to night rendered as a dialogue between violet and amber. The Bundi-Kota tradition gives this raga architectural interiors, rich textiles, and a palette of deep indigo softened by warm light.

| Token | Value | Source |
|-------|-------|--------|
| `--raga-bg` | `#12101E` | Deep violet evening sky. The first star is visible. |
| `--raga-mid` | `#1E1A30` | Interior wall lit by oil lamp. |
| `--raga-accent` | `#C9A84C` | Warm amber. Lamp flame. Not gold (which is mastery-only) but its earthier cousin. |
| `--raga-text` | `#E8E0D0` | Parchment under lamplight. |
| `--raga-glow` | `rgba(201, 168, 76, 0.2)` | Lamp-glow diffusion around warm surfaces. |

### Bhoopali -- Dusk

**Time:** Late afternoon into dusk. **Rasa:** Shanta (peace), karuna (tenderness).

Bhoopali is a pentatonic raga of pure simplicity -- five notes, no dissonance. In the painting tradition, this maps to open landscapes at dusk, clear skies without storm, the earth settling. The Mewar palette uses earth tones, warm ochre, and the teal-green of vegetation at the golden hour.

| Token | Value | Source |
|-------|-------|--------|
| `--raga-bg` | `#141A18` | Earth at dusk -- dark green fading to near-black. |
| `--raga-mid` | `#1E2824` | Vegetation in the last light. |
| `--raga-accent` | `#C4956A` | Warm ochre. Earth, clay, the amber of a setting sun on stone. |
| `--raga-text` | `#E5DDD0` | Parchment in fading light. |
| `--raga-glow` | `rgba(196, 149, 106, 0.2)` | Golden-hour diffusion. |

### Bhimpalasi -- Afternoon

**Time:** Late afternoon, the hours of longing. **Rasa:** Shringara (longing), karuna (pathos).

Bhimpalasi is the raga of afternoon separation -- the beloved is away, the hours stretch. In Ragamala paintings, this mood is rendered with warm interiors, rich red and ochre textiles, the weight of midday heat. The Bundi tradition fills these scenes with heavy drapery and saturated earth reds.

| Token | Value | Source |
|-------|-------|--------|
| `--raga-bg` | `#1A1412` | Warm dark -- the interior of a sandstone room at midday. |
| `--raga-mid` | `#2A2220` | Red earth, shadow side. |
| `--raga-accent` | `#B85C4A` | Terracotta. Warm red-earth. The color of longing rendered as fired clay. |
| `--raga-text` | `#E8DDD5` | Warm parchment. |
| `--raga-glow` | `rgba(184, 92, 74, 0.2)` | Warm diffusion -- heat haze, emotional weight. |

### Bageshri -- Night

**Time:** Late night, second prahar. **Rasa:** Shringara (love in separation), karuna.

Bageshri is a night raga of intimate longing. In the painting tradition, night ragas are rendered with deep blues and greens, moonlit terraces, solitary figures. The Kota tradition gives these scenes silvered moonlight against indigo darkness, with touches of white jasmine.

| Token | Value | Source |
|-------|-------|--------|
| `--raga-bg` | `#0D1218` | Midnight blue-black. The deepest hour. |
| `--raga-mid` | `#151E28` | Moonlit wall -- blue-grey emerging from darkness. |
| `--raga-accent` | `#7A9EB8` | Cool silver-blue. Moonlight on water. Jasmine in darkness. |
| `--raga-text` | `#D8DEE8` | Cool parchment under moonlight. |
| `--raga-glow` | `rgba(122, 158, 184, 0.2)` | Moonlight diffusion. |

### Implementation

The raga color world does not replace the base palette -- it layers over it. Practice screens use `--raga-bg` as their background; the shell (navigation, header) remains on `--bg`. The ink-diffusion effect at the boundary between raga world and shell is achieved with a radial gradient from `--raga-bg` to transparent.

---

## Typography

Four type voices. No exceptions.

| Voice | Font | Use | CSS var |
|-------|------|-----|---------|
| Serif | Cormorant Garamond (300, 400, 600) | Raga names (romanized), Sanskrit, titles, cinematic reveals | `--font-serif` |
| Devanagari | Noto Serif Devanagari (400, 600) | Raga names in Devanagari script, swara names, Sanskrit terms when script toggle is active | `--font-devanagari` |
| Sans | Inter (400, 500) | UI text, labels, body, navigation | `--font-sans` |
| Mono | IBM Plex Mono (400) | Hz values, cents, ratios, frequency data | `--font-mono` |

All loaded via `next/font/google` in `layout.tsx`. CSS variables set on `<html>`.

### Devanagari Integration

Noto Serif Devanagari is the fourth voice. It serves as the native script for all musical terminology -- raga names, swara names, tala names, ornament names. It is not decorative; it is the original script these terms were written in.

**Script toggle behavior:**
- Global toggle: romanized (default) or Devanagari. Persisted to user profile via Supabase.
- When Devanagari is active: all raga names, swara names, and Sanskrit terms render in Noto Serif Devanagari. UI chrome (buttons, navigation labels) remains in Inter.
- When romanized is active: all terms render in Cormorant Garamond with standard IAST transliteration.
- Default: Devanagari ON for users who select Hindi/Marathi/Sanskrit preference during onboarding. Romanized ON for all others.
- Toggle is accessible from any screen via a persistent icon in the header (a stylized "Sa" glyph that toggles between Latin and Devanagari rendering).

**Implementation:**
- A `data-script="devanagari"` or `data-script="romanized"` attribute on `<html>`.
- Musical terms are wrapped in `<span class="swara-text">` or similar semantic class.
- CSS rules switch font-family based on `data-script` attribute.
- Content is stored in both scripts; the toggle controls which renders.

### Type Scale

Modular, base 16px, ratio ~1.25 (major third).

| Token | Size | Use |
|-------|------|-----|
| `--text-xs` | 12px | Fine print, cents values |
| `--text-sm` | 14px | Labels, captions |
| `--text-base` | 16px | Body |
| `--text-md` | 18px | Emphasis body |
| `--text-lg` | 20px | Section heads |
| `--text-xl` | 24px | Card titles |
| `--text-2xl` | 32px | Page titles |
| `--text-3xl` | 40px | Raga name in practice |
| `--text-4xl` | 56px | Cinematic raga reveal (pakad moment) |

---

## Motion Physics Grammar

Every animation in Sadhana maps to a Hindustani musical ornament. This is not metaphor -- the spring physics presets are named after ornaments because they share the same physical character: a meend (glide) has the same frequency trajectory as a spring with low stiffness and high damping; a gamak (oscillation) has the same overshoot pattern as a spring with high stiffness and low damping.

### Named Presets

These values are consumed by Framer Motion's `spring` transition type. They are stored as CSS custom properties for JS access via `getComputedStyle()`.

| Preset | Ornament | Stiffness | Damping | Character | Use |
|--------|----------|-----------|---------|-----------|-----|
| Tanpura Release | (drone settling) | 400 | 15 | Long decay, natural string settling after pluck. The fundamental oscillation of the app. | Page transitions, modal open/close, card stagger. |
| Meend | Glide between swaras | 80 | 20 | Slow, smooth, deliberate. No overshoot. The pitch dot sliding to its target. | Pitch visualization, progress bar fill, slider interactions. |
| Gamak | Rapid oscillation | 600 | 5 | Aggressive overshoot, multiple oscillations before settling. Energy. | Incorrect pitch feedback, error states, streak break moment. |
| Andolan | Subtle shake, breath | 120 | 8 | Gentle oscillation, barely perceptible. The tanpura string vibrating. | Ambient waveform, hover states, idle animations. |
| Kan | Grace note | 1000 | 30 | Instantaneous snap. No oscillation. The fastest gesture. | Button press, toggle, micro-interactions, tap feedback. |

### CSS Timing Functions (fallback for non-spring contexts)

| Token | Curve | Use |
|-------|-------|-----|
| `--spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Interactive elements (overshoot) |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrances, reveals |
| `--ease-in-out` | `cubic-bezier(0.45, 0, 0.55, 1)` | Symmetrical transitions, raga color world shifts |

### Durations

| Token | Value | Use |
|-------|-------|-----|
| `--dur-instant` | 0ms | Immediate response |
| `--dur-fast` | 150ms | Micro-interactions (kan) |
| `--dur-normal` | 300ms | Standard transitions |
| `--dur-slow` | 600ms | Background transitions |
| `--dur-ceremony` | 1200ms | Level unlocks, subtle moments |
| `--dur-cinematic` | 2400ms | Pakad reveal, raga ceremonies, raga color world transition |

All durations collapse to 0ms when `prefers-reduced-motion: reduce` is active.

### Motion Stack

| Tool | Scope |
|------|-------|
| Framer Motion v12 | Spring physics for interactions. Uses named presets above. |
| GSAP 3 | Cinematic timelines (pakad reveal, session ceremonies, jali pattern reveal). |
| Three.js r170 | Tanpura waveform visualization, ambient voice reactivity. |

---

## Texture Language

Three texture elements give the interface the material quality of a Mughal manuscript. They operate at the threshold of perception -- visible in aggregate, invisible in isolation.

### Jali Pattern

A geometric lattice pattern inspired by the stone jali screens of Mughal architecture. Rendered as SVG, applied as a background pattern on cards and containers.

- **Default state:** 4% opacity. A barely-visible geometric rhythm underlying content.
- **Pakad recognition moment:** Full reveal. The jali pattern scales to 100% opacity over 1200ms (GSAP timeline), then settles back to 15% and slowly fades to 4%. The architecture of the music becomes briefly visible.
- **Implementation:** SVG pattern defined in tokens. Applied via `background-image` on `.jali-surface` class. Opacity controlled via `--jali-opacity` custom property, animated via GSAP.

### Ink Diffusion

When a raga color world activates, the color does not switch -- it bleeds. A radial gradient from the center of the practice area, expanding outward over 2400ms. The raga's `--raga-bg` diffuses from the center; the edges retain the base `--bg` until the transition completes.

- **Trigger:** `data-raga` attribute set or changed.
- **Shape:** Radial gradient, center origin, expanding from 0% to 100% coverage.
- **Duration:** 2400ms, eased with `--ease-in-out`.
- **Edge behavior:** The boundary between raga color and base color is never sharp. A 20% feather zone at all times.

### Zarr-kashi (Gold Work)

Named after the Mughal metalwork technique of inlaying gold wire into steel. In Ragamala, gold (`#D4AF37`) appears only as:

- **Hairline rules:** 1px horizontal or vertical lines separating sections. Only at Guru level.
- **Single-point accents:** The Sa convergence point in the logo. A dot marking a mastered raga in the raga browser.
- **Never:** Filled backgrounds, gradient components, large text, button backgrounds, decorative borders.

---

## Logo

Source: `frontend/app/components/Logo.tsx`. Pure SVG, works 16px to 200px.

**Anatomy:**
- Four tanpura strings converging to a Sa point at bottom center
- String 1 (fundamental/Sa): saffron `#E8871E`, strokeWidth 1.5, full opacity
- String 2 (Pa): `--text-2`, strokeWidth 1.2, opacity 0.6
- String 3: `--text-3`, strokeWidth 1, opacity 0.4
- String 4 (highest partial): `--text-3`, strokeWidth 1, opacity 0.25
- Open arc behind strings: 225-315 degrees (bottom semicircle), top quadrant missing -- the practice still to come
- Sa convergence point: saffron circle, r=2.5 (shifts to gold `#D4AF37` at Guru level)
- Strings originate from x: 20, 25, 39, 44 (top) and converge to x:32 (bottom)

**Variants:**
- `icon`: mark only, viewBox 64x64
- `full`: mark + "Sadhana" wordmark in Cormorant Garamond, viewBox 180x64

**Props:** `size` (px), `variant`, `className`, `style`.

---

## Signature Elements

### Reactive Tanpura Waveform

Three.js scene. The tanpura drone visualized as a standing wave that responds to the student's voice in real time. When the student is in tune, the voice waveform and tanpura waveform align. When off pitch, they diverge visually. This is Layer 1 of the Voice Feedback Visualization -- always ambient, always present behind the practice interface.

### Pakad Recognition Cinematic

When the engine detects the student has sung the pakad (characteristic phrase) of the active raga, a 2-layer cinematic sequence fires:

**Layer 1 -- Cinematic pause (~4s):**
- Tanpura continues uninterrupted.
- Background deepens to full `--raga-bg`.
- Jali pattern scales to full reveal (100% opacity), then settles.
- Raga name appears large (--text-4xl) in Cormorant Garamond (or Noto Serif Devanagari if script toggle is active), center screen.
- Below it: the phrase in sargam notation (e.g., Ni Re Ga Ma Ga Re Sa).
- GSAP timeline, ~4000ms total.

**Layer 2 -- Settles:**
- "You just sang the pakad of [raga]" appears at the bottom as quiet text.
- Fades to 40% opacity. Stays for the rest of the session.
- Tanpura never stops. Practice continues through it.

---

## Layout

| Token | Value |
|-------|-------|
| `--max-width` | 720px |
| `--max-width-wide` | 1080px |
| `--touch-min` | 44px |
| `--header-height` | 56px |

Single-column practice layout. One thing at a time.

---

## Spacing

4px base, rem units. Tokens from `--space-0` (0) through `--space-24` (96px / 6rem).

---

## Border Radius

Geometric, austere. No excessive rounding. The aesthetic is cut stone, not soft plastic.

| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | 4px | Default for cards, inputs |
| `--radius-md` | 8px | Larger cards, modals |
| `--radius-lg` | 12px | Feature cards |
| `--radius-xl` | 16px | Hero elements |
| `--radius-full` | 9999px | Circles, pills, pitch dot |

---

## Shadows

Three depths plus accent glow and gold glow.

| Token | Use |
|-------|-----|
| `--shadow-sm` | Subtle lift |
| `--shadow-md` | Cards |
| `--shadow-lg` | Modals, elevated surfaces |
| `--shadow-glow` | Saffron accent glow |
| `--shadow-gold` | Gold mastery glow (Guru level only) |

---

## Z-Index

| Token | Value |
|-------|-------|
| `--z-tanpura-bg` | -1 |
| `--z-base` | 1 |
| `--z-sticky` | 50 |
| `--z-overlay` | 100 |
| `--z-modal` | 200 |
| `--z-toast` | 300 |

---

## Accessibility

- Focus: 2px solid `--accent`, 2px offset, `--radius-sm` border-radius
- Selection: `--accent-dim` background
- `prefers-reduced-motion`: all animation durations set to 0ms, spring functions fall back to `ease`
- Touch targets: minimum 44px (`--touch-min`)
- Scrollbar: 6px wide, transparent track, `--border` thumb
- Raga color worlds maintain WCAG AA contrast ratios for all text/background combinations
- Script toggle preserves all semantic meaning -- Devanagari and romanized content are equivalent, not decorative

---

## Implementation Guide

### CSS Custom Properties

All tokens are CSS custom properties on `:root`. Night mode is default. Day mode overrides via `[data-theme="day"]`. Raga color worlds layer via `[data-raga="name"]`. Level colors via `[data-level="name"]`. Script toggle via `[data-script="devanagari"|"romanized"]`.

### Data Attributes

| Attribute | Values | Set on | Purpose |
|-----------|--------|--------|---------|
| `data-theme` | `"day"` or absent (night default) | `<html>` | Day/night mode |
| `data-raga` | `"bhairav"`, `"yaman"`, `"bhoopali"`, `"bhimpalasi"`, `"bageshri"` | Practice container | Raga color world activation |
| `data-level` | `"shishya"`, `"sadhaka"`, `"varistha"`, `"guru"` | `<html>` | Level-based interface deepening |
| `data-script` | `"devanagari"`, `"romanized"` | `<html>` | Script toggle for musical terms |

### Script Toggle Component

A React component in the header that toggles `data-script` on `<html>` and persists the choice to the user's Supabase profile. Renders as a small icon showing "Sa" in the active script. On click/tap, toggles immediately (no confirmation). The transition of text between scripts uses `--dur-normal` (300ms) with a fade.

### Raga Color World Activation

When a practice session begins:
1. Engine determines the active raga (time-based for daily riyaz, or student-selected).
2. `data-raga` attribute is set on the practice container.
3. Ink diffusion animation begins (radial gradient expanding over 2400ms).
4. All elements within the container inherit raga color tokens.
5. Shell elements (header, navigation) remain on base palette.

When practice ends or raga changes:
1. Current raga world fades via reverse ink diffusion (2400ms).
2. Brief neutral state (base palette).
3. New raga world diffuses in (if changing ragas).
