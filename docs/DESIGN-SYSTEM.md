# Design System -- Dhrupad

Last updated: 2026-04-11

Named after the oldest surviving form of Hindustani classical music: austere, geometric, meditative, precise. Tokens live in `frontend/app/styles/tokens.css`.

---

## Typography

Three type voices. No exceptions.

| Voice | Font | Use | CSS var |
|-------|------|-----|---------|
| Serif | Cormorant Garamond (300, 400, 600) | Raga names, Sanskrit, titles, cinematic reveals | `--font-serif` |
| Sans | Inter (400, 500) | UI text, labels, body | `--font-sans` |
| Mono | IBM Plex Mono (400) | Hz values, cents, ratios, frequency data | `--font-mono` |

Loaded via `next/font/google` in `layout.tsx`. CSS variables set on `<html>`.

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

## Color

### Night Mode (default)

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#0D0D1A` | Deep Indigo -- primary background |
| `--bg-2` | `#13132B` | Card backgrounds |
| `--bg-3` | `#1A1A3A` | Elevated surfaces |
| `--bg-4` | `#222250` | Highest elevation |
| `--text` | `#F0E6D3` | Primary text |
| `--text-2` | `#B8A99A` | Secondary text |
| `--text-3` | `#7A6B5E` | Tertiary / muted |
| `--border` | `rgba(240,230,211,0.1)` | Subtle borders |

### Day Mode

Applied via `[data-theme="day"]` attribute on `<html>`.

| Token | Value |
|-------|-------|
| `--bg` | `#F5F0E8` (Ivory) |
| `--text` | `#1A1A2E` |
| `--text-2` | `#4A4553` |
| `--text-3` | `#8A8494` |

### Accent -- Saffron (earned only)

Saffron appears only when earned: correct pitch, mastered raga, active streak. Never decorative.

| Token | Value |
|-------|-------|
| `--accent` | `#E8871E` |
| `--accent-hover` | `#D07518` |
| `--accent-dim` | `rgba(232,135,30,0.15)` |
| `--accent-glow` | `rgba(232,135,30,0.25)` |

### RAG Status

| Token | Value | Meaning |
|-------|-------|---------|
| `--correct` | `#22C55E` | On pitch / passed |
| `--in-progress` | `#F59E0B` | Close but not there |
| `--needs-work` | `#EF4444` | Off pitch / violation |

### Level Colors

| Token | Value | Level |
|-------|-------|-------|
| `--level-shishya` | `#6B7280` | Levels 1-3 |
| `--level-sadhaka` | `#3B82F6` | Levels 4-6 |
| `--level-varistha` | `#8B5CF6` | Levels 7-9 |
| `--level-guru` | `#E8871E` | Level 10 |

---

## Spacing

4px base, rem units. Tokens from `--space-0` (0) through `--space-24` (96px / 6rem).

---

## Border Radius

`--radius-sm` (4px) through `--radius-full` (9999px).

---

## Shadows

Three depths plus an accent glow: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-glow`.

---

## Motion Grammar

### Timing Functions

| Token | Curve | Use |
|-------|-------|-----|
| `--spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Interactive elements (overshoot) |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrances, reveals |
| `--ease-in-out` | `cubic-bezier(0.45, 0, 0.55, 1)` | Symmetrical transitions |

### Durations

| Token | Value | Use |
|-------|-------|-----|
| `--dur-instant` | 0ms | Immediate response |
| `--dur-fast` | 150ms | Micro-interactions |
| `--dur-normal` | 300ms | Standard transitions |
| `--dur-slow` | 600ms | Background transitions |
| `--dur-ceremony` | 1200ms | Level unlocks, subtle moments |
| `--dur-cinematic` | 2400ms | Pakad reveal, raga ceremonies |

All durations collapse to 0ms when `prefers-reduced-motion: reduce` is active.

### Motion Stack

| Tool | Scope |
|------|-------|
| Framer Motion v12 | Spring physics for interactions (pitch dot, card transitions, stagger) |
| GSAP 3 | Cinematic timelines (pakad reveal, session ceremonies) |
| Canvas 2D | Tanpura waveform visualization (`TanpuraViz.tsx`) |

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
- Sa convergence point: saffron circle, r=2.5
- Strings originate from x: 20, 25, 39, 44 (top) and converge to x:32 (bottom)

**Variants:**
- `icon`: mark only, viewBox 64x64
- `full`: mark + "Sadhana" wordmark in Cormorant Garamond, viewBox 180x64

**Props:** `size` (px), `variant`, `className`, `style`.

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
- `prefers-reduced-motion`: all animation durations set to 0ms
- Touch targets: minimum 44px (`--touch-min`)
- Scrollbar: 6px wide, transparent track, `--border` thumb
