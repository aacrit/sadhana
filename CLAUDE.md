# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Sādhanā

Last updated: 2026-04-11 (rev 3)

> Sanskrit: sādhanā (साधना) — disciplined practice toward mastery. Not learning about music. Becoming it.

---

## THE CORE PHILOSOPHY

# THE ENGINE IS MUSIC. MUSIC IS THE ENGINE.

This is not a music learning app that uses audio. This is a **music physics engine** — the equivalent of NVIDIA PhysX, but for sound. The engine does not imitate music. It does not simulate music. **IT IS MUSIC.**

Every frequency ratio, every shruti, every raga's grammar, every tala's pulse, every overtone in a tanpura string — **all exist as first-class code objects with mathematical precision.** A musicologist opening the source code should find it as complete and rigorous as a textbook. A beginner should be astonished by what it makes possible. A master musician should recognize it as correct.

The journeys (Beginner / Explorer / Scholar / Master) are interfaces layered on top of the engine. They are not the app. **The engine is the app.**

---

## Quick Reference

| Working on... | Read |
|---------------|------|
| The engine — ragas, swaras, talas, physics | `docs/ENGINE.md` |
| Journey interfaces (Beginner, Explorer, Scholar, Master) | `docs/JOURNEYS.md` |
| Frontend design, cinematic UI, gamification | `docs/DESIGN-SYSTEM.md` |
| Voice pipeline (pitch detection, denoising, accuracy) | `docs/AUDIO-ENGINE.md` |
| Music team standards, raga database, frequency science | `docs/MUSIC-TEAM.md` |
| Agents, workflows, slash commands | `docs/AGENT-TEAM.md` |
| Database schema | `docs/DATABASE.md` |

---

## The Engine — What It Contains

The engine lives at `/engine/`. It is a comprehensive, musicologically rigorous TypeScript library. It has zero UI. It has no opinions about who is using it. It IS music.

