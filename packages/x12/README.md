# @ediflow/x12

> X12 EDI Parser - Format-specific infrastructure for ANSI ASC X12 standard

Part of the [EdiFlow](https://github.com/ediflow-lib/core) ecosystem - Modern, type-safe EDI parsing for TypeScript/JavaScript.

## 📦 What's This Package?

This package provides **X12-specific parsers** for the ANSI ASC X12 EDI standard. It works with `@ediflow/core` to parse X12 messages (850, 810, 837, 835, etc.).

```typescript
import { X12MessageParser } from '@ediflow/x12';
import { ParseEDIUseCase } from '@ediflow/core';

// Parse X12 message
const parser = new X12MessageParser(/* ... */);
const parseUseCase = new ParseEDIUseCase(parser, definitionLoader);
const message = parseUseCase.execute(x12Data);
```

## 🎯 Why a Separate Package?

**Clean Architecture**: 
- `@ediflow/core` = Format-agnostic domain & application logic
- `@ediflow/x12` = X12-specific parsing infrastructure  
- `@ediflow/edifact` = EDIFACT-specific parsing infrastructure

This allows you to:
- ✅ Only install parsers you need (tree-shaking)
- ✅ Keep core small and format-agnostic
- ✅ Add new formats without bloating core

## 📥 Installation

```bash
npm install @ediflow/core @ediflow/x12
```

## 🚀 Quick Start

```typescript
import { X12MessageParser } from '@ediflow/x12';
import { ParseEDIUseCase } from '@ediflow/core';

// X12 850 Purchase Order
const x12Data = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *240204*1200*U*00401*000000001*0*P*>~
GS*PO*SENDER*RECEIVER*20240204*1200*1*X*004010~
ST*850*0001~
BEG*00*SA*PO123456**20240204~
SE*3*0001~
GE*1*1~
IEA*1*000000001~`;

// Setup parser
const parser = new X12MessageParser(/* config */);
const useCase = new ParseEDIUseCase(parser, definitionLoader);

// Parse
const message = useCase.execute(x12Data);

console.log(message.getSegments());
// [ISA, GS, ST, BEG, SE, GE, IEA]
```

## 🏗️ Architecture

```
@ediflow/x12/
└── infrastructure/
    └── parsers/
        ├── X12Tokenizer.ts         # Splits X12 into tokens
        ├── X12SegmentParser.ts     # Parses segments
        ├── X12EnvelopeParser.ts    # Handles ISA/GS/GE/IEA
        └── X12MessageParser.ts     # Full message parsing
```

## 🎓 X12 vs EDIFACT

| Feature | X12 | EDIFACT |
|---------|-----|---------|
| **Delimiter** | `*` (data), `~` (segment) | `+` (data), `'` (segment) |
| **Envelope** | ISA/GS/GE/IEA | UNB/UNH/UNT/UNZ |
| **Composite** | `:` | `:` |
| **Region** | North America | Global |
| **Common Uses** | Healthcare, Retail | Logistics, Manufacturing |

## 📚 Supported Transaction Sets

- **850** - Purchase Order
- **810** - Invoice
- **837** - Healthcare Claim
- **835** - Healthcare Payment/Remittance
- **More coming soon!**

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 🔗 Related Packages

- **[@ediflow/core](https://www.npmjs.com/package/@ediflow/core)** - Core domain & application logic (required)
- **[@ediflow/edifact](https://www.npmjs.com/package/@ediflow/edifact)** - EDIFACT parser
- **[@ediflow/edifact-d96a](https://www.npmjs.com/package/@ediflow/edifact-d96a)** - EDIFACT D96A definitions

## 📖 Documentation

- [Architecture Guide](https://github.com/ediflow-lib/core/blob/main/docs/ARCHITECTURE.md)
- [Developer Guide](https://github.com/ediflow-lib/core/blob/main/docs/DEVELOPER_GUIDE.md)
- [API Documentation](https://github.com/ediflow-lib/core#api-documentation)

## 🤝 Contributing

See [CONTRIBUTING.md](https://github.com/ediflow-lib/core/blob/main/CONTRIBUTING.md)

## 📄 License

MIT - See [LICENSE](https://github.com/ediflow-lib/core/blob/main/LICENSE)

---

**Part of EdiFlow** - Modern, type-safe EDI parsing for TypeScript/JavaScript
