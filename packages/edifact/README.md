# @ediflow/edifact

> EDIFACT EDI Parser - Format-specific infrastructure for UN/EDIFACT standard

Part of the [EdiFlow](https://github.com/ediflow-lib/core) ecosystem - Modern, type-safe EDI parsing for TypeScript/JavaScript.

---

## 🆕 Updated in v0.2.0!

This package has been **restructured** in v0.2.0 for Clean Architecture!

**What changed:**
- ✅ **Clean Architecture** - Infrastructure separated from domain
- ✅ **Same functionality** - All parsers/builders still work
- ✅ **Better organized** - Clearer code structure

**Migration:**
If you used `@ediflow/core` parsers before, now use `@ediflow/edifact`:
```typescript
// Before (v0.1.x)
import { EdifactMessageParser } from '@ediflow/core';

// After (v0.2.0) - Recommended
import { EdifactMessageParser } from '@ediflow/edifact';
```

---

This package provides **EDIFACT-specific parsers** for the UN/EDIFACT EDI standard. It works with `@ediflow/core` to parse EDIFACT messages (ORDERS, INVOIC, DESADV, etc.).

```typescript
import { EdifactMessageParser } from '@ediflow/edifact';
import { ParseEDIUseCase } from '@ediflow/core';

// Parse EDIFACT message
const parser = new EdifactMessageParser(/* ... */);
const parseUseCase = new ParseEDIUseCase(parser, definitionLoader);
const message = parseUseCase.execute(edifactData);
```

## 🔄 Migration from @ediflow/core

**⚠️ Important:** EDIFACT parsers in `@ediflow/core` are deprecated and will be removed in v1.0.0.

### Before (Deprecated):
```typescript
import { EdifactMessageParser } from '@ediflow/core/infrastructure';
```

### After (Recommended):
```typescript
import { EdifactMessageParser } from '@ediflow/edifact';
```

### Installation:
```bash
# Old way (still works but deprecated):
npm install @ediflow/core

# New way (recommended):
npm install @ediflow/core @ediflow/edifact
```

## 🎯 Why a Separate Package?

**Clean Architecture**: 
- `@ediflow/core` = Format-agnostic domain & application logic
- `@ediflow/edifact` = EDIFACT-specific parsing infrastructure  
- `@ediflow/x12` = X12-specific parsing infrastructure

This allows you to:
- ✅ Only install parsers you need (tree-shaking)
- ✅ Keep core small and format-agnostic
- ✅ Add new formats without bloating core

## 📥 Installation

```bash
npm install @ediflow/core @ediflow/edifact
```

## 🚀 Quick Start

```typescript
import { 
  EdifactMessageParser,
  EdifactDelimiterDetector,
  EdifactTokenizer,
  EdifactSegmentParser 
} from '@ediflow/edifact';
import { ParseEDIUseCase, RepositoryManager } from '@ediflow/core';

// EDIFACT ORDERS D96A message
const edifactData = `UNB+UNOC:3+SENDER+RECEIVER+240204:1200+1++ORDERS'UNH+1+ORDERS:D:96A:UN'BGM+220+ORDER123+9'DTM+137:20240204:102'UNT+4+1'UNZ+1+1'`;

// Setup parsers
const delimiterDetector = new EdifactDelimiterDetector();
const tokenizer = new EdifactTokenizer();
const segmentParser = new EdifactSegmentParser();
const messageParser = new EdifactMessageParser(
  delimiterDetector,
  tokenizer,
  segmentParser
);

// Setup use case
const repositoryManager = new RepositoryManager();
const definitionLoader = createDefinitionLoader(repositoryManager);
const useCase = new ParseEDIUseCase(messageParser, definitionLoader);

// Parse
const message = useCase.execute(edifactData);

console.log(message.getSegments());
// [UNB, UNH, BGM, DTM, UNT, UNZ]
```

## 🏗️ Architecture

```
@ediflow/edifact/
└── infrastructure/
    └── parsers/
        ├── EdifactTokenizer.ts           # Splits EDIFACT into tokens
        ├── EdifactSegmentParser.ts       # Parses segments
        ├── EdifactDelimiterDetector.ts   # Detects delimiters from UNA
        └── EdifactMessageParser.ts       # Full message parsing
```

## 🎓 EDIFACT Delimiters

| Delimiter | Default | Purpose | Example |
|-----------|---------|---------|---------|
| **Component** | `:` | Separates composite elements | `UNOC:3` |
| **Data Element** | `+` | Separates data elements | `UNB+UNOC:3+...` |
| **Decimal** | `.` | Decimal point | `123.45` |
| **Escape** | `?` | Escapes special characters | `TEST?+DATA` |
| **Segment** | `'` | Terminates segments | `UNH+1+ORDERS:D:96A:UN'` |

**UNA Segment** (optional): `UNA:+.? '` - Defines custom delimiters

## 📚 Supported Message Types

Works with all EDIFACT versions through data packages:
- **[@ediflow/edifact-d96a](https://www.npmjs.com/package/@ediflow/edifact-d96a)** - Version D.96A
- **[@ediflow/edifact-d01b](https://www.npmjs.com/package/@ediflow/edifact-d01b)** - Version D.01B
- **[@ediflow/edifact-d12a](https://www.npmjs.com/package/@ediflow/edifact-d12a)** - Version D.12A
- **[@ediflow/edifact-d20b](https://www.npmjs.com/package/@ediflow/edifact-d20b)** - Version D.20B

Common message types: ORDERS, INVOIC, DESADV, ORDRSP, PRICAT, etc.

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
- **[@ediflow/x12](https://www.npmjs.com/package/@ediflow/x12)** - X12 parser
- **[@ediflow/edifact-d96a](https://www.npmjs.com/package/@ediflow/edifact-d96a)** - EDIFACT D96A definitions

## 📖 Documentation

- [Architecture Guide](https://github.com/ediflow-lib/core/blob/main/docs/ARCHITECTURE.md)
- [Developer Guide](https://github.com/ediflow-lib/core/blob/main/docs/DEVELOPER_GUIDE.md)
- [Quick Start](https://github.com/ediflow-lib/core/blob/main/docs/QUICK_START.md)
- [API Documentation](https://github.com/ediflow-lib/core#api-documentation)

## 🤝 Contributing

See [CONTRIBUTING.md](https://github.com/ediflow-lib/core/blob/main/CONTRIBUTING.md)

## 📄 License

MIT - See [LICENSE](https://github.com/ediflow-lib/core/blob/main/LICENSE)

---

**Part of EdiFlow** - Modern, type-safe EDI parsing for TypeScript/JavaScript