```
engine/
├── physics/
│   ├── harmonics.ts          # Harmonic series mathematics. Overtone ratios.
│   │                         # Why Sa+Pa+Sa creates the tanpura reference drone.
│   │                         # String vibration modes, node positions, partial amplitudes.
│   ├── resonance.ts          # Acoustic resonance. Why certain intervals feel stable.
│   │                         # Helmholtz consonance theory. Critical band roughness.
│   └── just-intonation.ts    # All 22 shrutis with exact frequency ratios.
│                             # Every swara's position in the harmonic series.
│                             # Deviation from equal temperament in cents, per swara.
│
├── theory/
│   ├── swaras.ts             # All 12 swaras (7 shuddha + 5 vikrit).
│   │                         # Each: Sanskrit name, ratio, cents, harmonic position,
│   │                         # alternate names, Western note equivalents (bridges only).
│   ├── shrutis.ts            # All 22 shrutis. Ancient tuning system as code.
│   │                         # Ratios from Natya Shastra. Deviation from 12-TET.
│   │                         # Which raga uses which shruti variant.
│   ├── ragas/                # One file per raga. Each file is a complete musicological object.
│   │   ├── bhairav.ts        # Aroha, avaroha, vadi, samvadi, jati, thaat, time, rasa,
│   │   ├── yaman.ts          # pakad (characteristic phrases), characteristic ornaments,
│   │   ├── bhoopali.ts       # common bandish, related ragas, forbidden swaras,
│   │   ├── bhimpalasi.ts     # allowed modulations, emotional description,
│   │   └── ...               # notes on gharana variations.
│   ├── ragas.ts              # Raga registry. Query: getRagasByTime(), getRagasByRasa(),
│   │                         # getRagasBySwaraCount(), getRagasUsingSwara(swara).
│   ├── thaats.ts             # 10 Bhatkhande thaats. Parent-scale relationships.
│   ├── talas/                # One file per tala. Complete rhythmic structure.
│   │   ├── teentaal.ts       # 16 beats. 4 vibhags (4+4+4+4). Sam at 1, khali at 9.
│   │   ├── ektaal.ts         # 12 beats. Sam, khali, vibhag structure. Theka.
│   │   ├── jhaptaal.ts       # 10 beats. 2+3+2+3.
│   │   └── rupak.ts          # 7 beats. Unusual — sam is khali.
│   └── ornaments.ts          # Meend (glide), gamak (oscillation), andolan (subtle shake),
│                             # murki (fast ornament), khatka, zamzama — each with
│                             # mathematical description: frequency trajectory, duration,
│                             # amplitude envelope, target swara, raga contexts.
│
├── analysis/
│   ├── raga-grammar.ts       # Given a sequence of notes: is it valid in raga X?
│   │                         # Validates aroha/avaroha rules, forbidden swara usage,
│   │                         # vadi emphasis, characteristic phrase recognition.
│   ├── pitch-mapping.ts      # Hz → swara → cents deviation (context-aware).
│   │                         # Knows komal Re in Bhairav is different from komal Re in Kafi.
│   │                         # Accounts for raga context when scoring pitch accuracy.
│   └── phrase-recognition.ts # Identifies pakad (characteristic phrase) in sung input.
│                             # Signals: "you just sang the pakad of Yaman."
│
├── synthesis/
│   ├── tanpura.ts            # Tanpura drone synthesis from first principles.
│   │                         # Not a sample. Mathematical overtone series.
│   │                         # Sa string: fundamental + 9 partials with natural decay.
│   │                         # Pa string: 3:2 ratio. Upper Sa string: 2:1 ratio.
│   ├── swara-voice.ts        # Individual swara synthesis with correct shruti frequency.
│   │                         # Tone.js PolySynth configured to just intonation.
│   └── tala-engine.ts        # Rhythmic pulse generator. Teentaal, Ektaal, etc.
│                             # Tabla sound events at correct beat positions.
│
└── voice/
    ├── pipeline.ts           # THE MOAT. Complete voice processing chain.
    │                         # AudioWorklet → RNNoise → Pitchy/McLeod → pitch-mapping
    │                         # → raga-grammar validation → accuracy scoring.
    ├── accuracy.ts           # Pitch accuracy model. Not just "are you on pitch?"
    │                         # "Are you on the right shruti of this raga, with the
    │                         # correct ornament, in the right context of the phrase?"
    └── feedback.ts           # What to show the student. Instant, beautiful, correct.
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  THE ENGINE  (/engine/)                                         │
│  Pure TypeScript. Zero UI. Zero dependencies except Tone.js.   │
│  IT IS MUSIC. Not a simulation of music. Music itself.          │
│                                                                 │
│  physics/ → theory/ → analysis/ → synthesis/ → voice/          │
└─────────────────────────────┬───────────────────────────────────┘
                              │  engine exposes typed API
┌─────────────────────────────▼───────────────────────────────────┐
│  JOURNEYS  (/frontend/app/journeys/)                            │
│  Four entry points. Same engine. Different interfaces.          │
│                                                                 │
│  Beginner ──────── guided daily riyaz, visual tanpura, XP      │
│  Explorer ──────── raga browser, phrase library, ear training  │
│  Scholar  ──────── full raga grammar, shruti analysis, theory  │
│  Master   ──────── composition, phrase generation, teaching    │
└─────────────────────────────┬───────────────────────────────────┘
                              │  React components
┌─────────────────────────────▼───────────────────────────────────┐
│  PRESENTATION  (/frontend/)                                     │
│  Next.js 15 / React 19 / TypeScript                             │
│  Framer Motion v12 · GSAP 3 · Three.js r170                     │
│  Design system: Ragamala                                         │
└─────────────────────────────┬───────────────────────────────────┘
                              │  Supabase JS
┌─────────────────────────────▼───────────────────────────────────┐
│  DATA  (Supabase — free tier — $0)                              │
│  Progress, sessions, voice attempts, streaks                    │
└─────────────────────────────────────────────────────────────────┘
```

**Total operational cost: $0.** No paid APIs. No paid inference. No paid audio. Everything that requires compute runs in the browser (AudioWorklet, WASM, Tone.js). Everything that requires storage uses Supabase free tier.

