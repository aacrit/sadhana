# Home Facelift -- Direction for frontend-builder

Date: 2026-04-12
Author: brand-director
Status: EXECUTE -- all specs are final. No design decisions required from frontend-builder.

---

## Overview

The home page transforms from a flat, uniform card grid into a layered, textured, culturally grounded entry point. Five changes: canvas background texture, per-journey card color worlds, persistent navbar with auth state, freeform card as a full-width cinematic portal, and micro-interaction polish.

---

## 1. Canvas Background Texture

The body is currently flat `#0A1A14`. It needs three layers of depth.

### Layer 1 -- Structural Pattern (Mehrab Arch Lattice)

A repeating pointed arch motif (mehrab) at large scale, barely visible. This gives the page the feeling of looking through a sequence of Mughal arches receding into darkness. The pattern repeats on a 120x120px tile.

**SVG pattern (exact geometry):**

```svg
<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'>
  <!-- Pointed arch (mehrab) outline -->
  <path d='M10 120 L10 50 Q10 10 60 10 Q110 10 110 50 L110 120'
        fill='none' stroke='white' stroke-width='0.5'/>
  <!-- Inner arch echo -->
  <path d='M25 120 L25 55 Q25 22 60 22 Q95 22 95 55 L95 120'
        fill='none' stroke='white' stroke-width='0.3'/>
  <!-- Keystone mark at apex -->
  <circle cx='60' cy='12' r='1.5' fill='none' stroke='white' stroke-width='0.3'/>
  <!-- Base threshold line -->
  <line x1='10' y1='120' x2='110' y2='120' stroke='white' stroke-width='0.3'/>
</svg>
```

**CSS (as data URI on body::before):**

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -2;
  pointer-events: none;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cpath d='M10 120 L10 50 Q10 10 60 10 Q110 10 110 50 L110 120' fill='none' stroke='white' stroke-width='0.5'/%3E%3Cpath d='M25 120 L25 55 Q25 22 60 22 Q95 22 95 55 L95 120' fill='none' stroke='white' stroke-width='0.3'/%3E%3Ccircle cx='60' cy='12' r='1.5' fill='none' stroke='white' stroke-width='0.3'/%3E%3Cline x1='10' y1='120' x2='110' y2='120' stroke='white' stroke-width='0.3'/%3E%3C/svg%3E");
  background-size: 120px 120px;
  background-repeat: repeat;
}
```

### Layer 2 -- Surface Grain (Handmade Paper)

A fine random dot pattern at near-invisible opacity. Simulates the tooth of handmade paper -- the kind manuscripts were written on. Uses a 4x4px tile with a single 0.5px dot offset per tile.

```css
body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0.02;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Ccircle cx='1' cy='1' r='0.5' fill='white'/%3E%3C/svg%3E");
  background-size: 4px 4px;
  background-repeat: repeat;
}
```

### Layer 3 -- Vignette

Radial darkening at the edges, like the border treatment of a Mughal miniature painting. The center is clear; the corners darken to near-black.

**Applied directly on the `.page` container (home page) as an additional background layer, NOT on body (so it does not affect inner pages without opt-in):**

```css
.page::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(
    ellipse 80% 70% at 50% 45%,
    transparent 0%,
    transparent 50%,
    rgba(0, 0, 0, 0.15) 80%,
    rgba(0, 0, 0, 0.35) 100%
  );
}
```

### New CSS tokens for canvas texture

```css
:root {
  --canvas-pattern-opacity: 0.035;
  --canvas-grain-opacity: 0.02;
  --canvas-vignette-outer: rgba(0, 0, 0, 0.35);
  --canvas-pattern-size: 120px;
}
```

---

## 2. Journey Cards -- Distinct Color Worlds

Each card gets its own background, border, and accent treatment. These are NOT raga color worlds (those are for practice screens). These are level-palette color worlds for the journey entry points.

### Shared card structure

All journey cards retain: `border-radius: var(--radius-lg)`, `padding: var(--space-6)`, the jali `::before` overlay, and the same text layout. What changes: background color, border style, accent highlights, and internal light.

### Beginner / Arambh -- Shishya palette

The student at the threshold. Darkest card. A thin saffron hairline border signals the beginning.

| Property | Value |
|----------|-------|
| Background | `#0A1A14` (Deep Malachite -- `var(--level-shishya)`) |
| Border | `1px solid rgba(232, 135, 30, 0.2)` (saffron at 20%) |
| Jali tint | `rgba(232, 135, 30, 0.03)` -- warm jali, barely there |
| Icon color | `var(--text-3)` default, `var(--accent)` on hover |
| Internal glow | None. This card is the darkest. |
| Journey name color | `var(--text)` |
| Sanskrit name color | `var(--accent)` at 50% opacity |
| CSS class | `.journeyCard--beginner` |

