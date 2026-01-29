# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-29

### Added

**Core Features:**
- ✅ EDIFACT parsing (Phase 1: String → EDIMessage)
- ✅ EDIFACT parsing (Phase 2: String → Business Object with StructureMapper)
- ✅ EDIFACT building (Phase 1: EDIMessage → String)
- ✅ EDIFACT building (Phase 2: Business Object → String)
- ✅ EDIFACT envelope support (UNH/UNT/UNB/UNZ) with EnvelopeGenerator
- ✅ Structure validation (Phase 1: Syntax validation)
- ✅ Structure validation (Phase 2: Structural validation with MessageStructure)
- ✅ Business object validation (Phase 3: JSON Schema validation)
- ✅ JSON Schema generation and caching for message types

**EDIFACT Support (5 Packages - All MIT Open Source):**
- ✅ D.96A support (7 message types: DESADV, INVOIC, ORDERS, ORDRSP, PRICAT, RECADV, SLSRPT)
- ✅ D.01B support (4 message types: IFCSUM, IFTMIN, IFTSTA, INVOIC)
- ✅ D.20B support (7 message types: APERAK, DESADV, IFTMIN, INVOIC, ORDERS, ORDRSP, RECADV)
- ✅ D.12A support (196 message types: Full EDIFACT coverage)
- ✅ Total: 4 EDIFACT versions, 214 message types
- ✅ Standard definitions available as separate NPM packages (all MIT):
  - `@ediflow/edifact-d96a` (0.32 MB, 7 messages - MIT Free)
  - `@ediflow/edifact-d01b` (0.36 MB, 4 messages - MIT Free)
  - `@ediflow/edifact-d20b` (1.34 MB, 7 messages - MIT Free)
  - `@ediflow/edifact-d12a` (4.44 MB, 196 messages - MIT Free)
- ✅ Monorepo: All packages maintained in single GitHub repository

**CLI Commands:**
- ✅ `ediflow parse` - Parse EDI messages
- ✅ `ediflow validate` - Validate EDI messages
- ✅ `ediflow build` - Build EDI from business objects
- ✅ `ediflow export-schema` - Export JSON schemas

**Architecture:**
- ✅ Clean Architecture (Domain, Application, Infrastructure, Presentation layers)
- ✅ Dependency Injection with DIContainer
- ✅ Repository pattern for message structure definitions
- ✅ Use Case pattern for business logic
- ✅ TypeScript 5.3+ with strict mode
- ✅ ESM + CJS dual build support

**Testing:**
- ✅ 590 passing tests (100% test coverage goal)
- ✅ Unit tests (co-located with source files)
- ✅ Integration tests (53 tests covering Use Cases and cross-layer scenarios)
- ✅ E2E roundtrip tests (9 tests across 3 EDIFACT versions)
- ✅ Performance tests (< 200ms for parse-build-parse cycle)

### Known Limitations

**Current Scope (M1 - Milestone 1):**
- ✅ EDIFACT only (X12, IDOC, VDA, HL7v2 support planned for M2/M3)
- ✅ Limited message types (11 types in D.96A/D.01B/D.20B)
- ✅ No UNG/UNE functional groups support (planned for M2)
- ✅ InMemory and File-based repositories (remote repositories planned for M2)

**API Stability:**
- ⚠️ First release - API may change in minor versions until 1.0.0
- ⚠️ Breaking changes will be documented in CHANGELOG
- ⚠️ Follow semver for upgrades

### Technical Details

**Package Information:**
- **Name:** `@ediflow/core`
- **Version:** 0.1.0
- **License:** MIT
- **Node.js:** >= 18.0.0
- **TypeScript:** >= 5.3.0

**Bundle Sizes:**
- ESM: ~49 KB (dist/index.js)
- CJS: ~51 KB (dist/index.cjs)
- Types: ~21 KB (dist/index.d.ts)
- CLI: ~62 KB (dist/presentation/cli/index.js)

**Dependencies:**
- `commander` ^14.0.2 (CLI framework)
- `js-yaml` ^4.1.1 (YAML parsing for schemas)
- `lru-cache` ^11.2.4 (Schema caching)
- `adm-zip` ^0.5.16 (ZIP handling for directories)
- `yaml` ^2.8.2 (YAML utilities)

### Migration Guide

**From Pre-Release to 0.1.0:**

This is the first public release, no migration needed!

**Getting Started:**
```bash
npm install @ediflow/core
```

```typescript
import { ParseEDIUseCase, Standard } from '@ediflow/core';
import { EdifactMessageParser } from '@ediflow/core/infrastructure';

const parser = new EdifactMessageParser(/* deps */);
const useCase = new ParseEDIUseCase(parser);

const result = useCase.execute({
  message: ediString,
  standard: Standard.EDIFACT
});

if (result.success) {
  console.log(result.message);
}
```

### Breaking Changes

None (first release).

---

## [Unreleased]

### Planned for Next Releases

**M2 (Milestone 2) - Q2 2026:**
- X12 standard support
- More EDIFACT message types (50+ types)
- UNG/UNE functional groups
- File-based repository
- Performance optimizations

**M3 (Milestone 3) - Q3 2026:**
- IDOC standard support
- VDA standard support
- HL7v2 standard support
- Remote repository (HTTP)
- Professional tier features

---

## Version History

- **0.1.0** (2026-01-29) - First public release 🎉
- **0.0.0** (Development) - Internal development phase

---

**For detailed release notes and migration guides, see [GitHub Releases](https://github.com/ediflow-lib/core/releases).**
