# Implementation Plan: Structure-Based Mapping
**Date:** 2026-05-03
**Status:** DONE

## Goal

Rewrite `StructureMappingService.map()` and `unmap()` so they work **without any `mapping` rules** in the JSON data packages. The structure itself (segment tags, element codes, positions) is sufficient to produce a fully typed output object that mirrors the JSON Schema.

## Core Idea

```
EDIMessage.segments[]
  └─ EDISegment { tag: 'BGM', elements: [EDIElement('220'), EDIElement('PO-001')] }

MessageStructureDTO.structure[]
  └─ SegmentNode { tag: 'BGM', position: 10, elements: [
       ElementNode { code: '1001', position: 1 },   → segment.elements[0].value = '220'
       ElementNode { code: '1004', position: 2 },   → segment.elements[1].value = 'PO-001'
     ]}
```

**Output:**
```json
{
  "BGM": { "1001": "220", "1004": "PO-001" },
  "SG1": [
    { "RFF": { "C506": { "1153": "ON", "1154": "REF-001" } } }
  ]
}
```

## Key Rules

1. **Dispatch**: if `node.mapping` present → old behaviour (backward compat). If absent → structure-based.
2. **Segment key** = `node.tag` (e.g. `'BGM'`). Repeating (`maxOccurrences > 1`) → array.
3. **Group key** = `node.id` (e.g. `'SG1'`). Always array (groups repeat by definition).
4. **Element key** = `element.code` (e.g. `'1004'`). Position is 1-based → `segment.elements[position - 1]`.
5. **Composite** = nested object keyed by component codes.
6. **Group slicing**: scan flat `ediMessage.segments`, split into instances every time `triggerSegment` tag appears.

## Affected Files

| File | Action | Description |
|---|---|---|
| `packages/core/src/application/services/StructureMappingService.ts` | MODIFY | Add structure-based `map()` + `unmap()` paths |
| `packages/core/src/application/services/StructureMappingService.test.ts` | MODIFY | Add new `describe` block for structure-based tests |

## Implementation Steps

### Step 1 - Tests (RED)
Add `describe('Structure-based mapping (no mapping rules)')` in `StructureMappingService.test.ts`:
- `map()` flat segment → `{ BGM: { '1001': '220', '1004': 'PO-001' } }`
- `map()` composite element → `{ DTM: { C507: { '2005': '137', '2380': '20260127' } } }`
- `map()` repeating segment (maxOccurrences > 1) → `{ DTM: [{ ... }, { ... }] }`
- `map()` segment group with 2 instances → `{ SG1: [{ RFF: {...} }, { RFF: {...} }] }`
- `unmap()` roundtrip for flat segments
- `unmap()` roundtrip for segment groups

### Step 2 - Implementation (GREEN)

**`mapStructureBasedSegment(node, segments)`**
- Find all `EDISegment` where `s.tag === node.tag`
- For each: iterate `node.elements` sorted by `position`
  - `ElementNode` → `obj[element.code] = segment.elements[element.position - 1]?.value ?? ''`
  - `CompositeElementNode` → `obj[composite.code] = {}` then for each component → `nested[comp.code] = segment.elements[composite.position - 1]?.components[comp.position - 1] ?? ''`
- Single hit + maxOccurrences === 1 → return object; else → return array

**`sliceGroupInstances(node, allSegments)`**
- Walk `allSegments`, collect indices where `s.tag === node.triggerSegment`
- Slice between consecutive trigger indices (end = next trigger OR end of array)
- Return `EDISegment[][]`

**`mapStructureBasedGroup(node, allSegments)`**
- Call `sliceGroupInstances()` → array of slices
- For each slice: create `groupObj`, recurse with `mapNode()` using a synthetic `EDIMessage` containing only that slice
- Return array of group objects

**`unmapStructureBasedSegment(node, sourceObj, ediMessage)`**
- Read `sourceObj[node.tag]` → single object or array
- For each item: create `EDIElement[]` sized to `max(element.position)` filled with empty
  - `ElementNode` → `elements[pos-1] = new EDIElement(value, [])`
  - `CompositeElementNode` → `elements[pos-1] = new EDIElement('', components[])`
- Push `new EDISegment(node.tag, elements)` to `ediMessage`

### Step 3 - Dispatch in existing methods
In `mapSegment()`: `if (!node.mapping) → mapStructureBasedSegment()`
In `mapSegmentGroup()`: `if (!node.mapping) → mapStructureBasedGroup()`
In `unmapSegment()`: `if (!node.mapping) → unmapStructureBasedSegment()`
In `unmapSegmentGroup()`: `if (!node.mapping) → unmapStructureBasedGroup()`

### Step 4 - Refactor & verify all tests green


