# Sādhanā — Agent Team

Last updated: 2026-04-19 (rev 4 — Opus 4.7 pass)

## Org Structure

```
CEO (Aacrit)
  └── COO (sadhana-coo)
        ├── Quality Division ——————— "Nothing ships with wrong theory"
        │   ├── raga-scholar          Hindustani theory correctness (read-only)
        │   ├── theory-auditor        Cross-tradition / Western-bridge validation (read-only)
        │   ├── progress-analyst      Learning data, pitch accuracy analytics (read-only)
        │   ├── uat-tester            Browser UAT, voice pipeline, accessibility (read-only)
        │   └── frontend-fixer        Root-cause UI bug fixes (read+write)
        │
        ├── Infrastructure Division — "The system teaches itself"
        │   ├── db-reviewer           Schema quality, migration audits (read-only)
        │   ├── update-docs           Auto-sync docs — runs after EVERY session with changes
        │   └── perf-optimizer        Audio latency, 60fps animations, bundle size
        │
        ├── Music Team ————————————— "Sound before label — always"
        │   ├── music-director        HCM authority, raga curation, voice curriculum
        │   ├── acoustics-engineer    Frequency science, just intonation, pitch calibration
        │   └── audio-engineer        Voice pipeline (RNNoise+Pitchy), Tone.js, Tantri audio layer
        │
        ├── Curriculum Division ————— "Every session earns its 15 minutes"
        │   ├── curriculum-designer   Learning path architecture, YAML lesson structure
        │   └── lesson-writer         Exercise copy, Presence Rule, theory notes
        │
        ├── Frontend Division ———————— "Cinematic. Responsive. Zero compromise."
        │   ├── frontend-builder      Component engineering, Tantri integration, gamification UI
        │   ├── brand-director        Logo, visual language, Tantri visual tokens, design system
        │   └── icon-creator          Raga/tala/nav icon systems, display typeface, PWA icons
        │
        ├── Product Division ————————— "Every release moves the needle"
        │   └── ceo-advisor           Strategic product recommendations (read-only)
        │
        └── Security & Agents ————————
            ├── sadhana-ciso          Security audit (read-only)
            └── agent-architect       Agent design, audit, and optimization
```

