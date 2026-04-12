---
name: theory-audit
description: "Theory Audit Cycle: theory-auditor validates all lessons → lesson-writer fixes errors → theory-auditor rechecks. Use before any content release."
user-invocable: true
disable-model-invocation: false
allowed-tools: Agent, Read, Grep, Glob, Bash, TaskCreate, TaskUpdate, TaskList, SendMessage
---

# /theory-audit — Theory Audit Cycle

Validates every lesson in the curriculum for music theory correctness. Run before any content release or after bulk lesson authoring.

## Workflow

```
┌──────────────────────────────────────────┐
│  STAGE 1 — AUDIT (read-only)             │
│  theory-auditor: full curriculum scan    │
├──────────────────────────────────────────┤
│  GATE: 0 critical errors → PASS          │
├──────────────────────────────────────────┤
│  STAGE 2 — FIX (write)                  │
│  lesson-writer: fix all flagged errors   │
├──────────────────────────────────────────┤
│  STAGE 3 — RECHECK (read-only)           │
│  theory-auditor: verify all fixes clean  │
└──────────────────────────────────────────┘
```

## Execution

### Stage 1 — Audit
**theory-auditor** on all `content/curriculum/*.yaml` files:
- Check intervals, scales, chords, progressions
- Classify: CRITICAL / WARNING / STYLE

### Stage 2 — Fix (only if CRITICAL errors found)
**lesson-writer** with theory-auditor report:
- Fix CRITICAL errors only (don't rewrite passing exercises)
- Note corrections for progress-analyst awareness

### Stage 3 — Recheck
**theory-auditor** on fixed files only:
- Verify CRITICAL errors resolved
- Warnings acceptable to ship with (document in report)

## Final Report

```
THEORY AUDIT REPORT
- Result: CLEAN / FIXED / BLOCKED
- Lessons audited: [N]
- Critical errors found: [N] → Fixed: [N] → Remaining: [N]
- Warnings: [N] (documented, not blocking)
```