**Tech stack**: Next.js 15 / React 19 / TypeScript strict, Tone.js 15 (synthesis — just intonation tuned), RNNoise.js WASM (denoising — $0 browser), Pitchy/McLeod Pitch Method (pitch detection — $0 browser), Framer Motion v12 (spring physics), GSAP 3 (cinematic sequences), Three.js r170 (tanpura waveform visualization). Google Fonts: Cormorant Garamond / Noto Serif Devanagari / Inter / IBM Plex Mono.

---

## Design System — Ragamala

Named after the Ragamala tradition of Indian miniature painting: a garland of ragas, each given a visual world of color, mood, season, and time of day. The foundation is Dhrupad — austere, geometric, meditative, precise. Ragamala is its full flowering: the same rigor, now capable of shifting its entire color world in response to the raga being practiced. Full spec in `docs/DESIGN-SYSTEM.md`.

| Decision | Choice |
|----------|--------|
| Layout | Single-column practice. One thing at a time. |
| Typography | Cormorant Garamond (raga names, Sanskrit, titles) / Noto Serif Devanagari (Devanagari script, toggle-able) / Inter (UI) / IBM Plex Mono (frequencies, Hz, ratios, note data) |
| Accent | Saffron `#E8871E` — earned only. Correct pitch. Active streak. Never decorative. |
| Mastery | Gold `#D4AF37` — above Saffron. Guru level, raga mastered. Zarr-kashi only: hairline rules, single-point accents, never filled. |
| Night bg | Deep Malachite `#0A1A14` |
| Day bg | Ivory `#F5F0E8` |
| RAG | Correct `#22C55E` / In-progress `#F59E0B` / Needs-work `#EF4444` |
| Raga worlds | 5 raga-responsive color environments (Bhairav/Yaman/Bhoopali/Bhimpalasi/Bageshri) via `data-raga` attribute, 2400ms ink-diffusion transitions, grounded in Mewar/Bundi-Kota Ragamala painting tradition. |
| Logo | Four tanpura strings (overtone series) converging to a Sa point (saffron). Open arc behind them — 225°–315°, top quadrant missing (the practice still to come). SVG. 16px–200px. |
| Signature element | Reactive tanpura waveform (Three.js) — responds to student's voice in real time |
| Motion | Framer Motion spring (named ornament presets: Tanpura Release, Meend, Gamak, Andolan, Kan) + GSAP timelines (ceremonies) + Three.js (ambient) |
| Texture | Jali pattern (4% opacity on cards, full reveal on pakad), ink diffusion (raga world transitions), zarr-kashi (gold hairlines, Guru only) |
| Script toggle | Global Devanagari/romanized toggle, persisted to user profile. Default ON for Hindi/Marathi/Sanskrit users. |

**Level system**: Shishya (`#0A1A14`) → Sadhaka (`#2D6A4F`) → Varistha (`#1E3A5F`) → Guru (`#D4AF37`) — interface deepens invisibly, no announcements

---

## The Voice Pipeline — The Moat

```
Mic → AudioWorklet (off-thread) → RNNoise.js (denoise) →
Pitchy McLeod (Hz, <20ms) → just-intonation mapping →
raga-grammar context → cents deviation → visual feedback
```

Target: **<50ms mic-to-visual.** The student sings. The app answers immediately. In the context of the raga they are practicing. Not just "you're flat" — "you're 23 cents flat on Ga komal in Bhairav, which should be sung with andolan."

---

## Core Principles

- **THE ENGINE IS MUSIC. MUSIC IS THE ENGINE.** (above all else)
- **Audio Before Everything**: Every concept is heard before it is named. Every time.
- **Hindustani-First**: Rooted in HCM. Western equivalents are bridges, never the frame.
- **$0 End-to-End (HARD CONSTRAINT)**: No paid APIs. No paid services. Everything in the browser or Supabase free tier. Any feature requiring payment requires explicit CEO approval.
- **Journeys Serve the Engine**: User experience adapts. The engine never compromises.
- **Sādhanā Principle**: 5–15 min sessions. One new capability per session.

---

## Git & Dev

- **Always push to `claude/*` branches.** Auto-merge to main via CI.
- **Always commit AND push after every task.** Never wait to be asked.
- **Before every push:** `git fetch origin main && git merge origin/main --no-edit`
- Git: `aacrit@gmail.com` / `Aacrit` / GitHub: `aacrit/sadhana`
- Supabase: same account as void-news + dondeAI (`aacrit@gmail.com`)
- Node 18+, TypeScript strict.

