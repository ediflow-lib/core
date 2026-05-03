# EDIFlow 🌊

> Modern EDI Parser, Validator & Builder for TypeScript/JavaScript — EDIFACT & X12

[![NPM Version](https://img.shields.io/npm/v/@ediflow/core.svg)](https://www.npmjs.com/package/@ediflow/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-857%20passing-brightgreen)](https://github.com/ediflow-lib/core)
[![Downloads](https://img.shields.io/npm/dm/@ediflow/core.svg)](https://www.npmjs.com/package/@ediflow/core)

**Clean Architecture** • **Type-Safe** • **Business Object Mapping** • **Schema Export** • **Battle-Tested**

---

## 🌊 The Way of Water

*"Like water finding its path, EDIFlow seamlessly processes EDI data across any standard, any system, any scale."*

Inspired by Taoist philosophy, EDIFlow embodies four principles:

- 💧 **Water finds its way** — Intelligent parsing that elegantly solves problems
- 🌊 **Water adapts to any form** — Supports EDIFACT, X12, and more with flexible architecture  
- 💪 **Water is powerful but gentle** — Enterprise-grade performance, developer-friendly API
- 🔄 **Water connects everything** — Bridges between systems and standards seamlessly

---

## 💡 What Makes EDIFlow Different?

**Most EDIFACT libraries only parse to generic segments:**
```typescript
// ❌ Other Libraries - No type safety, manual segment parsing
const bgm = message.segments.find(s => s.tag === 'BGM');
const docNumber = bgm?.elements[1]?.value;  // What is element[1]? 🤷
```

**EDIFlow maps to type-safe TypeScript business objects:**
```typescript
// ✅ EDIFlow - IntelliSense, type safety, business logic
const order = mapper.mapToBusinessObject(message);
console.log(order.documentNumber);         // Auto-complete works! 🎉
console.log(order.parties.buyer.id);
console.log(order.lineItems[0].productId);
```

### 🎯 Killer Features

#### 1. **Business Object Mapping** (EDIFACT ↔️ TypeScript)
```typescript
// Parse EDIFACT → TypeScript Object
const order = mapper.mapToBusinessObject(parsedMessage);

// Modify with type safety
order.lineItems[0].quantity = 150;
order.lineItems.push({ productId: 'PRODUCT002', quantity: 50 });

// TypeScript Object → EDIFACT
const edifact = mapper.mapFromBusinessObject(order, {...});
```

#### 2. **Schema Export** (JSON Schema & TypeScript)
```typescript
// Generate JSON Schema for validation
const schema = exportSchemaUseCase.execute({
  standard: 'EDIFACT',
  version: 'D20B',
  messageType: 'ORDERS',
  format: 'json-schema'  // or 'typescript'
});

// Validate with Ajv before sending
const ajv = new Ajv();
const validate = ajv.compile(schema);
if (validate(order)) {
  sendToPartner(buildEDI(order));
}
```

**Benefits:**
- ✅ **Type Safety** - Catch errors at compile time
- ✅ **IntelliSense** - Auto-completion for all fields
- ✅ **Validation** - Validate with JSON Schema before sending
- ✅ **Testing** - Easy to mock business objects
- ✅ **Documentation** - Auto-generated TypeScript types

---

## ✨ Features

✅ **Type-Safe Business Objects** - Map EDIFACT to TypeScript objects  
✅ **Schema Export** - Generate JSON Schema & TypeScript definitions  
✅ **Clean Architecture** - SOLID principles, testable, maintainable  
✅ **Complete EDIFACT Support** - D.96A, D.01B, D.20B, D.12A standards  
✅ **X12 Support** - 850, 810, 837, 856 and more (v0.3.0)  
✅ **3-Phase Validation** - Syntax → Structure → Business Logic  
✅ **Envelope Support** - UNH/UNT/UNB/UNZ and ISA/GS/GE/IEA  
✅ **Well-Tested** - 857 tests passing  
✅ **Zero Config** - Works out of the box  

---


## 🚀 Quick Start

### Installation

EDIFlow is published as **separate NPM packages** (all MIT licensed):

```bash
# 1. Install core library (required)
npm install @ediflow/core

# 2. Install EDIFACT standard(s) you need
npm install @ediflow/edifact-d96a   # D.96A (1996) — 89 messages
npm install @ediflow/edifact-d01b   # D.01B (2001) — 155 messages
npm install @ediflow/edifact-d20b   # D.20B (2020) — 178 messages (latest)
npm install @ediflow/edifact-d12a   # D.12A (2012) — 196 messages (most complete)
npm install @ediflow/eancom-2002    # EANCOM 2002 — 50 GS1 retail messages

# 3. OR: Install X12 (USA market)
npm install @ediflow/x12            # X12 Parser (850, 810, 837, 856, ...)
npm install @ediflow/x12-004010     # X12 004010 — 293 transaction sets
npm install @ediflow/x12-006040     # X12 006040 — 319 transaction sets (latest 2026)
npm install @ediflow/hipaa-x12-005010  # HIPAA 005010 — 14 healthcare transaction sets
```

### Parse EDIFACT Message

```typescript
import {
  EdifactMessageParser,
  EdifactDelimiterDetector,
  EdifactTokenizer,
  EdifactSegmentParser,
} from '@ediflow/edifact';

const parser  = new EdifactMessageParser(
  new EdifactDelimiterDetector(), new EdifactTokenizer(), new EdifactSegmentParser(),
);
const message = parser.parse(edifactString);

console.log(message.standard);           // 'EDIFACT'
console.log(message.messageType.value);  // 'ORDERS'
console.log(message.segments.length);    // segment count
```

### Validate Message

```typescript
import { EdifactValidationServiceBuilder } from '@ediflow/edifact';

const validator = EdifactValidationServiceBuilder.forEDIFACT();
const result    = validator.validate(message);

if (result.isValid) {
  console.log('✅ Message is valid!');
} else {
  result.errors.forEach(e => console.error(`❌ ${e.code}: ${e.message}`));
}
```

### Build EDIFACT Message

```typescript
import { EdifactMessageBuilder, EdifactEnvelopeBuilder } from '@ediflow/edifact';
import { EDIMessage, Standard, Version, MessageType, EDISegment, EDIElement } from '@ediflow/core';

const msg = new EDIMessage('1', Standard.EDIFACT, new Version(Standard.EDIFACT, 'D.20B'), new MessageType(Standard.EDIFACT, 'ORDERS'));
msg.addSegment(new EDISegment('BGM', [new EDIElement('220'), new EDIElement('PO-001')]));

const envelopeBuilder = new EdifactEnvelopeBuilder();
const wrapped   = envelopeBuilder.wrapMessage(msg, { messageRef: '1', messageType: msg.messageType, version: msg.version });
const builder   = new EdifactMessageBuilder();
const edifactStr = builder.build(wrapped);
console.log(edifactStr); // Ready to send!
```

---

## 📦 Package Overview

| Package | Size | Messages | License | Use Case |
|---------|------|----------|---------|----------|
| **[@ediflow/core](packages/core)** | 120 KB | - | MIT | Parser engine, use cases, domain |
| **[@ediflow/edifact](packages/edifact)** | - | - | MIT | EDIFACT parsers & builders |
| **[@ediflow/x12](packages/x12)** | - | - | MIT | X12 parsers & validators |
| **[@ediflow/infrastructure-shared](packages/infrastructure-shared)** | - | - | MIT | Repositories, loaders, cache |
| **[@ediflow/cli](packages/cli)** | - | - | MIT | Command-line interface |
| **[@ediflow/edifact-d96a](packages/edifact-d96a)** | 0.32 MB | 89 | MIT | D.96A (1996) |
| **[@ediflow/edifact-d01b](packages/edifact-d01b)** | 0.36 MB | 155 | MIT | D.01B (2001) |
| **[@ediflow/edifact-d20b](packages/edifact-d20b)** | 1.34 MB | 178 | MIT | D.20B (2020) — Latest |
| **[@ediflow/edifact-d12a](packages/edifact-d12a)** | 4.44 MB | 196 | MIT | D.12A (2012) — Most complete |
| **[@ediflow/eancom-2002](packages/eancom-2002/README.md)** | - | 50 | MIT | EANCOM 2002 — GS1 retail |
| **[@ediflow/x12-004010](packages/x12-004010/README.md)** | 7.8 MB | 293 | MIT | X12 version 004010 |
| **[@ediflow/x12-006040](packages/x12-006040/README.md)** | - | 319 | MIT | X12 version 006040 — Latest 2026 |
| **[@ediflow/hipaa-x12-005010](packages/hipaa-x12-005010/README.md)** | - | 14 | MIT | HIPAA X12 005010 — Healthcare |

**Total (all packages):** ~14 MB • **1294+ message types** • **All MIT licensed**

💡 **Tip:** Install only what you need. All packages are free and MIT licensed.

---

---

## 🎯 Features

### Core Features
- **Parse** — EDIFACT / X12 / EANCOM string → structured `EDIMessage`
- **Validate** — 3-phase validation (Syntax → Structure → Business)
- **Build** — `EDIMessage` → EDI string (EDIFACT, X12)
- **Map** — Business Object ↔ `EDIMessage` with 5 key strategies (`code`, `name`, `camelCase`, `snake_case`, `kebab-case`)
- **Schema Export** — JSON Schema & YAML from any message structure
- **Envelopes** — UNH/UNT/UNB/UNZ and ISA/GS/ST/SE/GE/IEA generation & parsing

### Supported Standards

#### EDIFACT (UN/EDIFACT)
- **D.96A** (1996) — 89 message types
- **D.01B** (2001) — 155 message types
- **D.20B** (2020) — 178 message types
- **D.12A** (2012) — 196 message types (most complete)

#### EANCOM 2002 (GS1 retail subset of EDIFACT)
- **EANCOM 2002** — 50 message types (DESADV, ORDERS, INVOIC, PRICAT, ...)
- Uses GLN (Global Location Numbers) & EAN-13 / GTIN product codes

#### X12 (ANSI ASC X12)
- **004010** — 293 transaction sets (850, 810, 856, 997, ...)
- **006040** — 319 transaction sets — Latest 2026 release

#### HIPAA X12 (Healthcare)
- **005010** — 14 transaction sets (837P, 837I, 835, 270, 271, ...)
- US-mandated standard for healthcare transactions (HIPAA)

### Message Types (1294+ total)
**EDIFACT Logistics:** DESADV, ORDERS, ORDRSP, RECADV, IFTMIN, IFTSTA, IFCSUM  
**EDIFACT Financial:** INVOIC, REMADV, FINSTA, PAYMUL  
**EDIFACT Catalog:** PRICAT, SLSRPT  
**EANCOM Retail:** DESADV, INVOIC, ORDERS, ORDRSP, PRICAT, SLSRPT, RECADV, ...  
**X12 Retail/Logistics:** 850 PO, 810 Invoice, 856 ASN, 997 Functional ACK  
**X12 Healthcare:** 837P/I Claims, 835 Remittance, 270/271 Eligibility, ...  
**Plus:** 1000+ more across all versions and standards

---

## 💡 Examples

> **📖 See complete runnable examples on GitHub:**
> [`examples/`](https://github.com/ediflow-lib/core/tree/main/examples)

| Folder | Examples |
|--------|----------|
| **[examples/edifact/](https://github.com/ediflow-lib/core/tree/main/examples/edifact)** | Build INVOIC, Parse ORDERS, Validate DESADV |
| **[examples/eancom/](https://github.com/ediflow-lib/core/tree/main/examples/eancom)** | Parse DESADV (GLN/EAN-13), Validate envelope |
| **[examples/x12/](https://github.com/ediflow-lib/core/tree/main/examples/x12)** | Build 850 PO, Parse 850, Validate 837, Schema Export, Multi-message |
| **[examples/hipaa/](https://github.com/ediflow-lib/core/tree/main/examples/hipaa)** | Parse 837P, Validate 835 |
| **[examples/cli/](https://github.com/ediflow-lib/core/tree/main/examples/cli)** | All CLI commands with input/result files |

---

## 🏗️ Architecture

EDIFlow follows **Clean Architecture** (Uncle Bob) with strict layer separation:

```
┌─────────────────────────────────────┐
│      Presentation Layer             │  @ediflow/cli
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Application Layer              │  Use Cases, DTOs
│      @ediflow/core (application/)   │  ParseEDI, ValidateMessage, BuildEDI
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Domain Layer                   │  Entities, Value Objects
│      @ediflow/core (domain/)        │  EDIMessage, ValidationRules
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Infrastructure Layer           │  Format-specific parsers
│  @ediflow/edifact   @ediflow/x12    │  Shared: @ediflow/infrastructure-shared
└─────────────────────────────────────┘
```

**Key Principles:**
- ✅ Dependencies point **inward** (Domain has zero deps)
- ✅ Domain Layer is **framework-agnostic**
- ✅ Use Cases orchestrate business logic
- ✅ Dependency Injection via DIContainer
- ✅ Repository Pattern for standard definitions

**Read more:** [Architecture Documentation](docs/ARCHITECTURE.md)

---

## 📚 Documentation

- **[Quick Start Guide](docs/QUICK_START.md)** - Get started in 5 minutes
- **[Architecture](docs/ARCHITECTURE.md)** - Clean Architecture explained
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Contributing, testing, development
- **[Examples](examples/README.md)** - Runnable TypeScript & CLI examples
- **[Release Process](docs/RELEASE_PROCESS.md)** - How we release

### Package Documentation
- **[@ediflow/core](packages/core/README.md)** - Core library
- **[@ediflow/edifact](packages/edifact/README.md)** - EDIFACT parsers & builders
- **[@ediflow/x12](packages/x12/README.md)** - X12 parsers & validators
- **[@ediflow/infrastructure-shared](packages/infrastructure-shared/README.md)** - Shared infrastructure
- **[@ediflow/cli](packages/cli/README.md)** - CLI tool
- **[Examples](examples/README.md)** - Runnable examples (X12, EDIFACT, EANCOM, HIPAA, CLI)
- **[@ediflow/edifact-d96a](packages/edifact-d96a/README.md)** - D.96A standard
- **[@ediflow/edifact-d01b](packages/edifact-d01b/README.md)** - D.01B standard
- **[@ediflow/edifact-d20b](packages/edifact-d20b/README.md)** - D.20B standard
- **[@ediflow/edifact-d12a](packages/edifact-d12a/README.md)** - D.12A standard
- **[@ediflow/x12-004010](packages/x12-004010/README.md)** - X12 004010 definitions
- **[@ediflow/x12-006040](packages/x12-006040/README.md)** - X12 006040 definitions — Latest 2026
- **[@ediflow/eancom-2002](packages/eancom-2002/README.md)** - EANCOM 2002 definitions
- **[@ediflow/hipaa-x12-005010](packages/hipaa-x12-005010/README.md)** - HIPAA X12 005010 definitions

---

## 🗺️ Roadmap

### ✅ M1 - EDIFACT Foundation (v0.1.0 / February 2026)
- EDIFACT parsing, validation, building
- 4 EDIFACT versions (D.96A, D.01B, D.20B, D.12A)
- 618 message types total
- Clean Architecture
- 599 tests

### ✅ M2 - Architecture Refactoring & X12 (v0.2.0 / v0.3.0)
- Monorepo with format-specific packages
- X12 Parser with full ISA/GS/ST/SE/GE/IEA envelope support
- X12 Validation Rules (STRICT/LENIENT)
- Schema Export for X12 and EDIFACT via CLI
- EANCOM 2002 and HIPAA X12 005010 data packages
- Business Object Mapping + unmap (round-trip)
- 857 tests

### 🚀 M3 - Enhanced Features (Q3 2026)
- UNG/UNE functional groups
- More X12 transaction sets
- Performance optimizations
- SaaS Platform (EDIFlow Cloud)

### 🌍 M4 - More Standards (2027)
- IDOC support (SAP)
- VDA support (Automotive)
- Unified API for all standards

---

## 🧪 Testing

- EDIFlow is extensively tested with **TDD (Test-Driven Development)**:

- **857 tests** passing (Unit + Integration + E2E)
- **90%+ coverage** for critical paths
- **E2E roundtrip tests** across EDIFACT & X12
- **Performance tests** (< 200ms parse-build-parse cycle)

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

---

## 🤝 Contributing

We welcome contributions! EDIFlow is **MIT licensed** and built by the community.

**Ways to contribute:**
- 🐛 Report bugs via [GitHub Issues](https://github.com/ediflow-lib/core/issues)
- 💡 Suggest features
- 📖 Improve documentation
- 🔧 Submit pull requests

**Getting started:**
1. Read [Contributing Guide](CONTRIBUTING.md)
2. Check [Developer Guide](docs/DEVELOPER_GUIDE.md)
3. Fork, develop, test, submit PR

---

## 💬 Community

- 💬 **Discord:** [Join our community](https://discord.gg/S5npqcv8Zu) - Real-time chat & support
- 📣 **GitHub Discussions:** [Ask questions, share ideas](https://github.com/ediflow-lib/core/discussions)
- 📝 **Dev.to:** [Technical articles & deep dives](https://dev.to/helloediflow)
- 🐛 **Issues:** [Bug reports & feature requests](https://github.com/ediflow-lib/core/issues)
- **Email:** hello.ediflow@gmail.com
- **Website:** [ediflow.org](https://ediflow.org) (coming soon)


---

## 📊 Stats

![Stars](https://img.shields.io/github/stars/ediflow-lib/core?style=social)
![Forks](https://img.shields.io/github/forks/ediflow-lib/core?style=social)
![Issues](https://img.shields.io/github/issues/ediflow-lib/core)
![PRs](https://img.shields.io/github/issues-pr/ediflow-lib/core)

- **Downloads:** Check [NPM stats](https://www.npmjs.com/package/@ediflow/core)
- **Repository:** [github.com/ediflow-lib/core](https://github.com/ediflow-lib/core)
- **Releases:** [See all releases](https://github.com/ediflow-lib/core/releases)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

**Summary:**
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ℹ️ License and copyright notice required

---

## 🙏 Acknowledgments

EDIFlow is built with:
- **TypeScript** - Type safety
- **Vitest** - Testing framework
- **Clean Architecture** - Architecture pattern by Robert C. Martin (Uncle Bob)
- **UN/EDIFACT** - Standards by United Nations

Special thanks to the EDI community for feedback and contributions.

---

**Made with ❤️ for the EDI community**

**Status:** 🚀 Production Ready  
**Version:** 0.3.0  
**Released:** May 2026  
**Maintained by:** [EDIFlow Contributors](https://github.com/ediflow-lib/core/graphs/contributors)

---

<p align="center">
  <a href="https://github.com/ediflow-lib/core">⭐ Star us on GitHub</a> •
  <a href="https://www.npmjs.com/package/@ediflow/core">📦 View on NPM</a> •
  <a href="docs/QUICK_START.md">🚀 Quick Start</a> •
  <a href="https://github.com/ediflow-lib/core/issues">🐛 Report Bug</a>
</p>