```css
.journeyCard--beginner {
  background: #0A1A14;
  border: 1px solid rgba(232, 135, 30, 0.2);
}
.journeyCard--beginner::before {
  /* Override jali stroke to warm saffron tint */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M24 0L30 6L48 6L42 12L48 18L42 18L48 24L42 30L48 42L42 42L36 48L30 42L24 48L18 42L12 48L6 42L0 48L0 42L6 36L0 30L0 24L6 18L0 12L6 6L0 6L6 0L12 6L18 0L24 6L30 0Z' fill='none' stroke='%23E8871E' stroke-width='0.5'/%3E%3Cpath d='M24 12L30 18L36 12L42 18L36 24L42 30L36 36L30 30L24 36L18 30L12 36L6 30L12 24L6 18L12 12L18 18Z' fill='none' stroke='%23E8871E' stroke-width='0.5'/%3E%3C/svg%3E");
  opacity: 0.03;
}
```

### Explorer / Anveshana -- Sadhaka palette

A forest at dusk. Malachite green warms the space. The card feels alive, growing.

| Property | Value |
|----------|-------|
| Background | linear-gradient(160deg, `#0F241C` 0%, `#132E22` 50%, `#1A3A2E` 100%) |
| Border | `1px solid rgba(45, 106, 79, 0.25)` (Sadhaka green at 25%) |
| Jali tint | `rgba(92, 158, 110, 0.04)` -- green-tinted jali |
| Icon color | `var(--text-2)` default, `#5C9E6E` on hover |
| Internal glow | Faint green radial from bottom-left: `radial-gradient(ellipse at 20% 80%, rgba(45, 106, 79, 0.08) 0%, transparent 60%)` |
| Journey name color | `var(--text)` |
| Sanskrit name color | `#5C9E6E` at 60% opacity |
| Card accent (new token) | `--card-explorer-accent: #5C9E6E` |
| CSS class | `.journeyCard--explorer` |

```css
.journeyCard--explorer {
  background:
    radial-gradient(ellipse at 20% 80%, rgba(45, 106, 79, 0.08) 0%, transparent 60%),
    linear-gradient(160deg, #0F241C 0%, #132E22 50%, #1A3A2E 100%);
  border: 1px solid rgba(45, 106, 79, 0.25);
}
.journeyCard--explorer::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M24 0L30 6L48 6L42 12L48 18L42 18L48 24L42 30L48 42L42 42L36 48L30 42L24 48L18 42L12 48L6 42L0 48L0 42L6 36L0 30L0 24L6 18L0 12L6 6L0 6L6 0L12 6L18 0L24 6L30 0Z' fill='none' stroke='%235C9E6E' stroke-width='0.5'/%3E%3Cpath d='M24 12L30 18L36 12L42 18L36 24L42 30L36 36L30 30L24 36L18 30L12 36L6 30L12 24L6 18L12 12L18 18Z' fill='none' stroke='%235C9E6E' stroke-width='0.5'/%3E%3C/svg%3E");
  opacity: 0.04;
}
```

### Scholar / Vidvan -- Varistha palette

