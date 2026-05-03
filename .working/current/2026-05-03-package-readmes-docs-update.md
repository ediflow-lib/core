# Implementation Plan: Package READMEs + Docs Update + .gitignore
**Date:** 2026-05-03
**Status:** IN PROGRESS

## Goal
1. Update all package READMEs from v0.2.0 → v0.3.0
2. Add examples/ GitHub link in cli README
3. Update public docs (QUICK_START, ARCHITECTURE, DEVELOPER_GUIDE) for accuracy
4. Add .working/ to .gitignore

## Files
| File | Action | What changes |
|---|---|---|
| `packages/cli/README.md` | MODIFY | v0.2.0→v0.3.0, add GitHub examples link, fix CLI_EXAMPLES.md→README.md |
| `packages/core/README.md` | MODIFY | v0.2.0→v0.3.0, fix test count, fix API code examples, remove deprecated DIContainer/StructureMapper |
| `packages/edifact/README.md` | MODIFY | v0.2.0→v0.3.0, remove deprecated migration section |
| `packages/infrastructure-shared/README.md` | MODIFY | v0.2.0→v0.3.0 |
| `docs/QUICK_START.md` | MODIFY | Fix DIContainer/StructureMapper (removed), API.md link, real code examples |
| `docs/ARCHITECTURE.md` | MODIFY | v0.2.0 diff section → v0.3.0 consolidated, DIContainer note |
| `docs/DEVELOPER_GUIDE.md` | MODIFY | v0.2.0 refs → v0.3.0, fix test count 590→857, fix DIContainer |
| `.gitignore` | MODIFY | Add .working/ |

## Implementation Steps
1. .gitignore first
2. Package READMEs (cli, core, edifact, infrastructure-shared)
3. Public docs (QUICK_START, DEVELOPER_GUIDE, ARCHITECTURE)
4. Commit

