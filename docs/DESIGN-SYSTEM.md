# Design System -- Ragamala

Last updated: 2026-04-14

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

## Logo -- Text-Dominant Brand Mark with Tantri Accent

Source: `frontend/app/components/Logo.tsx`. SVG + Framer Motion springs, works 16px to 400px.

**Design philosophy:**
The text IS the brand. "Sadhana" in large Cormorant Garamond commands the space -- it must pop, it must be unmistakable. The Devanagari "sadhana" is treated as an equal partner, not a subtitle. The Tantri strings (Bhoopali pentatonic at just-intonation intervals) serve as a resonant accent band beneath the text, connecting the brand to the instrument without competing for attention. The logo feels like an instrument, not a tech product.

**Concept:**
The wordmark dominates. Below it, five horizontal strings at just-intonation intervals -- the pentatonic field of Raga Bhoopali (Sa Re Ga Pa Dha) -- provide the Tantri accent. Spacing follows logarithmic frequency ratios (1:1, 9:8, 5:4, 3:2, 5:3), making the intervals acoustically truthful, not decorative. The Sa string carries a standing wave. A saffron terminus point anchors the tonic. Strings extend rightward without boundary: the practice continues.

**Anatomy (full variant):**
- "Sadhana" (with macrons) in Cormorant Garamond 400, fontSize 72 (viewBox units), letterSpacing 0.08em -- large, commanding, the hero element
- Subtle ambient saffron glow (4% opacity) on the wordmark with a 3s breathing pulse
- Saffron accent dot (r=2.5, opacity 0.6) beside the S -- a Sa marker
- Devanagari "sadhana" in Noto Serif Devanagari 400, fontSize 28, letterSpacing 0.12em, opacity 0.75 -- equal partner
- Tantri string accent band:
  - Five horizontal strings at just-intonation vertical spacing (log2 scale)
  - Sa string (lowest, thickest): strokeWidth 2.2, opacity 0.85, carries a standing wave (fundamental mode: `sin(pi * t)`)
  - Pa string: strokeWidth 1.8, opacity 0.65, `--text-2` color (achala, visually anchored)
  - Re, Ga, Dha strings: strokeWidth 1.0, opacity 0.40-0.45, `--text` color (reduced to 70% in non-interactive mode)
  - Sa terminus point: saffron `#E8871E`, r=2.2, with radial glow halo r=6
  - Right edge: strings fade to transparent via linear gradient mask (no boundary -- practice continues)
  - Standing wave glow: saffron at 12% opacity behind the Sa wave, gaussian blur filter

**Size presets:**

| Preset | Pixels | Detail level | Interactive | Use |
|--------|--------|-------------|------------|-----|
| `xs` | 24px | Compact mark only, minimal strings | No | Tight spaces |
| `sm` / `nav` | 32px | 5 strings, standing wave, both terminus points | Yes | Navigation bar |
| `md` / `header` | 48px | Full text + Devanagari + strings, interactive | Yes | Page headers |
| `lg` | 80px | Full articulation with enhanced glow | Yes | Hero sections |
| `xl` | 120px | Maximum detail, full wave articulation | Yes | Splash, landing |
| `xxl` / `splash` | 200px | Maximum detail, cinematic | Yes | Loading screen, about |
| `hero` | 400px | Maximum impact, cinematic scale | Yes | Home page hero |

Usage: `<Logo size="xl" />` or `<Logo size={120} />` (both accepted). Legacy presets (`'nav'`, `'header'`, `'hero'`, `'splash'`) still work.

**Variants:**
- `full`: text + Devanagari + Tantri string accent (viewBox 480xN, height-driven)
- `wordmark`: text + Devanagari only, no strings
- `compact` / `icon`: Tantri mark only, viewBox 64x64

**LogoMark:** Exported as `LogoMark` -- icon-only wrapper with `loading` prop. For tight spaces (favicons, tab icons, loading spinners). Always non-interactive.

### Motion Physics

The logo responds like a physical instrument. Every animation maps to a named spring preset from the Ragamala motion grammar. No ease-in-out, no CSS transitions -- springs only.

