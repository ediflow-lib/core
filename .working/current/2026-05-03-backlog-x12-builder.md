# Implementation Plan: X12 Builder + --skip-empty Option

**Date:** 2026-05-03  
**Status:** IN PROGRESS

## Goal

1. `X12MessageBuilder` implementieren
2. `--skip-empty` Option (default: `true`) für `parse` Command — entfernt `""`, `[]`, `{}`, `null`

## Files

| File | Action |
|---|---|
| `packages/x12/src/infrastructure/builders/X12MessageBuilder.ts` | NEW |
| `packages/x12/src/infrastructure/builders/X12MessageBuilder.test.ts` | NEW |
| `packages/x12/src/index.ts` | MODIFY - export builder |
| `packages/cli/src/infrastructure/container/DIContainer.ts` | MODIFY - register builder |
| `packages/cli/src/presentation/cli/commands/ParseCommand.ts` | MODIFY - add --skip-empty |
| `packages/cli/src/presentation/cli/utils/OutputFormatter.ts` | MODIFY - add skipEmpty filter |
| `examples/cli/x12/build/input/purchase-order-850.json` | NEW |
| `examples/cli/x12/build/result/purchase-order-850.edi` | NEW |

## Implementation Steps
1. X12MessageBuilder (TDD)
2. Export + register in container
3. --skip-empty in ParseCommand + OutputFormatter
4. Example files + result files
