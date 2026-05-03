# Implementation Plan: CLI Smart Output - Business Object First

**Date:** 2026-05-03  
**Status:** IN PROGRESS

## Goal

Alle CLI Commands liefern **Business Objects** wenn ein Structure Package vorhanden ist.
Raw Segments / Fallback nur wenn kein Paket installiert ist.

## Gap-Analyse aller Commands

| Command | QUICK_START verspricht | Aktuell | Gap |
|---|---|---|---|
| `parse` | `data.documentNumber`, `data.parties`, `data.lineItems` | Raw Segments | ❌ Repository/Mapper nicht verdrahtet |
| `validate` | Struktur-Validierung gegen Schema | Nur Syntax-Check | ⚠️ messageStructure nie übergeben |
| `build` EDIFACT | `businessObject → EDI` | Nur `message → EDI` | ⚠️ BuildCommand übergibt kein businessObject |
| `build` X12 | `businessObject → EDI` | Fehler "No builder for X12" | ❌ X12 Builder fehlt komplett |
| `export-schema` | Schema mit Feldern/Properties | `"properties": {}` leer | ⚠️ SchemaGenerator nicht implementiert |

**Sprint-Fokus (Sprint 10):** parse + validate + build EDIFACT (gleicher Verdrahtungs-Fix).  
**Backlog:** export-schema JSON Schema Felder, X12 Builder.

## Root Cause (für parse, validate, build)

Gleicher Gap in allen 3 Commands:

```
ParseCommand / ValidateCommand / BuildCommand
  → useCaseFactory.createXXXUseCase(standard)
      → new XXXUseCase(parser)     ← OHNE StructureMappingService + OHNE Repository
```

`IMessageStructureRepository` ist im `DIContainer` vorhanden, wird aber **nicht** an die Commands übergeben.

## Lösung: Shared Architektur-Ansatz

`ParseCommand`, `ValidateCommand`, `BuildCommand` erhalten alle dasselbe Repository via DI:

```
DIContainer
  ├── repository: IMessageStructureRepository    (existiert)
  ├── useCaseFactory: UseCaseFactory             (existiert)
  └── Commands bekommen beide:
      new ParseCommand(useCaseFactory, repository)
      new ValidateCommand(useCaseFactory, repository)
      new BuildCommand(useCaseFactory, repository)
```

## Affected Areas

- [ ] `UseCaseFactory` — `createParseUseCase` mit `StructureMappingService`
- [ ] `ParseCommand` — async repository lookup + smart output (`data` statt `segments`)
- [ ] `ValidateCommand` — async repository lookup + `enableStructuralValidation: true`
- [ ] `BuildCommand` — async repository lookup + Input aus JSON file als businessObject
- [ ] `DIContainer` — Repository an alle 3 Commands übergeben
- [ ] `CLI index.ts` — Commands mit Repository konstruieren
- [ ] Integration Tests `EdifactUseCases.integration.test.ts` — Business Object assertions
- [ ] Integration Tests `X12UseCases.integration.test.ts` — Business Object assertions

## Files

| File | Action | Description |
|---|---|---|
| `packages/core/src/application/factories/UseCaseFactory.ts` | MODIFY | `createParseUseCase` mit optionalem `StructureMappingService` |
| `packages/cli/src/presentation/cli/commands/ParseCommand.ts` | MODIFY | Async repo lookup, `returnTypedObject`, `data`-Output |
| `packages/cli/src/presentation/cli/commands/ValidateCommand.ts` | MODIFY | Async repo lookup, `enableStructuralValidation: true` |
| `packages/cli/src/presentation/cli/commands/BuildCommand.ts` | MODIFY | Async repo lookup, businessObject aus JSON |
| `packages/cli/src/infrastructure/container/DIContainer.ts` | MODIFY | Repository an alle Commands übergeben |
| `packages/cli/src/presentation/cli/index.ts` | MODIFY | Commands mit Repository konstruieren |
| `packages/cli/test/e2e/cli/EdifactUseCases.integration.test.ts` | MODIFY | Business Object assertions |
| `packages/cli/test/e2e/cli/X12UseCases.integration.test.ts` | MODIFY | Business Object assertions |

## Implementation Steps

### 1. `UseCaseFactory.createParseUseCase()` — StructureMappingService optional

```typescript
createParseUseCase(standard: string, mapper?: StructureMappingService): ParseEDIUseCase {
  return new ParseEDIUseCase(parser, mapper);
}
```

