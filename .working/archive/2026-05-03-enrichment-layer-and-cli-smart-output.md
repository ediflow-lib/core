# Implementation Plan: Enrichment Layer + CLI Smart Output

**Date:** 2026-05-03  
**Status:** DONE

## Goal

Den Enrichment-Layer implementieren — den einzigen Blocker für alle 4 CLI-Commands.

Danach liefert `parse` je nach `--output-type` Flag:

**Default (`--output-type edi-message`):**
```json
{
  "standard": "EDIFACT",
  "version": "D.20B",
  "messageType": "ORDERS",
  "segmentCount": 12,
  "segments": [
    { "tag": "UNH", "elements": [...] },
    { "tag": "BGM", "elements": [...] },
    { "tag": "DTM", "elements": [...] }
  ]
}
```

**`--output-type business-object` (braucht Data Package):**
```json
{
  "BGM": { "C002": { "1001": "220" }, "1004": "PO-2026-001", "1225": "9" },
  "DTM": { "C507": { "2005": "137", "2380": "20260204", "2379": "102" } },
  "SG2": [
    { "NAD": { "3035": "BY", "3036": "ACME Corporation" } },
    { "NAD": { "3035": "SU", "3036": "Best Supplier Inc" } }
  ]
}
```

**`--output-type structure`**: MessageStructureDTO als JSON

---

## Architektur-Verständnis (aus Doku)

### Das zentrale Konzept

Die `MessageStructureDTO` enthält schon alles:
- `structure[].tag` → Segment Tag (z.B. `BGM`)
- `structure[].elements[].code` → Element Code (z.B. `1004`) 
- `structure[].elements[].name` → Element Name (z.B. `Document identifier`)
- `structure[].elements[].nodeType` → `element` | `composite`
- Composites haben `components[]` mit jeweils `code` + `name`

Das Mapping ergibt sich aus **Positions-Korrespondenz**:

```
EDISegment("BGM", ["220", "PO-12345", "9"])
                    pos0   pos1         pos2

MessageStructureDTO.BGM.elements[0] = CompositeNode(C002)  → "220" → { "C002": { "1001": "220" } }
MessageStructureDTO.BGM.elements[1] = ElementNode(1004)    → "PO-12345" → { "1004": "PO-12345" }
MessageStructureDTO.BGM.elements[2] = ElementNode(1225)    → "9" → { "1225": "9" }
```

### Der Enrichment-Layer (BLOCKER)

`FileBasedMessageStructureRepository.getMessageStructure()` gibt aktuell eine **unvollständige** `MessageStructureDTO` zurück:

```json
{
  "structure": [
    { "nodeType": "segment", "segmentRef": "BGM", "mandatory": true }
  ]
}
```

`segmentRef: "BGM"` ist nicht aufgelöst — **`tag`, `elements[]`, `name` fehlen**.

Der Enrichment-Service muss `segmentRef` → vollständigen `SegmentNode` mit `elements[]` auflösen.

**Aber:** `MessageStructureBuilder` in `infrastructure-shared` macht GENAU das bereits!

### Prüfung: Was macht `MessageStructureBuilder` wirklich?

Laut Plan müssen wir prüfen ob `MessageStructureBuilder` die `elements[]` mit `code` + `name` auffüllt oder nur grundlegende Felder kopiert.

---

## Root Cause — Präzise

Muss noch verifiziert werden durch Code-Lesen. Hypothesen:

**Option A:** `MessageStructureBuilder` löst `segmentRef` vollständig auf (inkl. `elements[].code/name`)
→ Dann fehlt nur Verdrahtung in `ParseCommand` (kein neuer Service nötig)

**Option B:** `MessageStructureBuilder` löst `segmentRef` nur teilweise auf
→ Dann brauchen wir den `MessageStructureEnrichmentService` laut Architektur-Plan

---

## Files zu lesen (ZUERST)

| File | Warum |
|---|---|
| `packages/infrastructure-shared/src/repositories/MessageStructureBuilder.ts` | Prüfen ob elements[] mit code/name aufgelöst werden |
| `packages/core/src/application/dtos/MessageStructureDTO.ts` | Exakte Shape des DTO prüfen |
| `packages/core/src/application/services/StructureMappingService.ts` Zeile 28-36 | Wie `map()` über `structure.structure` iteriert |

---

## Implementation Steps

### Step 1: Verifizieren was `MessageStructureBuilder` liefert (READ ONLY)

```typescript
// Prüfen: Hat SegmentNode nach Builder.build() diese Felder?
SegmentNode {
  tag: "BGM",         // ← kommt das aus segments.json?
  name: "...",        // ← kommt das aus segments.json?
  elements: [
    { code: "C002", name: "...", nodeType: "composite", components: [...] },
    { code: "1004", name: "Document identifier", nodeType: "element", ... }
  ]
}
```

### Step 2: Je nach Ergebnis unterschiedlicher Fix

**Wenn Option A (Builder vollständig):**
- `ParseCommand` async repository lookup + `StructureMappingService.map()` aufrufen
- Output: `{ metadata, data: businessObject }`

**Wenn Option B (Builder unvollständig):**
- `MessageStructureEnrichmentService` implementieren (neuer Service in core/application/services/)
- Dann `ParseCommand` verdrahten