| State | Behavior | Spring / Technique | Detail |
|-------|----------|-------------------|--------|
| **Idle** | Subtle vertical drift on Sa wave, ~0.5Hz. Ambient saffron text glow breathes at 3s. | CSS `@keyframes`, 2s wave / 3s text | Barely perceptible breathing. The string vibrates at rest. No JS animation frame. |
| **Loading** | Pronounced Sa wave oscillation | CSS `@keyframes`, 2s period, larger amplitude | Wave displacement is 50% of amplitude (vs 15% for idle). Saffron glow pulses in sync. |
| **Hover** | All strings brighten (opacity x1.4), Sa glow intensifies and scales. Text gains saffron warmth (12% opacity). | Andolan (stiffness 120, damping 8) | The string field responds as if the student's voice approached. Gentle oscillation, organic settle. |
| **Press/click** | Entire mark contracts to 96.5% scale | Kan (stiffness 1000, damping 30) | Instantaneous snap inward, like a string being plucked. No wind-up, no delay. |
| **Release** | Mark returns to 100% scale | Kan spring naturally decays back | The high damping of the Kan preset ensures a single crisp snap with no oscillation. |
| **Load-in** | Logo resolves upward via Tanpura Release spring with 80ms delay | Tanpura Release (stiffness 400, damping 15) | 12px vertical travel, opacity 0 to 1. Feels like a string settling. |

**Loading prop:** `<Logo loading />` activates the loading wave animation. The Sa standing wave oscillates with greater amplitude, and the saffron glow behind it pulses. This is pure CSS `@keyframes` -- zero JavaScript animation frames, works even before React hydration.

**Interactive prop:** `<Logo interactive />` or `<Logo interactive={false} />`. Defaults to `true` for sizes >= 24px, `false` for compact sizes. When false, the logo renders as a plain `<svg>` with no Framer Motion overhead.

