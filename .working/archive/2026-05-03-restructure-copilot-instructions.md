# Implementation Plan: Restructure Copilot Instructions

**Date:** 2026-05-03  
**Status:** DONE

## Goal

Restructure Copilot instructions into a 3-tier system (like slang for AX4):

1. **`node-js/.github/`** — Universal instructions for all Node.js/TypeScript projects
2. **`ediflow/.github/`** — EDIFlow project-specific instructions (references node-js)
3. **`slang/.github/`** — Already exists for AX4/GraalVM (no changes)

## Affected Areas

- [ ] `C:\Users\z003wbfu\Documents\git\node-js\.github\` — NEW: shared instructions
- [ ] `C:\Users\z003wbfu\WebstormProjects\ediflow\.github\` — REFACTOR: slim down copilot-instructions.md

## Files

### node-js/.github/ (NEW — universal for all Node.js/TS projects)

| File | Action | Description |
|---|---|---|
| `.github/copilot-instructions.md` | NEW | Index file listing all instruction files |
| `.github/instructions/workflow.instructions.md` | NEW | Plan-first workflow, .working/, editor checks (adapted from slang) |
| `.github/instructions/clean-code-tdd.instructions.md` | NEW | Clean Code for TypeScript, TDD with Vitest, mocking (adapted from slang) |
| `.github/instructions/pre-commit.instructions.md` | NEW | Pre-commit checklist for npm projects, Conventional Commits (adapted from slang) |
| `.github/instructions/technology.instructions.md` | NEW | TypeScript, Node.js, Vitest, ESM, path aliases, PascalCase files |
| `.github/instructions/clean-arc.instructions.md` | NEW | Clean Architecture for TypeScript: interfaces, DI, layers |

### ediflow/.github/ (REFACTOR — project-specific only)

| File | Action | Description |
|---|---|---|
| `.github/copilot-instructions.md` | MODIFY | Slim down to project context + reference to node-js instructions |
| `.github/instructions/ediflow.instructions.md` | NEW | EDI domain, packages, monorepo structure, data package pattern |

## Mapping: slang Instructions → node-js Adaptations

| slang File | node-js Adaptation |
|---|---|
| `workflow.instructions.md` | Same structure, remove AX4 references |
| `clean-code-tdd.instructions.md` | TypeScript types instead of ES classes, Vitest instead of custom framework |
| `pre-commit.instructions.md` | `npm run build` + `npm test`, no AX4 pipeline rules, `git add -A` allowed |
| `technology.instructions.md` | TypeScript 5.x, ESM, Vitest, tsup, monorepo, PascalCase (replaces GraalVM/Oracle) |
| `clean-arc.instructions.md` | TypeScript interfaces instead of ES base classes, real DI instead of manual wiring |

## Implementation Steps

1. Create `node-js/.github/copilot-instructions.md` (index)
2. Create 5 instruction files in `node-js/.github/instructions/`
3. Refactor `ediflow/.github/copilot-instructions.md` (slim down)
4. Create `ediflow/.github/instructions/ediflow.instructions.md` (project-specific)
5. Verify IDE picks up instructions correctly

## Open Questions / Risks

- ~~How does WebStorm/IntelliJ resolve instructions from a secondary project folder?~~ **RESOLVED:** User attaches `node-js/` as additional content root in WebStorm. IDE picks up `.github/instructions/` from all attached folders.



