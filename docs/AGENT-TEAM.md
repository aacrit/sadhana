# Sādhanā — Agent Team

Last updated: 2026-04-11 (rev 2)

## Org Structure

```
CEO (Aacrit)
  └── COO (sadhana-coo)
        ├── Quality Division ——————— "Nothing ships with wrong theory"
        │   ├── raga-scholar          Hindustani theory correctness (read-only)
        │   ├── theory-auditor        General music theory validation (read-only)
        │   ├── progress-analyst      Learning data, pitch accuracy analytics (read-only)
        │   ├── bug-fixer             Root-cause bug fixes
        │   └── uat-tester            Browser UAT, voice pipeline, accessibility (read-only)
        │
        ├── Infrastructure Division — "The system teaches itself"
        │   ├── db-reviewer           Schema quality, migration audits (read-only)
        │   ├── update-docs           Auto-sync docs — runs after EVERY session with changes
        │   └── perf-optimizer        Audio latency, 60fps animations, bundle size
        │
        ├── Music Team ————————————— "Sound before label — always"
        │   ├── music-director        HCM authority, raga curation, voice curriculum
        │   ├── raga-scholar          Musicological validation (read-only)
        │   ├── acoustics-engineer    Frequency science, just intonation, pitch calibration
        │   └── audio-engineer        Voice pipeline (RNNoise+Pitchy), Tone.js, synthesis
        │
        ├── Curriculum Division ————— "Every session earns its 15 minutes"
        │   ├── curriculum-designer   Learning path architecture, YAML lesson structure
        │   └── lesson-writer         Exercise copy, Presence Rule, theory notes
        │
        ├── Frontend Division ———————— "Cinematic. Responsive. Zero compromise."
        │   ├── frontend-builder      Component engineering, gamification UI, Three.js scenes
        │   ├── frontend-fixer        UI bug remediation, mode consistency
        │   ├── brand-director        Logo, visual language, design system, motion personality
        │   └── icon-creator          Raga/tala/nav icon systems, display typeface, PWA icons
        │
        ├── Product Division ————————— "Every release moves the needle"
        │   └── ceo-advisor           Strategic product recommendations (read-only)
        │
        └── Security & Agents ————————
            ├── sadhana-ciso          Security audit (read-only)
            └── agent-architect       Agent design, audit, and optimization
```

## Full Agent Roster

| Agent | Division | Model | R/W | Trigger |
|-------|----------|-------|-----|---------|
| `sadhana-coo` | Lead | sonnet | R+W | Auto on significant changes / manual |
| `agent-architect` | Agent Eng | opus | R+W | Manual — agent design/audit |
| `music-director` | Music Team | opus | R+W | Before any new raga or voice curriculum |
| `raga-scholar` | Music Team | opus | R only | Before any Hindustani content ships |
| `acoustics-engineer` | Music Team | opus | R+W | Frequency tables, pitch calibration |
| `audio-engineer` | Music Team | opus | R+W | Voice pipeline, Tone.js, synthesis bugs |
| `curriculum-designer` | Curriculum | opus | R+W | New lessons, track restructuring |
| `lesson-writer` | Curriculum | opus | R+W | After raga-scholar clears content |
| `theory-auditor` | Quality | opus | R only | Non-Hindustani theory validation |
| `progress-analyst` | Quality | sonnet | R only | After data accumulates / manual |
| `bug-fixer` | Quality | opus | R+W | After test failures |
| `uat-tester` | Quality | sonnet | R only | After every build |
| `frontend-builder` | Frontend | sonnet | R+W | New components, gamification UI |
| `frontend-fixer` | Frontend | sonnet | R+W | After UAT failures |
| `brand-director` | Frontend | opus | R+W | Logo, visual language, design tokens |
| `icon-creator` | Frontend | opus | R+W | Icon design, raga iconography, tala visuals, PWA icons, display typeface |
| `db-reviewer` | Infrastructure | sonnet | R only | After migrations |
| `update-docs` | Infrastructure | sonnet | R+W | After EVERY session with changes |
| `perf-optimizer` | Infrastructure | sonnet | R+W | Latency issues / manual |
| `ceo-advisor` | Product | opus | R only | Manual strategic review |
| `sadhana-ciso` | Security | opus | R only | Manual / before launch |