Lapis blue. A manuscript page. Gold zarr-kashi hairline border signals scholarly depth. Even though this card is locked in v1, it looks magnificent.

| Property | Value |
|----------|-------|
| Background | linear-gradient(170deg, `#0D1520` 0%, `#142235` 50%, `#1E3A5F` 100%) |
| Border | `1px solid rgba(212, 175, 55, 0.15)` (gold hairline at 15%) |
| Jali tint | `rgba(122, 158, 200, 0.03)` -- cool blue jali |
| Internal glow | Faint lapis radial from top-right: `radial-gradient(ellipse at 80% 20%, rgba(30, 58, 95, 0.12) 0%, transparent 50%)` |
| Journey name color | `#D8DEE8` (cool parchment) |
| Sanskrit name color | `var(--gold)` at 40% opacity |
| Lock message | `var(--text-3)` -- positioned bottom of card |
| Locked overlay | The card renders at full visual richness (not 50% opacity). Instead, a small lock indicator: a 1px gold line at the bottom of the card with "Reach Sadhaka level" in `--text-3`. The card's visual beauty invites aspiration. |
| CSS class | `.journeyCard--scholar` |

```css
.journeyCard--scholar {
  background:
    radial-gradient(ellipse at 80% 20%, rgba(30, 58, 95, 0.12) 0%, transparent 50%),
    linear-gradient(170deg, #0D1520 0%, #142235 50%, #1E3A5F 100%);
  border: 1px solid rgba(212, 175, 55, 0.15);
  cursor: default;
}
.journeyCard--scholar::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M24 0L30 6L48 6L42 12L48 18L42 18L48 24L42 30L48 42L42 42L36 48L30 42L24 48L18 42L12 48L6 42L0 48L0 42L6 36L0 30L0 24L6 18L0 12L6 6L0 6L6 0L12 6L18 0L24 6L30 0Z' fill='none' stroke='%237A9EC8' stroke-width='0.5'/%3E%3Cpath d='M24 12L30 18L36 12L42 18L36 24L42 30L36 36L30 30L24 36L18 30L12 36L6 30L12 24L6 18L12 12L18 18Z' fill='none' stroke='%237A9EC8' stroke-width='0.5'/%3E%3C/svg%3E");
  opacity: 0.03;
}
.journeyCard--scholar .journeyLockMessage {
  border-top: 1px solid rgba(212, 175, 55, 0.15);
  padding-top: var(--space-3);
  margin-top: auto;
}
```

**IMPORTANT: Remove the `.journeyCardLocked { opacity: 0.5 }` rule.** Locked cards should NOT be dimmed. They should look fully rendered and aspirational. The lock state is communicated by: (a) the lock message text, (b) `pointer-events: none`, and (c) not being wrapped in a `<Link>`. The visual richness of the card is the incentive.

### Master / Acharya -- Guru palette

Gold radiates. Even locked, this card is the most visually striking. It whispers mastery.

| Property | Value |
|----------|-------|
| Background | linear-gradient(175deg, `#12100A` 0%, `#1A1608` 50%, `#221E0E` 100%) |
| Border | `1px solid rgba(212, 175, 55, 0.2)` (gold at 20%) |
| Jali tint | `rgba(212, 175, 55, 0.025)` -- warm gold jali, barely perceptible |
| Internal glow | Subtle gold radial from center: `radial-gradient(ellipse at 50% 50%, rgba(212, 175, 55, 0.06) 0%, transparent 50%)` |
| Journey name color | `#E8DCC8` (warm parchment, touched by gold) |
| Sanskrit name color | `var(--gold)` at 50% opacity |
| Lock message | Same treatment as Scholar: gold hairline + muted text |
| CSS class | `.journeyCard--master` |