## Dev Commands

```bash
npm run dev          # Next.js dev server
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run engine unit tests (theory correctness is testable)
npm run test:engine  # Test engine only — raga grammar, frequency ratios, tala structure
```

---

## Agent Routing

| Task | Agent |
|------|-------|
| Engine architecture, raga objects, tala structures, voice pipeline | `audio-engineer` |
| Frequency ratios, shruti science, pitch calibration | `acoustics-engineer` |
| Raga knowledge, musicological accuracy, cultural framing | `music-director` + `raga-scholar` |
| Validate raga objects in code against tradition | `raga-scholar` |
| Journey UX design, gamification, level system | `frontend-builder` |
| Visual identity, logo, Ragamala design system | `brand-director` |
| Icon design, raga/tala/nav icons, display typeface, PWA icons | `icon-creator` |
| Lesson content, exercise copy, Presence Rule | `lesson-writer` |
| Learning paths, raga curriculum sequence | `curriculum-designer` |
| Schema, migrations, progress data | `db-reviewer` |
| Pitch accuracy analytics, journey performance | `progress-analyst` |
| UI bugs, animation, mode issues | `frontend-fixer` |
| Security | `sadhana-ciso` |
| Docs sync (MUST run at session end) | `update-docs` |
| Orchestrate everything | `sadhana-coo` |
| Agent design | `agent-architect` |
| Strategy | `ceo-advisor` |

---

## Sequential Cycles

| Cycle | Sequence |
|-------|---------|
| **Engine Build** | acoustics-engineer → audio-engineer → raga-scholar (validate) → unit tests |
| **Lesson Ship** | music-director → curriculum-designer → raga-scholar + acoustics-engineer (∥) → lesson-writer → frontend-builder + audio-engineer (∥) → uat-tester |
| **Frontend Ship** | frontend-builder → uat-tester → frontend-fixer |
| **Voice QA** | acoustics-engineer → audio-engineer → uat-tester |
| **Brand Cycle** | brand-director → icon-creator → frontend-builder → uat-tester |
| **Icon Cycle** | brand-director (approve) → icon-creator → frontend-builder (integrate) → uat-tester |

---

## Auto-Update Protocol (Mandatory)

`update-docs` runs at the end of **every session** where engine code, curriculum content, schema, components, agents, or design decisions changed. This file and all `docs/*.md` must reflect current state before the session ends. The Stop hook fires a reminder automatically.

---

## Locked Decisions (CEO Approval Required)

Engine-first architecture, Hindustani-first framing, Ragamala design system, $0 constraint, audio-first pedagogy, McLeod Pitch Method + RNNoise voice pipeline, Supabase data layer, Framer Motion + GSAP + Three.js animation stack, Claude Max CLI only for agent work.

**Level System (locked — D+B):**
- Levels unlocked by specific musical acts, not XP. Examples: "Sing Bhairav's pakad within ±20 cents across 3 separate sessions" → Sadhaka. Engine validates. Cannot be gamed.
- When unlocked: no popup, no confetti. Interface deepens invisibly (B). Cents needle appears by default. New raga tabs surface. Tanpura gains a second voice. Student notices one day — that's the ceremony.
- XP tracks consistency only (streak maintenance, sessions completed). It is the practice log, not the grade.
- v1 ships with B (gradual deepening). Mastery gates (D) designed now, enforced from v1.1.

**v1 Scope (locked):**
- Full engine (`/engine/`) — all physics, theory, analysis, synthesis, voice modules. Tested. Correct.
- All four journeys exist as entry points from day one — shows the full vision immediately.
- Beginner journey: fully built. Daily riyaz, Sa detection, voice visualization (3 layers), 5 ragas (Bhairav/Bhoopali/Bhimpalasi/Yaman/Bageshri), Shishya levels 1–3.
- Explorer journey: partially built. Raga browser, ear training exercises, phrase library.
- Scholar + Master journeys: skeleton/placeholder — visible, navigable, locked behind level gate with "coming soon" depth. Students can see where they're going.
- Signature "wow" feature (Scholar engine, surfaced to all): raga phrase recognition. When the student sings the pakad (characteristic phrase) of their current raga, the app recognizes it: "You just sang the pakad of Yaman." No action required. The engine noticed. Bridges Beginner and Scholar in one unrepeatable moment.

