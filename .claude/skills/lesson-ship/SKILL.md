---
name: lesson-ship
description: "Lesson Ship Cycle: curriculum-designer sequences → theory-auditor validates → lesson-writer authors → frontend-builder implements → uat-tester verifies. Full lesson quality gate."
user-invocable: true
disable-model-invocation: false
allowed-tools: Agent, Read, Grep, Glob, Bash, Edit, Write, TaskCreate, TaskUpdate, TaskList, SendMessage
---

# /lesson-ship — Lesson Ship Cycle

End-to-end quality gate for any new lesson in Sādhanā. Nothing ships with wrong theory. Nothing ships without author copy. Nothing ships without a working UI.

## Workflow

```
┌─────────────────────────────────────────────┐
│  STAGE 1 — DESIGN (write)                   │
│  curriculum-designer: sequence + YAML draft  │
├─────────────────────────────────────────────┤
│  STAGE 2 — AUDIT (read-only)                │
│  theory-auditor: validate all theory claims  │
├─────────────────────────────────────────────┤
│  GATE: CRITICAL errors → back to Stage 1     │
├─────────────────────────────────────────────┤
│  STAGE 3 — AUTHOR (write)                   │
│  lesson-writer: exercise copy, theory notes  │
├─────────────────────────────────────────────┤
│  STAGE 4 — BUILD + AUDIO (parallel)         │
│  frontend-builder: lesson UI components      │
│  audio-engineer: exercise audio integration  │
├─────────────────────────────────────────────┤
│  STAGE 5 — UAT (read-only)                  │
│  uat-tester: full lesson walkthrough         │
├─────────────────────────────────────────────┤
│  GATE: Issues → frontend-fixer → re-test     │
└─────────────────────────────────────────────┘
```

## Execution

### Stage 1 — Design
Launch **curriculum-designer** with the lesson brief:
- YAML structure: id, track, title, prerequisites, exercises, mastery_threshold
- Each exercise: type, prompt, audio requirements, repetitions
- Max 20 minutes. Target 10–15 minutes.

### Stage 2 — Audit
Launch **theory-auditor** with the YAML file(s):
- CRITICAL errors: block. Return to curriculum-designer.
- Warnings: pass to lesson-writer as notes.

### Stage 3 — Author
Launch **lesson-writer** with theory-auditor report:
- Apply Presence Rule: sound first, label second
- Write all exercise prompts, feedback, hints, theory note
- No praise inflation, no hedging

### Stage 4 — Build + Audio (Parallel)
Launch **frontend-builder** and **audio-engineer** simultaneously:
- frontend-builder: ExerciseCard, IntervalPlayer/ChordPlayer, TheoryNote components
- audio-engineer: Tone.js playback for each exercise type in lesson

### Stage 5 — UAT
Launch **uat-tester**:
- Walk through entire lesson start to finish
- Test incorrect answer flow
- Test audio playback on Chrome, Firefox, Safari
- Test Day/Night modes
- Test 375px mobile + 1024px desktop

### Final Report

```
LESSON SHIP REPORT
- Result: SHIPPED / BLOCKED
- Lesson: [id] — [title]
- Theory: PASS (N exercises audited, 0 critical errors)
- Copy: PASS (Presence Rule: N/N exercises)
- Build: PASS (static export succeeded)
- Audio: PASS (<50ms latency, N/3 browsers)
- UAT: PASS / [N issues found, N fixed]
- Files changed: [list]
```
