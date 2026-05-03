# @ediflow/x12

> X12 EDI Parser & Validator — ANSI ASC X12 standard (850, 810, 837, 856, ...)

[![NPM Version](https://img.shields.io/npm/v/@ediflow/x12.svg)](https://www.npmjs.com/package/@ediflow/x12)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Part of the [EDIFlow](https://github.com/ediflow-lib/core) ecosystem — Modern, type-safe EDI parsing for TypeScript/JavaScript.

## 🆕 What's New in v0.3.0

- ✅ **Full X12 Parser** — ISA/GS/ST/SE/GE/IEA envelope support
- ✅ **Validation Rules** — STRICT and LENIENT validation levels
- ✅ **Schema Export** — CLI `export-schema --standard X12`
- ✅ **140 Tests** with 87%+ coverage

---

## 📦 What's This Package?

`@ediflow/x12` provides **X12-specific parsers and validators** for the ANSI ASC X12 EDI standard. It implements the `IMessageParser` port from `@ediflow/core`.

## 📥 Installation

```bash
npm install @ediflow/core @ediflow/x12 @ediflow/infrastructure-shared

# Optional: X12 message definitions
npm install @ediflow/x12-004010
```

## 🚀 Quick Start

### Parse X12 850 Purchase Order

```typescript
import {
  X12MessageParser,
  X12DelimiterDetector,
  X12SegmentParser,
  X12EnvelopeParser
} from '@ediflow/x12';

const parser = new X12MessageParser(
  new X12DelimiterDetector(),
  new X12SegmentParser(),
  new X12EnvelopeParser()
);

const x12 = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~ST*850*0001~BEG*00*SA*PO123456**20260204~PO1*1*100*EA*10.50~SE*4*0001~GE*1*1~IEA*1*000000001~`;

const message = parser.parse(x12);

console.log(message.standard);           // 'X12'
console.log(message.messageType.value);  // '850'
console.log(message.version.value);      // '005010'
console.log(message.segments.length);    // 4 (ST, BEG, PO1, SE)
```

### Validate X12 Message

```typescript
import { X12ValidationServiceBuilder, ValidationLevel } from '@ediflow/x12';

const validator = X12ValidationServiceBuilder.forX12();
const result = validator.validate(message);

if (result.isValid) {
  console.log('✅ Valid X12 message');
} else {
  result.errors.forEach(e => console.error(`❌ ${e.code}: ${e.message}`));
}
```

---

## 🏗️ Architecture

```
@ediflow/x12/
└── infrastructure/
    ├── parsers/
    │   ├── X12Tokenizer.ts           # Splits X12 by segment terminator (~)
    │   ├── X12DelimiterDetector.ts   # Extracts delimiters from ISA
    │   ├── X12SegmentParser.ts       # Parses segments into EDISegment entities
    │   ├── X12EnvelopeParser.ts      # ISA/GS/ST/SE/GE/IEA hierarchical parsing
    │   └── X12MessageParser.ts       # Full message parsing (implements IMessageParser)
    └── validation/
        ├── ValidationLevel.ts              # STRICT | LENIENT
        ├── X12ValidationServiceBuilder.ts  # Builder pattern for validators
        └── rules/
            ├── ISAMustBeFirstRule.ts
            ├── IEAMustBeLastRule.ts
            ├── X12EnvelopeIntegrityRule.ts
            └── X12SegmentTagFormatRule.ts
```

## 🎓 X12 vs EDIFACT

| Feature | X12 | EDIFACT |
|---------|-----|---------|
| **Segment Terminator** | `~` | `'` |
| **Element Separator** | `*` | `+` |
| **Envelope** | ISA/GS/ST/SE/GE/IEA | UNB/UNH/UNT/UNZ |
| **Region** | North America | Global |
| **Healthcare** | 837 (HIPAA) | — |

## 📚 Supported Transaction Sets

| Code | Name | Industry |
|------|------|----------|
| **850** | Purchase Order | Retail / Manufacturing |
| **810** | Invoice | All |
| **856** | Advance Ship Notice | Logistics |
| **837** | Healthcare Claim | Healthcare |
| **835** | Healthcare Payment | Healthcare |
| **997** | Functional Acknowledgment | All |

## 🔗 Related Packages

| Package | Description |
|---------|-------------|
| **[@ediflow/core](https://www.npmjs.com/package/@ediflow/core)** | Core domain & application logic (required) |
| **[@ediflow/infrastructure-shared](https://www.npmjs.com/package/@ediflow/infrastructure-shared)** | Repositories, cache, loaders |
| **[@ediflow/x12-004010](https://www.npmjs.com/package/@ediflow/x12-004010)** | X12 version 004010 message definitions |
| **[@ediflow/edifact](https://www.npmjs.com/package/@ediflow/edifact)** | EDIFACT parser (sibling package) |

## 🧪 Testing

```bash
npm test                # 147 tests
npm run test:coverage   # coverage report
```

## 💡 Examples

See [`examples/x12/`](https://github.com/ediflow-lib/core/tree/main/examples/x12) for runnable examples:

- **build-850** — Build a Purchase Order from scratch + round-trip verify
- **parse-850** — Parse a Purchase Order (buyer, seller, line items)
- **validate-837** — Validate a Healthcare Claim (valid + invalid scenarios)
- **schema-export** — Load X12 004010 definitions and export as JSON Schema
- **multi-message** — Parse 850, 810, 856, 997 in one run

## 📄 License

MIT — See [LICENSE](https://github.com/ediflow-lib/core/blob/main/LICENSE)

---

**Part of [EDIFlow](https://github.com/ediflow-lib/core)** — Modern, type-safe EDI for TypeScript/JavaScript