```css
.journeyCard--master {
  background:
    radial-gradient(ellipse at 50% 50%, rgba(212, 175, 55, 0.06) 0%, transparent 50%),
    linear-gradient(175deg, #12100A 0%, #1A1608 50%, #221E0E 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  cursor: default;
}
.journeyCard--master::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M24 0L30 6L48 6L42 12L48 18L42 18L48 24L42 30L48 42L42 42L36 48L30 42L24 48L18 42L12 48L6 42L0 48L0 42L6 36L0 30L0 24L6 18L0 12L6 6L0 6L6 0L12 6L18 0L24 6L30 0Z' fill='none' stroke='%23D4AF37' stroke-width='0.5'/%3E%3Cpath d='M24 12L30 18L36 12L42 18L36 24L42 30L36 36L30 30L24 36L18 30L12 36L6 30L12 24L6 18L12 12L18 18Z' fill='none' stroke='%23D4AF37' stroke-width='0.5'/%3E%3C/svg%3E");
  opacity: 0.025;
}
.journeyCard--master .journeyLockMessage {
  border-top: 1px solid rgba(212, 175, 55, 0.2);
  padding-top: var(--space-3);
  margin-top: auto;
}
```

### New CSS tokens for card palettes

```css
:root {
  /* Journey card accents */
  --card-beginner-bg: #0A1A14;
  --card-beginner-border: rgba(232, 135, 30, 0.2);
  --card-explorer-bg: #132E22;
  --card-explorer-accent: #5C9E6E;
  --card-explorer-border: rgba(45, 106, 79, 0.25);
  --card-scholar-bg: #142235;
  --card-scholar-border: rgba(212, 175, 55, 0.15);
  --card-master-bg: #1A1608;
  --card-master-border: rgba(212, 175, 55, 0.2);
  --card-freeform-bg: #0A1A14;
  --card-freeform-edge: #1A0A2E;
}
```

---

## 3. Navbar

Replace the inline auth banner with a persistent top navbar. The auth banner inline on the page is removed.

### Dimensions and position

```css
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-4);
  background: rgba(10, 26, 20, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
```

### Layout

```
[ Logo (24px icon) ]                                [ Auth state ]
```

Left side: `<Logo size={24} variant="icon" />` -- the mark only, no wordmark.

Right side depends on auth state:

### Auth state: Unauthenticated (not guest)

```jsx
<Link href="/auth" className="navbar-signin">
  Sign in
</Link>
```

```css
.navbar-signin {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--accent);
  text-decoration: none;
  padding: var(--space-1) var(--space-3);
  border: 1px solid rgba(232, 135, 30, 0.4);
  border-radius: var(--radius-full);
  transition: background var(--dur-fast) var(--ease-out),
              border-color var(--dur-fast) var(--ease-out);
  min-height: 32px;
  display: flex;
  align-items: center;
}

.navbar-signin:hover {
  background: rgba(232, 135, 30, 0.1);
  border-color: rgba(232, 135, 30, 0.6);
}
```

### Auth state: Guest mode

```jsx
<Link href="/auth" className="navbar-save">
  Save progress
</Link>
```

```css
.navbar-save {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--text-3);
  text-decoration: none;
  padding: var(--space-1) var(--space-3);
  transition: color var(--dur-fast) var(--ease-out);
}

.navbar-save:hover {
  color: var(--text-2);
}
```

### Auth state: Authenticated

A user avatar circle with the level color as a ring.

```jsx
<Link href="/profile" className="navbar-avatar">
  <span className="navbar-avatar-initial">
    {displayName?.charAt(0)?.toUpperCase() || 'S'}
  </span>
</Link>
```

```css
.navbar-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-3);
  /* Level color ring: 2px ring using box-shadow */
  box-shadow: 0 0 0 2px var(--level-color, var(--level-shishya));
  text-decoration: none;
  transition: box-shadow var(--dur-fast) var(--ease-out);
}

.navbar-avatar:hover {
  box-shadow: 0 0 0 2px var(--level-color, var(--level-shishya)),
              0 0 8px rgba(232, 135, 30, 0.15);
}

.navbar-avatar-initial {
  font-family: var(--font-serif);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text);
  line-height: 1;
}
```