### Step 3: `ParseCommand` Smart Output

```typescript
const outputType: string = options.outputType || 'edi-message';

// Default: EDIMessage direkt (UNH, BGM, etc.) — kein metadata/data Wrapper
if (outputType === 'edi-message') {
  output = { standard, version, messageType, segmentCount, delimiters, segments: [...] };
  return;
}

// --output-type business-object: braucht Data Package
const structure = await this.repository?.getMessageStructure(...);
if (outputType === 'business-object' && structure) {
  output = mappedResult.businessObject; // direkt, kein Wrapper
} else if (!structure) {
  output = { _warning: '...', ...ediMessage };
}

// --output-type structure: MessageStructureDTO
if (outputType === 'structure') {
  output = structure ?? { _warning: '...' };
}
```

### Step 4: `ValidateCommand` — Strukturelle Validation

Analog zu ParseCommand: Structure laden, dann `X12ValidationService` / `EdifactValidationService` mit Structure aufrufen.

### Step 5: `BuildCommand` — Business Object Input

Business Object JSON Input (`data`-Key) → `StructureMappingService.unmap()` → `EDIMessage` → EDI-String

### Step 6: `DIContainer` — Commands mit Repository verdrahten

```typescript
this.parseCommand = new ParseCommand(this.useCaseFactory, this.repository, this.structureMappingService);
this.validateCommand = new ValidateCommand(this.useCaseFactory, this.repository);
this.buildCommand = new BuildCommand(this.useCaseFactory, this.repository, this.structureMappingService);
```

### Step 7: Expected Result Dateien neu erstellen

Nach echtem CLI-Run: tatsächlichen Output als `result/orders.json` und `result/purchase-order-850.json` speichern.

**Fehlerhafte Expected-Files löschen:**
- `examples/cli/edifact/parse/result/orders-expected.json` → löschen, durch echten Output ersetzen
- `examples/cli/x12/parse/result/purchase-order-850-expected.json` → löschen, durch echten Output ersetzen

### Step 8: `export-schema` Command registrieren

Laut `EXPORT_SCHEMA_USE_CASE.md`:
- `--standard` Flag hinzufügen
- In `index.ts` registrieren
- X12 Data Package Pfad im Repository konfigurieren

### Step 9: Integration Tests

```typescript
it('parse EDIFACT ORDERS returns business object with segment codes', () => {
  const output = JSON.parse(parseOutput);
  expect(output.data).toBeDefined();
  expect(output.data['BGM']).toBeDefined();
  expect(output.data['BGM']['1004']).toBe('PO-2026-001');
  expect(output.segments).toBeUndefined();
});

it('parse without structure package returns raw segments with warning', () => {
  const output = JSON.parse(parseOutput);
  expect(output.segments).toBeDefined();
  expect(output._warning).toBeDefined();
  expect(output.data).toBeUndefined();
});
```

---

## Affected Areas

- [ ] `packages/infrastructure-shared/src/repositories/MessageStructureBuilder.ts` — INVESTIGATE
- [ ] `packages/core/src/application/dtos/MessageStructureDTO.ts` — INVESTIGATE
- [ ] `packages/core/src/application/services/StructureMappingService.ts` — VERIFY map() algo
- [ ] `packages/cli/src/presentation/cli/commands/ParseCommand.ts` — MODIFY
- [ ] `packages/cli/src/presentation/cli/commands/ValidateCommand.ts` — MODIFY  
- [ ] `packages/cli/src/presentation/cli/commands/BuildCommand.ts` — MODIFY
- [ ] `packages/cli/src/presentation/cli/commands/ExportSchemaCommand.ts` — MODIFY (--standard flag)
- [ ] `packages/cli/src/presentation/cli/index.ts` — MODIFY (export-schema registrieren)
- [ ] `packages/cli/src/infrastructure/container/DIContainer.ts` — MODIFY
- [ ] `examples/cli/edifact/parse/result/` — NEU (echter Output)
- [ ] `examples/cli/x12/parse/result/` — NEU (echter Output)
- [ ] `packages/cli/test/e2e/` — MODIFY (Business Object assertions)

---

## Definition of Done

- [ ] `parse edifact/parse/input/orders.edi` → `{ metadata, data: { "BGM": { "1004": "PO-2026-001" }, ... } }`
- [ ] `parse x12/parse/input/purchase-order-850.edi` → `{ metadata, data: { "BEG": { ... }, ... } }`
- [ ] `parse` mit unbekanntem Standard → `{ metadata, _warning, segments }`
- [ ] `validate orders.edi` → strukturelle Validierung aktiv (mandatory segments geprüft)
- [ ] `build orders.json` (mit `data`-Key) → EDIFACT String
- [ ] `export-schema -m ORDERS -s EDIFACT -v D.96A` → gültiges JSON Schema
- [ ] `export-schema -m 850 -s X12 -v 004010` → gültiges JSON Schema
- [ ] Alle bestehenden Tests grün
- [ ] E2E Integration Tests mit Business Object assertions
- [ ] Result-Dateien in `examples/cli/` basieren auf echtem CLI-Output



