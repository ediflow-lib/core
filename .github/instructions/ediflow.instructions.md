---
applyTo: "**"
---
# EDIFlow - Project-Specific Instructions

> **Universal rules** (workflow, clean code, TDD, pre-commit, technology, clean architecture)
> are provided by the attached `node-js/.github/instructions/` folder.
> This file contains only **EDIFlow-specific** context.

---

## Project Overview

**EDIFlow** is a modern EDI parsing, validation, and building library for TypeScript/JavaScript.
It supports EDIFACT, X12, HIPAA, and EANCOM standards.

**Architecture:** Clean Architecture (Monorepo with npm workspaces)

---

## Monorepo Package Structure

```
packages/
  core/                   # Domain + Application (pure, no parsers)
  edifact/                # EDIFACT parsers & builders (Infrastructure)
  x12/                    # X12 parsers & validators (Infrastructure)
  infrastructure-shared/  # Shared repos, loaders, schema generation
  cli/                    # CLI tool (Presentation layer)
  edifact-d96a/           # EDIFACT D.96A data package (126 messages)
  edifact-d01b/           # EDIFACT D.01B data package
  edifact-d12a/           # EDIFACT D.12A data package
  edifact-d20b/           # EDIFACT D.20B data package (195 messages)
  x12-004010/             # X12 004010 data package (293 messages)
  x12-006040/             # X12 006040 data package (319 messages)
  hipaa-x12-005010/       # HIPAA X12 005010 data package (14 messages)
  eancom-2002/            # EANCOM 2002 data package (49 messages)
```

**Key principle:** Core is format-agnostic. Format packages implement interfaces from core.

---

## Path Aliases

```typescript
// Configured aliases:
import { X } from '@domain/...';          // -> packages/core/src/domain/
import { X } from '@application/...';     // -> packages/core/src/application/
import { X } from '@infrastructure/...';  // -> packages/<pkg>/src/infrastructure/
import { X } from '@ediflow/core';        // -> packages/core/
import { X } from '@ediflow/edifact';     // -> packages/edifact/
import { X } from '@ediflow/x12';         // -> packages/x12/
```

---

## Data Package Pattern

Data packages (`edifact-d20b`, `x12-004010`, etc.) contain JSON definition files:

```
data/
  messages/     # One JSON per message type (850.json, ORDERS.json)
  segments.json # Segment definitions
  elements.json # Element definitions
  composites.json
  codes/        # Code list values (one JSON per code)
```

These are loaded at runtime by `FileBasedMessageStructureRepository` from `infrastructure-shared`.

---

## Git Workflow

- **Always branch from `develop`:** `git checkout -b feature/short-name`
- **Branch naming:** `feature/us-X.Y-short-name` (lowercase, kebab-case)
- **Never commit to `main` directly.**

---

## Story Workflow

When user says "Sprint X, Story #YY":
1. Run: `npx ts-node --project tsconfig.scripts.json scripts/fetch-story.ts YY`
2. Read acceptance criteria from the output
3. Ask: "Should I create feature branch?"
4. Start implementing with TDD