### 2. `ParseCommand` — Smart Output (async)

```typescript
// Phase 1: Syntax parse (brauchen wir version+messageType)
const rawResult = rawUseCase.execute({ message: content, standard });

// Phase 2: Structure lookup
const structure = await this.repository?.getMessageStructure(
  standardStr,
  rawResult.message.version.value,
  rawResult.message.messageType.value
);

if (structure) {
  // Business Object output: { metadata, data: { documentNumber, parties, ... } }
  const mappedResult = mappedUseCase.execute({
    message: content, standard,
    returnTypedObject: true, messageStructure: structure
  });
  output = { metadata: ..., data: mappedResult.businessObject };
} else {
  // Fallback: { metadata, _warning: "...", segments: [...] }
  output = { metadata: ..., _warning: 'No structure package found...', segments: ... };
}
```

### 3. `ValidateCommand` — enableStructuralValidation (async)

```typescript
const structure = await this.repository?.getMessageStructure(...);
validateUseCase.execute({
  message: parseResult.message,
  enableStructuralValidation: !!structure,
  messageStructure: structure ?? undefined,
  strictMode: options.strict
});
```

### 4. `BuildCommand` — JSON Input als Business Object (async)

```typescript
// Wenn JSON hat kein `segments`-Array → ist Business Object
const isBusinessObject = !jsonInput.segments;
const structure = isBusinessObject
  ? await this.repository?.getMessageStructure(standard, version, messageType)
  : undefined;
buildUseCase.execute({
  businessObject: isBusinessObject ? jsonInput : undefined,
  message: !isBusinessObject ? reconstructEDIMessage(jsonInput) : undefined,
  messageStructure: structure
});
```

### 5. `DIContainer` — Repository an alle Commands übergeben

```typescript
this.parseCommand = new ParseCommand(this.useCaseFactory, this.repository);
this.validateCommand = new ValidateCommand(this.useCaseFactory, this.repository);
this.buildCommand = new BuildCommand(this.useCaseFactory, this.repository);
```

### 6. Integration Tests anpassen

```typescript
// EdifactUseCases.integration.test.ts
it('parse should return business object when structure package available', () => {
  const output = JSON.parse(parseOutput);
  expect(output.data).toBeDefined();
  expect(output.data.documentNumber).toBe('PO-2026-001');
  expect(output.segments).toBeUndefined();  // kein raw output
});

it('parse without structure package returns segments with warning', () => {
  const output = JSON.parse(parseOutput);
  expect(output.segments).toBeDefined();
  expect(output._warning).toBeDefined();
});
```

## Additional Gap Found During Implementation

### Mapping Rules fehlen in Data Packages

Die Data Packages (`ORDERS.json`, `850.json` etc.) enthalten nur Segment-Struktur,
**aber keine `mapping` Rules** (welches Segment/Element welchem Business Object Feld entspricht).

`StructureMappingService.map()` gibt leeres Objekt zurück weil alle `if (!node.mapping) return;`.

**Konsequenz:** Business Object Output ist derzeit `{}` — nicht `{ documentNumber: "PO-2026-001", ... }`.

**Lösung:** Mapping Rules müssen in Data Packages ergänzt werden (separater Sprint).
Siehe `2026-05-03-backlog-mapping-rules-in-data-packages.md`.

**Aktueller Stand nach diesem Sprint:**
- CLI verdrahtet Repository + StructureMappingService ✅
- Smart Output: `data` Key wenn Structure gefunden, `segments` + warning als Fallback ✅
- `data` enthält aktuell leeres `{}` bis Mapping Rules in Data Packages ergänzt werden
- Strukturelle Validierung aktiv wenn Structure Package installiert ✅
- Build akzeptiert Business Object JSON Format ✅

- [ ] `parse edifact/parse/input/orders.edi` → `{ metadata, data: { documentNumber, ... } }`
- [ ] `parse x12/parse/input/purchase-order-850.edi` → `{ metadata, data: { ... } }`
- [ ] `parse` ohne Structure Package → `{ metadata, _warning, segments }`
- [ ] `validate edifact/validate/input/orders.edi` → strukturelle Validierung aktiv
- [ ] `build edifact/build/input/orders.json` → Business Object wird gemappt
- [ ] Alle bestehenden Tests grün (612+)
- [ ] E2E Integration Tests mit Business Object assertions
- [ ] Result-Dateien in `examples/cli/` neu generiert mit Business Object Output