The `--level-color` variable should be set based on the user's current level:
- Shishya: `#0A1A14` (barely visible ring -- intentional, the beginner is in darkness)
- Sadhaka: `#2D6A4F` (forest green ring)
- Varistha: `#1E3A5F` (lapis ring)
- Guru: `#D4AF37` (gold ring)

### Page padding adjustment

Because the navbar is `position: fixed`, the page content needs top padding:

```css
.page {
  padding-top: calc(48px + var(--space-6)); /* navbar height + original top padding */
}
```

### New token

```css
:root {
  --navbar-height: 48px;
  --navbar-bg: rgba(10, 26, 20, 0.85);
  --navbar-border: rgba(255, 255, 255, 0.08);
}
```

### Component location

Create: `frontend/app/components/Navbar.tsx`
Import into: `frontend/app/layout.tsx` (so it appears on all pages)

---

## 4. Freeform Card -- "Enter the Void"

The Freeform card is fundamentally different from the four journey cards. It breaks the grid. It is a portal, not a selection.

### Layout

The four journey cards remain in their 2x2 grid (desktop) / 1-column stack (mobile). The Freeform card sits BELOW the grid, spanning the full width of the content area.

```css
.freeformCard {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  max-width: var(--max-width);
  aspect-ratio: 16 / 7;   /* Wider than tall. A landscape portal. */
  min-height: 160px;
  margin-top: var(--space-6);
  padding: var(--space-8) var(--space-6);
  border-radius: var(--radius-xl);
  border: none;            /* No border. Bleeds into the void. */
  cursor: pointer;
  position: relative;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
}
```

### Background -- The shifting void

A radial gradient that slowly rotates, giving the card a living, breathing quality. Like oil on dark water, or the night sky seen through a slowly turning telescope.

```css
.freeformCard {
  background:
    radial-gradient(
      ellipse 120% 100% at 50% 50%,
      #0A1A14 0%,
      #0D0D1A 30%,
      #1A0A2E 70%,
      #0A1A14 100%
    );
  background-size: 200% 200%;
  animation: freeformShift 30s ease-in-out infinite;
}

@keyframes freeformShift {
  0%   { background-position: 0% 50%; }
  25%  { background-position: 50% 0%; }
  50%  { background-position: 100% 50%; }
  75%  { background-position: 50% 100%; }
  100% { background-position: 0% 50%; }
}
```

Colors in the gradient:
- `#0A1A14` -- Deep Malachite (the app's night)
- `#0D0D1A` -- Deep Indigo (the briefing says "the sky before first light")
- `#1A0A2E` -- Deep violet (a note of mystery, the freeform's unique color)

### Edge treatment

Instead of a border, a very faint outer glow that makes the card feel like it emits rather than contains:

```css
.freeformCard::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(139, 92, 246, 0.08) 0%,     /* Violet hint */
    transparent 30%,
    transparent 70%,
    rgba(59, 130, 246, 0.06) 100%     /* Sapphire hint */
  );
  pointer-events: none;
  z-index: 0;
}
```

### Text treatment

The text inside the Freeform card has more breathing room. Slightly larger letter-spacing on the title. The subtitle ("No goals. No exercises. Just you and the raga.") pulses very subtly -- a slow opacity oscillation.

```css
.freeformName {
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  font-weight: var(--weight-light);  /* Lighter than journey cards */
  color: var(--text);
  letter-spacing: var(--tracking-wide);
  position: relative;
  z-index: 1;
}

.freeformSanskrit {
  font-family: var(--font-serif);
  font-size: var(--text-sm);
  font-weight: var(--weight-light);
  color: rgba(139, 92, 246, 0.5);  /* Violet-tinted */
  font-style: italic;
  position: relative;
  z-index: 1;
}

.freeformDescription {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--text-3);
  line-height: var(--leading-relaxed);
  animation: freeformBreathe 6s ease-in-out infinite;
  position: relative;
  z-index: 1;
}

@keyframes freeformBreathe {
  0%, 100% { opacity: 0.5; }
  50%      { opacity: 0.8; }
}
```

### No jali on freeform

The Freeform card does NOT have the jali `::before` overlay. It is outside the structured world. Pure void.

### Freeform unique color tokens

```css
:root {
  --freeform-indigo: #0D0D1A;
  --freeform-violet: #1A0A2E;
  --freeform-violet-accent: rgba(139, 92, 246, 0.5);
  --freeform-sapphire-accent: rgba(59, 130, 246, 0.4);
}
```

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .freeformCard {
    animation: none;
    background-position: 50% 50%;
  }
  .freeformDescription {
    animation: none;
    opacity: 0.7;
  }
}
```

---

## 5. Micro-Interaction Spec

### Journey cards (Beginner, Explorer, Scholar, Master)

**Page-load arrival:**

All four journey cards stagger in using the Tanpura Release spring (stiffness 400, damping 15). Order: Beginner first, then Explorer, then Scholar, then Master. Stagger delay: 80ms between each. Initial state: `opacity: 0, y: 24px`. Final state: `opacity: 1, y: 0`.

The Freeform card arrives LAST, 200ms after the Master card, using the same spring.

Framer Motion config:

```tsx
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,  // 80ms between cards
      delayChildren: 0.15,    // 150ms before first card (let navbar settle)
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
    },
  },
};

