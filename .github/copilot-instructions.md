# GitHub Copilot Instructions - EDIFlow

This project uses a **two-layer instruction system**:

## Universal Instructions (from `node-js/.github/`)

Attach the `node-js/` folder to your IDE alongside this project.
These files apply to all Node.js / TypeScript projects:

| File | Description |
|---|---|
| `workflow.instructions.md` | Plan-first workflow, `.working/` directory, editor checks |
| `clean-code-tdd.instructions.md` | Clean Code for TypeScript, TDD with Vitest |
| `pre-commit.instructions.md` | Pre-commit checklist, Conventional Commits |
| `technology.instructions.md` | TypeScript, ESM, Vitest, tsup, PascalCase files |
| `clean-arc.instructions.md` | Clean Architecture with TypeScript interfaces |

## Project-Specific Instructions

| File | Description |
|---|---|
| `instructions/ediflow.instructions.md` | EDIFlow domain, monorepo structure, data packages, path aliases, story workflow |
