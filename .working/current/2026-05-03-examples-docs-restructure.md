# Implementation Plan: Examples Documentation Restructure
**Date:** 2026-05-03
**Status:** IN PROGRESS

## Goal
Make the `examples/` folder consistent and navigable:
- Every `examples/<standard>/` folder has a `README.md` in the same format
- One root `examples/README.md` as master index linking everything
- `CLI_EXAMPLES.md` renamed to `README.md` to follow the same pattern
- Legacy `.js` files cleaned up (replaced by `.ts`)

## Affected Areas
- [ ] `examples/README.md` — NEW (master index)
- [ ] `examples/edifact/README.md` — NEW
- [ ] `examples/hipaa/README.md` — NEW
- [ ] `examples/cli/README.md` — RENAME from CLI_EXAMPLES.md
- [ ] `examples/x12/README.md` — no structural change, only minor updates
- [ ] Package READMEs for `@ediflow/x12` — add "Build" example link

## Files
| File | Action | Description |
|---|---|---|
| `examples/README.md` | NEW | Master index for all examples |
| `examples/edifact/README.md` | NEW | EDIFACT programmatic examples |
| `examples/hipaa/README.md` | NEW | HIPAA programmatic examples |
| `examples/cli/README.md` | NEW | Rename CLI_EXAMPLES.md → README.md |
| `examples/cli/CLI_EXAMPLES.md` | DELETE | Replaced by README.md |

## Template for each standard README
- Title + badge
- Run All section
- One section per example with Output block
- Learn More links

## Implementation Steps
1. Create examples/README.md (master index)
2. Create examples/edifact/README.md
3. Create examples/hipaa/README.md
4. Rename CLI_EXAMPLES.md to README.md
5. Verify all run commands work
6. Pre-commit + commit