## Model Tiers

Agents are assigned to `opus` or `sonnet` based on whether reasoning depth directly impacts output quality. All agents run on Claude Max CLI ($0).

| Tier | Agents | Rationale |
|------|--------|-----------|
| **opus** | `music-director`, `raga-scholar`, `acoustics-engineer`, `audio-engineer`, `theory-auditor`, `curriculum-designer`, `lesson-writer`, `brand-director`, `icon-creator`, `ceo-advisor`, `agent-architect`, `sadhana-ciso` | Deep reasoning required: musicological judgment, cultural nuance, frequency physics, aesthetic decisions, security analysis, strategic thinking, pedagogical sequencing |
| **sonnet** | `uat-tester`, `frontend-fixer`, `update-docs`, `db-reviewer`, `progress-analyst`, `perf-optimizer`, `sadhana-coo`, `frontend-builder` | Systematic/mechanical work: checklist QA, surgical fixes, doc sync, SQL patterns, data analysis, profiling, orchestration routing, TypeScript components |

## Sequential Cycles

| Cycle | Sequence | Trigger |
|-------|---------|---------|
| **Lesson Ship** | music-director → curriculum-designer → raga-scholar + acoustics-engineer (∥) → lesson-writer → frontend-builder + audio-engineer (∥) → uat-tester → frontend-fixer | New lesson |
| **Frontend Ship** | frontend-builder → uat-tester → frontend-fixer | Non-lesson UI change |
| **Raga Audit** | raga-scholar → lesson-writer → raga-scholar (recheck) | Content release |
| **Voice QA** | acoustics-engineer → audio-engineer → uat-tester | Voice pipeline changes |
| **Brand Cycle** | brand-director → icon-creator → frontend-builder → uat-tester | Brand/visual identity work |
| **Icon Cycle** | brand-director (approve) → icon-creator → frontend-builder (integrate) → uat-tester | New icon sets, display typeface, PWA icons |
| **Quality Cycle** | progress-analyst → curriculum-designer → raga-scholar | Data-driven curriculum update |

(∥) = parallel safe

## Parallel-Safe Agents (Read-Only)

raga-scholar, theory-auditor, progress-analyst, db-reviewer, sadhana-ciso, perf-optimizer, ceo-advisor, uat-tester

## $0 Cost Policy (HARD CONSTRAINT)

**$0.00 end-to-end operational cost.** All agent work: Claude Max CLI only. No paid APIs. No paid services. Every feature must be achievable with: Supabase free tier + Vercel hobby + GitHub Actions + GitHub Pages + client-side WASM/JS.

## Skills (Slash Commands)

| Skill | Purpose |
|-------|---------|
| `/lesson-ship` | Full lesson quality gate — 5 stages from design to UAT |
| `/frontend-ship` | UI quality gate — build → UAT → fix |
| `/theory-audit` | Full curriculum theory validation cycle |

## Named Agent Registry (for COO team orchestration)

| Agent | Team Name |
|-------|-----------|
| music-director | music-lead |
| raga-scholar | raga |
| acoustics-engineer | acoustics |
| audio-engineer | audio |
| curriculum-designer | curriculum |
| lesson-writer | writer |
| raga-scholar | auditor |
| progress-analyst | analyst |
| bug-fixer | fixer |
| uat-tester | ux |
| frontend-builder | builder |
| frontend-fixer | ui-fixer |
| brand-director | brand |
| icon-creator | icons |
| db-reviewer | dba |
| update-docs | documenter |
| perf-optimizer | perf |
| ceo-advisor | strategist |
| sadhana-ciso | security |
| agent-architect | architect |

## Auto-Update Protocol

`update-docs` MUST run at the end of every session where any of the following changed:
- Curriculum content (YAML files)
- Database schema (migrations)
- Frontend components (component inventory)
- Agents or skills
- Design decisions or locked decisions

This ensures CLAUDE.md and all `docs/*.md` reflect current state at the start of every future session.