**Accessibility:**
- Interactive logos receive `tabIndex={0}` for keyboard focus
- `role="img"` and `aria-label="Sadhana"` on all variants
- CSS animations respect `prefers-reduced-motion: reduce` (all durations collapse to 0ms via the token system)

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number \| LogoSizePreset` | `48` | Height in pixels, or a named preset |
| `variant` | `'full' \| 'wordmark' \| 'compact' \| 'icon'` | `'full'` | `'full'` shows text + Devanagari + strings. `'wordmark'` shows text + Devanagari. `'compact'`/`'icon'` shows mark only. |
| `loading` | `boolean` | `false` | When true, Sa wave animates with pronounced oscillation |
| `interactive` | `boolean` | auto | When true, hover/press spring physics are active. Auto-enabled for sizes >= 24px. |
| `animate` | `boolean` | `false` | Show the load-in animation (Tanpura Release spring). |
| `className` | `string` | -- | Additional CSS class |
| `style` | `CSSProperties` | -- | Additional inline styles |

### Brand Loader

Source: `frontend/app/components/BrandLoader.tsx`.

A cinematic loading state that shows the full Sadhana wordmark (variant="full", size=80) with animated standing wave and optional tagline. Replaces generic loading spinners with brand recognition from the first millisecond.

Usage: `<BrandLoader loading={true} tagline="Disciplined practice toward mastery" />`

Exit animation: scales to 95% and fades via Tanpura Release spring.

### PWA Icons

SVG icons derived from the brand mark. Stored in `frontend/public/icons/`.

| File | Size | Content | Use |
|------|------|---------|-----|
| `favicon.svg` | scalable (16px target) | Compact: 3 strings (Sa, Pa, Dha), Sa point, no wave, Deep Malachite bg | Browser favicon |
| `icon-192.svg` | 192px | Text-dominant: "Sadhana" wordmark, Devanagari, 5-string accent, standing wave | PWA home screen icon |
| `icon-512.svg` | 512px | Text-dominant: large "Sadhana" wordmark (108px font), Devanagari, full wave articulation, enhanced glow | PWA splash / app store |

The `manifest.json` at `frontend/public/manifest.json` references all three. Icons are SVG (not rasterized) for infinite crispness at all device densities.

**Math:**
- Bhoopali ratios: Sa=1, Re=9/8, Ga=5/4, Pa=3/2, Dha=5/3
- Vertical position: `log2(ratio) / log2(5/3)` normalized to field height
- Standing wave path: `y = amplitude * sin(pi * t)` where t in [0,1]
- Wave amplitude: `min(3.5, size * 0.04)` -- scales with logo size, capped at 3.5 SVG units
- 48 segments for smooth SVG path rendering

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

**Stacking context rule for lesson pages:** VoiceWave renders a `position: fixed` canvas that spans the viewport. Any lesson page or practice screen that sits above VoiceWave must apply `isolation: isolate` on its page container and `position: relative; z-index: var(--z-base)` on each content section. This is implemented in `beginner-lesson.module.css`, `beginner.module.css`, and `lesson-renderer.module.css`. Do not use bare `z-index` integers -- always use tokens.

---

## Accessibility

- Focus: 2px solid `--accent`, 2px offset, `--radius-sm` border-radius
- Selection: `--accent-dim` background
- `prefers-reduced-motion`: all animation durations set to 0ms, spring functions fall back to `ease`. Enforced at two layers: (1) CSS token collapse via `[data-reduced-motion="true"]` (set by `ReducedMotionBridge` in `providers.tsx`), and (2) Framer Motion's global `<MotionConfig reducedMotion="user">` wrapper, which disables all spring animations app-wide when the OS preference is set.
- Touch targets: minimum 44px (`--touch-min`). Enforced on `navButton`, `ragaChip`, `swaraDot`, and all interactive controls via `min-height: var(--touch-min); min-width: var(--touch-min)`. Meets WCAG 2.5.5.
- Scrollbar: 6px wide, transparent track, `--border` thumb
- Raga color worlds maintain WCAG AA contrast ratios for all text/background combinations
- Script toggle preserves all semantic meaning -- Devanagari and romanized content are equivalent, not decorative
- Token compliance: hardcoded border-radius values (`50%`, raw `px`), transition durations, and font-size values below the type scale must not appear in CSS modules -- use design tokens only.

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

---

## Icon System

Full icon direction in `docs/ICON-DIRECTION.md`. Summary:

### Level Mega Icons (Harmonic Accumulation)

Each level icon contains the geometry of all previous levels. The unifying structure is the tanpura string.

| Level | Geometry | What is added |
|-------|----------|---------------|
| Shishya | Single string + hollow Sa point | Knows only Sa |
| Sadhaka | Two strings (Sa+Pa) + interval mark + filled Sa | Hears intervals |
| Varistha | Four strings + resonance arcs | Hears overtones |
| Guru | Closed arc + 22 shruti radiants (zarr-kashi) | Hears everything |

Sizes: 200px (hero/profile), 64px (badge), 16px (silhouette).

### Journey Icons

| Journey | Shape | Quality |
|---------|-------|---------|
| Beginner | Ascending curve with tick marks | Guided, rising |
| Explorer | Branching paths from single root | Choice, discovery |
| Scholar | Precise lattice with emphasized nodes | Analysis, precision |
| Master | Opening spiral with marks along curve | Generation, creation |
| Freeform | Gapped circle with undulating wave | Freedom, pure voice |

### Arrival Motion

| Interaction | Spring preset |
|-------------|--------------|
| Page-load | Tanpura Release (400/15), 80ms stagger |
| Hover | Andolan (120/8), 3% scale |
| Press | Kan (1000/30), instant snap |
| Level unlock | Meend (80/20) + GSAP path draw, ~1600ms |

### Jali Texture Thresholds

| Trigger | Opacity | Duration |
|---------|---------|----------|
| Default (ambient) | 4% | Persistent |
| Raga world active | 8% | 2400ms ramp |
| Correct pitch sustained >2s | 12% | 600ms ramp |
| Pakad recognition | 100% -> 15% -> 4% | GSAP multi-phase |
| Level unlock | 20% | 1200ms up, 2400ms down |
| Session complete | 10% | 800ms up, 1600ms down |

---

## Tantri -- The String Interface Engine

Tantri (तन्त्री, Sanskrit: "string of a veena") is the universal swara visualization and interaction layer. It renders 12 horizontal strings -- one per chromatic swara (Sa, Re komal, Re, Ga komal, Ga, Ma, Ma tivra, Pa, Dha komal, Dha, Ni komal, Ni) -- positioned vertically by just-intonation frequency ratio on a logarithmic scale. The strings are simultaneously input (voice activates them) and output (touch/click produces sound via harmonium synth).

Source: `frontend/app/components/Tantri.tsx`. Canvas-based. 60fps render loop.

### Canvas Performance

The Tantri renderer has been optimized for zero-allocation hot paths:

| Optimization | Detail |
|---|---|
| Pre-allocated waveform buffers | Each string owns a `Float32Array` (`_waveformBuffer`) allocated once at construction. `generateStringWaveform` writes into this buffer in place — no per-frame heap allocations. |
| Font string caching | `ctx.font` is composed once per DPR change and cached as a module-level string (`_fontCacheDpr` guard). Setting `ctx.font` is expensive; the guard eliminates re-composition on every frame. |
| Splice-based trail trimming | The pitch trail array uses `splice(0, excess)` rather than `slice` reassignment, avoiding a new array allocation each frame. |
| Raga-aware skip | Strings outside the active raga are drawn at ghost opacity with a short-circuit path that skips waveform generation entirely. |

### Keyboard Accessibility

The Tantri canvas accepts keyboard focus. When focused:

| Key | Action |
|-----|--------|
| `ArrowUp` / `ArrowDown` | Move focus between strings (adjacent swara) |
| `Enter` / `Space` | Pluck the focused string (triggers synthesis + animation) |

`role="application"` with `aria-label` describing the string field. Focused string announced via `aria-live` region.

### String Anatomy

Each string is a horizontal line spanning the full container width. Visual weight and opacity encode musical hierarchy.

| Swara class | strokeWidth | Rest opacity | Label color | Distinguishing mark |
|-------------|-------------|-------------|-------------|---------------------|
| Sa (achala) | 2px | 0.15 | `--accent` | Saffron point at left terminus (r=2) |
| Pa (achala) | 2px | 0.15 | `--text-2` | Neutral point at left terminus (r=1.5) |
| In-raga swaras | 1px | 0.5 | `--raga-accent` (or `--text-2` if no raga active) | None |
| Not-in-raga swaras | 1px | 0.08 | `--text-3` at 0.3 opacity | Ghost lines -- present but receded |

Labels sit at the left margin in `--font-mono` at `--text-xs`. Touch target height is `--touch-min` (44px) regardless of visual string thickness.

### Accuracy Encoding

Voice pitch maps to the nearest swara string. Color temperature encodes accuracy; vibration amplitude encodes vocal intensity. Two independent channels.

| Accuracy band | Cents deviation | String color | Opacity | Visual behavior |
|---------------|----------------|-------------|---------|-----------------|
| Perfect | 0-5 cents | `--accent` (Saffron) | 1.0 | Single radial ripple, 400ms ease-out, 0.15 opacity, expands to 2x string height |
| Good | 5-15 cents | `--correct` | 0.6 | String brightens, no ripple |
| Approaching | 15-30 cents | `--in-progress` | 0.3 | Faint pulse |
| Off | >30 cents | Rest state | Rest | No change. Silence is the feedback. |

When a not-in-raga swara is activated by voice: ghost string flickers `--needs-work` for 200ms (Gamak spring 600/5), then returns to ghost state.

When perfect pitch is sustained >2 seconds: `--jali-opacity` rises to `--jali-opacity-pitch` (0.12) behind the string field. The architecture of the music becomes faintly visible.

### Touch/Click Interaction

| Phase | Spring preset | Duration | Character |
|-------|--------------|----------|-----------|
| Contact (press) | Kan (1000/30) | Instantaneous | String snaps to full amplitude. No wind-up. Like plucking a real string. |
| Sustain (hold) | -- | Continuous | String vibrates at Andolan (120/8). Sound sustains via harmonium synth. |
| Release | Tanpura Release (400/15) | ~800ms decay | String settles naturally. Sound envelope follows same curve. |
| Haptic (mobile) | -- | Single short pulse | On contact only. |

### Raga Context Behavior

When a raga activates (via `data-raga`):
1. Not-in-raga strings fade to ghost opacity (0.08) over `--dur-slow` (600ms).
2. Remaining in-raga strings redistribute vertically to fill available height (Meend spring 80/20, 400ms). The raga breathes into the space.
3. String labels inherit `--raga-accent` color from the active raga world.
4. Komal/tivra variants are positioned by their actual just-intonation ratio -- spacing is acoustically truthful, not uniform.

When raga deactivates: all 12 strings return to chromatic layout over 600ms.

### Layout Modes

| Mode | String field height | Visible strings | Label format | Use |
|------|-------------------|----------------|-------------|-----|
| Full-screen riyaz | 100vh minus header | All 12 (ghost + active) | Full swara name | Primary practice, freeform mode |
| Compact overlay | 120px | In-raga only | Single character (S R G M P D N) | Lesson overlay, browser mode |
| Transition | Meend (80/20), 400ms | Animated | Crossfade | Mode switch |

### Tokens (CSS Custom Properties)

```css
/* Tantri string field */
--tantri-string-sa-width: 2px;
--tantri-string-pa-width: 2px;
--tantri-string-default-width: 1px;
--tantri-string-rest-opacity: 0.35;
--tantri-string-ghost-opacity: 0.08;
--tantri-string-achala-opacity: 0.15;
--tantri-ripple-duration: 400ms;
--tantri-ripple-opacity: 0.15;
--tantri-ripple-scale: 2;
--tantri-compact-height: 120px;
--tantri-raga-transition: var(--dur-cinematic);
```

### Integration with Ragamala

- Night mode: strings are `--text` (warm parchment) at low opacity against Deep Malachite. Saffron reads as fire in darkness.
- Day mode: strings are `--text` (dark ink) at low opacity against Ivory. Saffron reads as the first brushstroke on a manuscript.
- Raga worlds: labels inherit `--raga-accent`. Bhairav strings have pale rose labels. Yaman strings have amber labels. The entire field shifts with ink diffusion.
- Jali texture: responds to sustained perfect pitch, connecting Tantri to the texture language.
- Level progression: at Guru level, Sa's terminus point shifts from saffron to gold (`--gold`). A zarr-kashi single-point accent. The only gold in the string field.
