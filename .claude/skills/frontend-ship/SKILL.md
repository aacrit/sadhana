---
name: frontend-ship
description: "Frontend Ship Cycle: frontend-builder builds → uat-tester verifies → frontend-fixer patches. UI quality gate for non-lesson components."
user-invocable: true
disable-model-invocation: false
allowed-tools: Agent, Read, Grep, Glob, Bash, Edit, Write, TaskCreate, TaskUpdate, TaskList, SendMessage
---

# /frontend-ship — Frontend Ship Cycle

Quality gate for UI changes that aren't part of a full lesson ship: navigation, progress views, onboarding, settings, streak display.

## Workflow

```
┌─────────────────────────────┐
│  STAGE 1 — BUILD (write)    │
│  frontend-builder            │
├─────────────────────────────┤
│  STAGE 2 — UAT (read-only)  │
│  uat-tester                  │
├─────────────────────────────┤
│  GATE: pass → DONE           │
├─────────────────────────────┤
│  STAGE 3 — FIX (write)      │
│  frontend-fixer → re-test    │
└─────────────────────────────┘
```

## Stage 1 — Build
**frontend-builder** with the feature spec:
- Rāga & Rhythm design system (tokens.css, 3 type voices, saffron rule)
- Day + Night modes
- Mobile-first, 375px–1440px
- Build must pass: `cd frontend && npm run build`

## Stage 2 — UAT
**uat-tester**:
- Click every interactive element
- Test Day/Night toggle
- Test 375px + 1024px viewports
- Keyboard navigation
- Reduced-motion preference

## Stage 3 — Fix + Re-test
**frontend-fixer** with UAT report → re-run uat-tester.

## Final Report

```
FRONTEND SHIP REPORT
- Result: SHIPPED / BLOCKED
- Change: [description]
- Build: PASS
- UAT: [N issues found, N fixed, N remaining]
- Components touched: [list]
- Files changed: [list]
```