// Freeform arrives after grid
const freeformVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
      delay: 0.15 + (4 * 0.08) + 0.12,  // after 4 cards + 120ms extra pause
    },
  },
};
```

**Hover state (accessible cards only):**

Spring preset: Andolan (stiffness 120, damping 8).

Visual changes on hover:
- `scale: 1.015` (1.5% -- subtle, not bouncy)
- `translateY: -2px` (slight lift)
- Border brightens: opacity of border color increases by ~0.15
- A faint inner glow appears matching the card's accent color
- Jali opacity increases by 0.02 (from baseline)
- Transition: `var(--dur-fast)` (150ms)

```css
.journeyCard--beginner:hover {
  transform: translateY(-2px) scale(1.015);
  border-color: rgba(232, 135, 30, 0.35);
  box-shadow: inset 0 0 30px rgba(232, 135, 30, 0.04);
}

.journeyCard--explorer:hover {
  transform: translateY(-2px) scale(1.015);
  border-color: rgba(45, 106, 79, 0.4);
  box-shadow: inset 0 0 30px rgba(92, 158, 110, 0.04);
}
```

Scholar and Master are locked -- no hover transform. But they DO get a subtle glow on hover to feel alive:

```css
.journeyCard--scholar:hover {
  box-shadow: inset 0 0 40px rgba(30, 58, 95, 0.06);
}

.journeyCard--master:hover {
  box-shadow: inset 0 0 40px rgba(212, 175, 55, 0.04);
}
```

**Press/tap state (accessible cards only):**

Spring preset: Kan (stiffness 1000, damping 30). Instantaneous.

Visual changes on active/press:
- `scale: 0.98` (2% shrink -- feels like pressing into the card)
- `translateY: 0` (removes the hover lift)
- Border brightens further
- Duration: instant -- Kan spring resolves in <50ms

```css
.journeyCard--beginner:active {
  transform: scale(0.98);
  border-color: rgba(232, 135, 30, 0.5);
}

.journeyCard--explorer:active {
  transform: scale(0.98);
  border-color: rgba(45, 106, 79, 0.5);
}
```

**Freeform card hover:**

Different from journey cards. The void responds differently.

- Background gradient animation speeds up on hover: from 30s to 12s (transition the animation-duration)
- The outer glow `::after` brightens: violet opacity goes from 0.08 to 0.15
- Text description opacity shifts from breathing (0.5-0.8) to steady 0.9
- `scale: 1.01` (barely perceptible -- the void stretches)

```css
.freeformCard:hover {
  animation-duration: 12s;
  transform: scale(1.01);
}

