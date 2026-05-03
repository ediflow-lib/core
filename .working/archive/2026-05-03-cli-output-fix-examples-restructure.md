# Implementation Plan: CLI Output Fix & Examples Restructure

**Date:** 2026-05-03  
**Status:** DONE

## Goal

1. Fix CLI parse output: components not split (e.g. `"UNOC:3"` instead of `["UNOC", "3"]`)
2. Restructure `examples/cli/` with clear input/result per use case
3. Update CLI_EXAMPLES.md with correct expected output

## Problem Analysis

### Components Not Split
The EDIFACT parser returns composite values as single strings (`UNOC:3`) instead of
splitting them into components array (`["UNOC", "3"]`). The `formatResult` in ParseCommand
checks `el.components.length > 0` but they are always empty.

**Root cause:** EdifactTokenizer or EdifactSegmentParser does not split composites by `:` separator.

### Examples Structure
Current:
```
examples/cli/
  edifact-orders/     # Mixed input + result files
  x12-850/            # Mixed input + result files
```

Target:
```
examples/cli/
  edifact/
    parse/
      input/          # .edi files
      result/         # expected JSON output
    validate/
      input/
      result/
    build/
      input/          # .json files  
      result/         # .edi output
    export-schema/
      result/         # .json schema
  x12/
    parse/
      input/
      result/
    validate/
      input/
      result/
    export-schema/
      result/
  hipaa/
    parse/
      input/
      result/
```

## Affected Areas

- [ ] Infrastructure: EDIFACT parser (component splitting)
- [ ] Presentation: ParseCommand formatResult
- [ ] Examples: restructure directories
- [ ] Docs: CLI_EXAMPLES.md update

## Files

| File | Action | Description |
|---|---|---|
| `packages/edifact/src/infrastructure/parsers/EdifactSegmentParser.ts` | INVESTIGATE | Check component splitting logic |
| `packages/edifact/src/infrastructure/parsers/EdifactTokenizer.ts` | INVESTIGATE | Check if composites split |
| `packages/core/src/domain/entities/EDIElement.ts` | INVESTIGATE | Check components property |
| `packages/cli/src/presentation/cli/commands/ParseCommand.ts` | MAYBE MODIFY | formatResult may need adjustment |
| `examples/cli/` | RESTRUCTURE | New directory layout |
| `examples/cli/CLI_EXAMPLES.md` | MODIFY | Update with correct output |

## Implementation Steps

1. Investigate component splitting in EDIFACT parser
2. Fix the parser or the CLI output formatter
3. Restructure examples/cli/ directories
4. Re-run all CLI commands and capture correct output
5. Update CLI_EXAMPLES.md
6. Run tests