**Daily Session Loop (locked):**
- On open: app has already prepared today's riyaz. Raga chosen by time of day (dawn → Bhairav, afternoon → Bhimpalasi, dusk → Bhoopali, evening → Yaman, night → Bageshri). Tanpura begins. Student sings. ~10 minutes. Zero decisions required.
- On completion: transitions directly to free practice (student picks raga, exercise, or exploration). No friction between ritual and freedom.
- If app is opened mid-day and riyaz is already done: goes straight to free practice.

**Sa Reference Pitch (locked):** Auto-detect from voice. Onboarding asks student to say/sing "Sa" 3–5 times. Engine averages Pitchy detections → proposes "Your Sa is G3 (196 Hz) — does that feel right?" Student confirms or adjusts. If skipped: defaults to C4 (261.63 Hz). Sa is stored in user profile and used as the root for all frequency calculations across the entire engine.

**Pakad Recognition Moment (locked — 2-layer cinematic):**
- Layer 1 — Cinematic pause (~4s): tanpura continues uninterrupted. Background deepens to full indigo. Raga name appears large in Cormorant Garamond, center screen. Below it: the phrase in sargam notation (Ni Re Ga Ma Ga Re Sa). Fades slowly. GSAP timeline. Unrepeatable feeling.
- Layer 2 — Settles: the subtle text "You just sang the pakad of Yaman" remains at the bottom as a quiet record. Fades to 40% opacity. Stays for the rest of the session.
- Tanpura never stops. Practice continues through it.

**Voice Feedback Visualization (locked — 3 layers):**
- Layer 1 (ambient, always present): Live voice waveform alongside tanpura waveform. In tune = waves align. Off pitch = divergence. Three.js, reacts in real time.
- Layer 2 (primary interaction): Target swara as a glowing circle. Student's pitch as a moving dot with a trail. Dot reaches circle = correct. Cinematic, physical, intuitive.
- Layer 3 (precision detail, tap to reveal): Cents needle (−50 to +50). Shows exact deviation. Varistha/Guru journeys surface this by default; Beginner/Explorer on-demand.

---

## Project Structure

```
Sādhanā/
├── engine/                   # THE MUSIC ENGINE — pure TypeScript, zero UI
│   ├── physics/              # Harmonics, resonance, just intonation
│   ├── theory/               # Swaras, shrutis, ragas/, thaats, talas/, ornaments
│   ├── analysis/             # Raga grammar, pitch mapping, phrase recognition
│   ├── synthesis/            # Tanpura, swara voices, tala pulse
│   └── voice/                # Pipeline, accuracy, feedback
├── frontend/
│   ├── app/
│   │   ├── journeys/         # Beginner / Explorer / Scholar / Master entry points
│   │   ├── components/       # Shared: PracticeSession, VoiceFeedback, TanpuraViz...
│   │   ├── lib/              # Supabase client, types
│   │   ├── three/            # Three.js tanpura waveform scene
│   │   └── styles/           # tokens.css (Ragamala design tokens)
│   └── next.config.ts
├── content/curriculum/       # YAML journey definitions
├── supabase/migrations/
├── .github/workflows/
├── .claude/agents/           # 20 agents
├── .claude/skills/           # /lesson-ship /frontend-ship /theory-audit
└── docs/
    ├── ENGINE.md             # Engine architecture, API reference
    ├── JOURNEYS.md           # Journey UX specs
    ├── DESIGN-SYSTEM.md      # Ragamala — tokens, motion grammar, logo, raga color worlds
    ├── AUDIO-ENGINE.md       # Voice pipeline, Tone.js patterns, frequency tables
    ├── MUSIC-TEAM.md         # Raga database standards, shruti science, cultural guidelines
    ├── AGENT-TEAM.md         # Agent roster, cycles, cost policy
    └── DATABASE.md           # Schema reference
```