.freeformCard:hover::after {
  background: linear-gradient(
    135deg,
    rgba(139, 92, 246, 0.15) 0%,
    transparent 30%,
    transparent 70%,
    rgba(59, 130, 246, 0.12) 100%
  );
}

.freeformCard:hover .freeformDescription {
  animation: none;
  opacity: 0.9;
}
```

**Freeform card press:**

- `scale: 0.99` (the void contracts slightly)
- Gradient pauses momentarily (animation-play-state: paused)

```css
.freeformCard:active {
  transform: scale(0.99);
  animation-play-state: paused;
}
```

---

## 6. Summary of All New CSS Tokens

Add these to `frontend/app/styles/tokens.css` under `:root`:

```css
/* -- Canvas texture -------------------------------------------------- */
--canvas-pattern-opacity: 0.035;
--canvas-grain-opacity: 0.02;
--canvas-vignette-outer: rgba(0, 0, 0, 0.35);
--canvas-pattern-size: 120px;

/* -- Navbar ---------------------------------------------------------- */
--navbar-height: 48px;
--navbar-bg: rgba(10, 26, 20, 0.85);
--navbar-border: rgba(255, 255, 255, 0.08);

/* -- Journey card palettes ------------------------------------------- */
--card-beginner-bg: #0A1A14;
--card-beginner-border: rgba(232, 135, 30, 0.2);
--card-explorer-bg: #132E22;
--card-explorer-accent: #5C9E6E;
--card-explorer-border: rgba(45, 106, 79, 0.25);
--card-scholar-bg: #142235;
--card-scholar-border: rgba(212, 175, 55, 0.15);
--card-master-bg: #1A1608;
--card-master-border: rgba(212, 175, 55, 0.2);

/* -- Freeform card --------------------------------------------------- */
--card-freeform-bg: #0A1A14;
--card-freeform-edge: #1A0A2E;
--freeform-indigo: #0D0D1A;
--freeform-violet: #1A0A2E;
--freeform-violet-accent: rgba(139, 92, 246, 0.5);
--freeform-sapphire-accent: rgba(59, 130, 246, 0.4);
```

---

## 7. Files to Create or Modify

| File | Action |
|------|--------|
| `frontend/app/styles/tokens.css` | Add new tokens (section 6). Add body::before and body::after for canvas texture layers. |
| `frontend/app/styles/home.module.css` | Major rewrite: per-card classes, freeform overhaul, remove .journeyCardLocked opacity rule, add vignette, add freeform animations, add hover/press states. |
| `frontend/app/components/Navbar.tsx` | NEW FILE. Persistent navbar with auth state. |
| `frontend/app/layout.tsx` | Import and render Navbar. |
| `frontend/app/page.tsx` | Remove inline auth banner. Add per-journey CSS class to each card. Update Freeform card markup. |

---

## 8. Day Mode Considerations

All specs above are night mode (default). For day mode (`[data-theme="day"]`):

- Canvas texture layers: invert stroke color to near-black, same opacities
- Navbar: `rgba(245, 240, 232, 0.85)` bg, `rgba(0, 0, 0, 0.08)` border
- Journey cards: lighter versions of each palette (use `--bg-2` base, lighter gradients)
- Freeform: gradient shifts to warm ivories with a deep rose-violet center

Day mode specifics should be addressed in a follow-up pass. Night mode is the default and the priority. Ship night mode first.

---

## 9. Accessibility Notes

- Navbar: all interactive elements meet 44px touch target (the 32px avatar has enough padding in its parent)
- Journey cards: all cards that are links meet focus-visible specs (2px solid accent, 2px offset)
- Locked cards: `aria-disabled="true"` instead of `pointer-events: none` alone. The card should be focusable (so screen readers announce it) but not activatable
- Freeform animations: all collapse to static under `prefers-reduced-motion: reduce`
- Canvas texture: purely decorative, no semantic content. `aria-hidden` is implicit (pseudo-elements)

---

APPROVED: brand-director, 2026-04-12
NEXT: frontend-builder executes. All design decisions are final. No ambiguity remains.