(Note: `raga-scholar` serves both the Quality Division and the Music Team — it's the Hindustani truth-keeper for theory audits and musicological validation alike. `frontend-fixer` reports operationally into Quality when remediating UAT findings but works inside Frontend tooling.)

## Full Agent Roster

| Agent | Division | Model | R/W | Trigger |
|-------|----------|-------|-----|---------|
| `sadhana-coo` | Lead | claude-opus-4-7 | R+W | Auto on significant changes / manual |
| `agent-architect` | Agent Eng | claude-opus-4-7 | R+W | Manual — agent design/audit |
| `music-director` | Music Team | claude-opus-4-7 | R+W | Before any new raga or voice curriculum |
| `raga-scholar` | Quality / Music | claude-opus-4-7 | R only | Before any Hindustani content ships |
| `acoustics-engineer` | Music Team | claude-opus-4-7 | R+W | Frequency tables, pitch calibration |
| `audio-engineer` | Music Team | claude-opus-4-7 | R+W | Voice pipeline, Tone.js, synthesis bugs |
| `curriculum-designer` | Curriculum | claude-opus-4-7 | R+W | New lessons, track restructuring |
| `theory-auditor` | Quality | claude-opus-4-7 | R only | Cross-tradition / Western-bridge theory validation |
| `ceo-advisor` | Product | claude-opus-4-7 | R only | Manual strategic review |
| `sadhana-ciso` | Security | claude-opus-4-7 | R only | Manual / before launch |
| `lesson-writer` | Curriculum | claude-sonnet-4-6 | R+W | After raga-scholar / theory-auditor clear content |
| `frontend-builder` | Frontend | claude-sonnet-4-6 | R+W | New components, gamification UI |
| `frontend-fixer` | Frontend | claude-sonnet-4-6 | R+W | After UAT failures |
| `brand-director` | Frontend | claude-sonnet-4-6 | R+W | Logo, visual language, design tokens |
| `icon-creator` | Frontend | claude-sonnet-4-6 | R+W | Icon design, raga iconography, tala visuals, PWA icons, display typeface |
| `uat-tester` | Quality | claude-sonnet-4-6 | R only | After every build |
| `progress-analyst` | Quality | claude-sonnet-4-6 | R only | After data accumulates / manual |
| `db-reviewer` | Infrastructure | claude-sonnet-4-6 | R only | After migrations |
| `perf-optimizer` | Infrastructure | claude-sonnet-4-6 | R+W | Latency issues / manual |
| `update-docs` | Infrastructure | claude-haiku-4-5 | R+W | After EVERY session with changes |

## Model Tier Rationale

All agents run on Claude Max CLI ($0). Model tier matches the cognitive work the agent actually does.

| Tier | Agents | Why this tier |
|------|--------|---------------|
| **Opus 4.7** (10) | `sadhana-coo`, `agent-architect`, `music-director`, `raga-scholar`, `acoustics-engineer`, `audio-engineer`, `curriculum-designer`, `theory-auditor`, `ceo-advisor`, `sadhana-ciso` | Deep reasoning, multi-step synthesis, cross-domain judgment, or adversarial threat modeling. Orchestration (COO) now Opus because it routes work across 6 divisions and must reason about dependencies and blast radius. |
| **Sonnet 4.6** (8) | `lesson-writer`, `frontend-builder`, `frontend-fixer`, `brand-director`, `icon-creator`, `uat-tester`, `progress-analyst`, `db-reviewer`, `perf-optimizer` | Well-scoped engineering or authoring against an explicit spec. The hard thinking happens upstream (music-director, curriculum-designer, brand-director brief → builders execute). Anything load-bearing and judgement-heavy in these seats gets kicked back upstream. |
| **Haiku 4.5** (1) | `update-docs` | Narrow mechanical sync: diff commit log, find stale facts in `docs/*.md`, patch. No reasoning required beyond pattern matching. |

*Note*: `brand-director` was downgraded from Opus — locked design decisions, fixed Ragamala tokens, and a clear spec mean the work is token/color/motion engineering, not open-ended aesthetic judgement. If it ever needs to invent a new design system, CEO should temporarily re-tier it.

## Sequential Cycles

| Cycle | Sequence | Trigger |
|-------|---------|---------|
| **Engine Build** | acoustics-engineer → audio-engineer → raga-scholar (validate) → `npm run test:engine` | New engine feature |
| **Lesson Ship** | music-director → curriculum-designer (Tantri modes) → raga-scholar + theory-auditor + acoustics-engineer (∥) → lesson-writer → frontend-builder (Tantri integration) + audio-engineer (∥) → uat-tester (Tantri suite) → frontend-fixer | New lesson |
| **Frontend Ship** | frontend-builder → uat-tester (incl. Tantri suite) → frontend-fixer | Non-lesson UI change |
| **Raga Audit** | raga-scholar → lesson-writer → raga-scholar (recheck) | Content release |
| **Voice QA** | acoustics-engineer → audio-engineer (Tantri audio layer) → uat-tester (Tantri suite) | Voice pipeline changes |
| **Brand Cycle** | brand-director (Tantri tokens) → icon-creator → frontend-builder → uat-tester | Brand/visual identity work |
| **Icon Cycle** | brand-director (approve) → icon-creator → frontend-builder (integrate) → uat-tester | New icon sets, display typeface, PWA icons |
| **Tantri QA** | audio-engineer (engine) → perf-optimizer (canvas fps) → uat-tester (Tantri suite) → frontend-fixer | Tantri changes |
| **Quality Cycle** | progress-analyst → curriculum-designer → raga-scholar | Data-driven curriculum update |

(∥) = parallel safe

## Parallel-Safe Agents (Read-Only)

raga-scholar, theory-auditor, progress-analyst, db-reviewer, sadhana-ciso, ceo-advisor, uat-tester

(`perf-optimizer` is read+write, so it is NOT parallel-safe by default.)

## $0 Cost Policy (HARD CONSTRAINT)

**$0.00 end-to-end operational cost.** All agent work: Claude Max CLI only. No paid APIs. No paid services. Every feature must be achievable with: Supabase free tier + Vercel hobby + GitHub Actions + GitHub Pages + client-side WASM/JS.

Claude Haiku 4.5 API is only permitted for student-facing adaptive hints (paid per-use, budgeted separately), never for agent operations.

## Skills (Slash Commands)

| Skill | Purpose |
|-------|---------|
| `/lesson-ship` | Full lesson quality gate — 5 stages from design to UAT |
| `/frontend-ship` | UI quality gate — build → UAT → fix |
| `/theory-audit` | Full curriculum theory validation cycle (Hindustani + cross-tradition) |

## Auto-Update Protocol

`update-docs` MUST run at the end of every session where any of the following changed:
- Curriculum content (YAML files)
- Database schema (migrations)
- Frontend components (component inventory)
- Agents or skills
- Design decisions or locked decisions

This ensures CLAUDE.md and all `docs/*.md` reflect current state at the start of every future session.
