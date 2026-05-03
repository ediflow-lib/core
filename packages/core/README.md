# @ediflow/core

> Modern EDIFACT Parser, Validator & Builder - Core Library

[![NPM Version](https://img.shields.io/npm/v/@ediflow/core.svg)](https://www.npmjs.com/package/@ediflow/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Downloads](https://img.shields.io/npm/dm/@ediflow/core.svg)](https://www.npmjs.com/package/@ediflow/core)

**Clean Architecture** • **Type-Safe** • **Zero Config** • **Battle-Tested**

---

## 🆕 What's New in v0.3.0

- ✅ **X12 Support** — Full ISA/GS/ST/SE/GE/IEA envelope parsing & validation (850, 810, 837, 856, ...)
- ✅ **Business Object Mapping** — `StructureMappingService.map()` / `unmap()` with 5 key strategies
- ✅ **Schema Export** — `ExportSchemaUseCase` for JSON Schema + YAML via CLI
- ✅ **HIPAA** — `@ediflow/hipaa-x12-005010` data package (14 transaction sets)
- ✅ **EANCOM** — `@ediflow/eancom-2002` data package (50 message types)
- ✅ **857 tests** passing across all packages

---

## 📦 What is @ediflow/core?

`@ediflow/core` is the **core engine** for EDIFlow - a modern EDIFACT library built with Clean Architecture principles.

**This package provides:**
- ✅ **Parser** - EDIFACT string → EDIMessage
- ✅ **Validator** - 3-phase validation (Syntax → Structure → Business)
- ✅ **Builder** - EDIMessage → EDIFACT string
- ✅ **Mapper** - Auto-convert to/from business objects
- ✅ **Envelope Generator** - UNH/UNT/UNB/UNZ support
- ✅ **CLI** - Command-line tools
- ✅ **TypeScript** - Full type safety

**What this package does NOT include:**
- ❌ EDIFACT standard definitions (install separately)

---

## 🚀 Installation

```bash
# Install core library
npm install @ediflow/core

# Install EDIFACT standard(s) - REQUIRED for validation
npm install @ediflow/edifact-d20b   # Latest (recommended)
# OR
npm install @ediflow/edifact-d12a   # Full coverage (196 messages)
# OR
npm install @ediflow/edifact-d01b   # Legacy systems
npm install @ediflow/edifact-d96a   # Classic
```

---

## 📖 Quick Start

### Parse EDIFACT Message

```typescript
import {
  EdifactMessageParser,
  EdifactDelimiterDetector,
  EdifactTokenizer,
  EdifactSegmentParser,
} from '@ediflow/edifact';

const parser = new EdifactMessageParser(
  new EdifactDelimiterDetector(),
  new EdifactTokenizer(),
  new EdifactSegmentParser(),
);

const message = parser.parse(edifactString);
console.log(message.standard);           // 'EDIFACT'
console.log(message.messageType.value);  // 'ORDERS'
console.log(message.version.value);      // 'D.96A'
console.log(message.segments.length);    // segment count
```

### Map to Business Object

```typescript
import { StructureMappingService } from '@ediflow/core';
import { FileBasedMessageStructureRepository } from '@ediflow/infrastructure-shared';

const repository = new FileBasedMessageStructureRepository('./node_modules');
const structure  = await repository.getMessageStructure('EDIFACT', 'D.96A', 'ORDERS');

const mapper = new StructureMappingService();
const order  = mapper.map(message, structure!, 'camelCase');
// order.beginningOfMessage.documentMessageNumber === 'PO-001'
```

### Validate Message

```typescript
import { EdifactValidationServiceBuilder } from '@ediflow/edifact';

const validator = EdifactValidationServiceBuilder.forEDIFACT();
const result    = validator.validate(message);

if (result.isValid) {
  console.log('✅ Valid!');
} else {
  result.errors.forEach(e => console.error(`❌ ${e.code}: ${e.message}`));
}
```

### Build EDIFACT Message

```typescript
import { EdifactMessageBuilder, EdifactEnvelopeBuilder } from '@ediflow/edifact';
import { EDIMessage, Standard, Version, MessageType, EDISegment, EDIElement } from '@ediflow/core';

const msg = new EDIMessage('1', Standard.EDIFACT, new Version(Standard.EDIFACT, 'D.20B'), new MessageType(Standard.EDIFACT, 'ORDERS'));
msg.addSegment(new EDISegment('BGM', [new EDIElement('220'), new EDIElement('PO-001'), new EDIElement('9')]));

const envelopeBuilder = new EdifactEnvelopeBuilder();
const wrapped         = envelopeBuilder.wrapMessage(msg, { messageRef: '1', messageType: msg.messageType, version: msg.version });

const builder    = new EdifactMessageBuilder();
const edifactStr = builder.build(wrapped);
console.log(edifactStr); // UNH+1+ORDERS:D:20B:UN'BGM+220+PO-001+9'UNT+2+1'
```

---

## 🎯 Features

### Core Features
- **Parse** - EDIFACT → EDIMessage (with envelope support)
- **Validate** - 3-phase validation (Syntax, Structure, Business)
- **Build** - EDIMessage → EDIFACT (with envelope generation)
- **Map** - Business Objects ↔ EDIMessage
- **CLI** - Command-line interface

### Clean Architecture
- **Domain Layer** - Pure business logic (zero dependencies)
- **Application Layer** - Use Cases (ParseEDI, ValidateMessage, BuildEDI)
- **Infrastructure Layer** - Parsers, Repositories
- **Presentation Layer** - CLI, Future: REST API

### TypeScript Support
- Full TypeScript definitions
- Advanced type inference
- IntelliSense support
- Strict type checking

### Zero Config
- Works out of the box
- Sensible defaults
- Easy to customize

---

## 📦 Related Packages

**EDIFACT Standards (choose what you need):**
- [`@ediflow/edifact-d96a`](https://npmjs.com/package/@ediflow/edifact-d96a) - D.96A (1996) - 7 message types
- [`@ediflow/edifact-d01b`](https://npmjs.com/package/@ediflow/edifact-d01b) - D.01B (2001) - 4 message types
- [`@ediflow/edifact-d20b`](https://npmjs.com/package/@ediflow/edifact-d20b) - D.20B (2020) - 7 message types
- [`@ediflow/edifact-d12a`](https://npmjs.com/package/@ediflow/edifact-d12a) - D.12A (2012) - 196 message types

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│      Presentation Layer             │  CLI
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Application Layer              │  Use Cases
│  • ParseEDIUseCase                  │
│  • ValidateMessageUseCase           │
│  • BuildEDIUseCase                  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Domain Layer                   │  Entities
│  • EDIMessage                       │
│  • EDISegment                       │
│  • EDIElement                       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Infrastructure Layer           │  Parsers
│  • EdifactMessageParser             │
│  • FileBasedRepository              │
└─────────────────────────────────────┘
```

**Read more:** [Architecture Documentation](https://github.com/ediflow-lib/core/blob/main/docs/ARCHITECTURE.md)

---

## 📚 Documentation

- **[Quick Start Guide](https://github.com/ediflow-lib/core/blob/main/docs/QUICK_START.md)** - Get started in 5 minutes
- **[Architecture](https://github.com/ediflow-lib/core/blob/main/docs/ARCHITECTURE.md)** - Clean Architecture explained
- **[Developer Guide](https://github.com/ediflow-lib/core/blob/main/docs/DEVELOPER_GUIDE.md)** - Contributing
- **[Examples](https://github.com/ediflow-lib/core/tree/main/examples)** - Runnable TypeScript examples

---

## 🧪 Testing

Extensively tested with TDD:
- **857 tests** passing across all packages
- **Unit tests** - Domain & Application layers
- **Integration tests** - Cross-layer interactions
- **E2E tests** - Complete roundtrip validation

```bash
npm test
npm run test:watch
npm run test:coverage
```

---

## 🤝 Contributing

We welcome contributions! See:
- [Contributing Guide](https://github.com/ediflow-lib/core/blob/main/CONTRIBUTING.md)
- [Developer Guide](https://github.com/ediflow-lib/core/blob/main/docs/DEVELOPER_GUIDE.md)

---

## 📄 License

MIT License - see [LICENSE](https://github.com/ediflow-lib/core/blob/main/LICENSE)

---

## 🔗 Links

- **GitHub:** [ediflow-lib/core](https://github.com/ediflow-lib/core)
- **NPM:** [@ediflow/core](https://www.npmjs.com/package/@ediflow/core)
- **Issues:** [Report bugs](https://github.com/ediflow-lib/core/issues)
- **Discussions:** [Ask questions](https://github.com/ediflow-lib/core/discussions)

---

**Made with ❤️ for the EDI community**
