# @ediflow/edifact

> EDIFACT EDI Parser - Format-specific infrastructure for UN/EDIFACT standard

Part of the [EdiFlow](https://github.com/ediflow-lib/core) ecosystem - Modern, type-safe EDI parsing for TypeScript/JavaScript.

---

## 🆕 What's in v0.3.0

- ✅ **Full EDIFACT parser** — UNB/UNH/UNT/UNZ envelope support
- ✅ **Builder + EnvelopeBuilder** — Construct and wrap messages programmatically
- ✅ **Validation** — `EdifactValidationServiceBuilder` with STRICT/LENIENT levels
- ✅ **All data packages** — D.96A, D.01B, D.12A, D.20B, EANCOM 2002

---

This package provides **EDIFACT-specific parsers, builders, and validators** for the UN/EDIFACT standard.

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
console.log(message.messageType.value); // 'ORDERS'
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
  EdifactSegmentParser,
  EdifactValidationServiceBuilder,
} from '@ediflow/edifact';

const edifact = `UNB+UNOC:3+SENDER:14+RECEIVER:14+260503:0800+1'` +
                `UNH+1+ORDERS:D:96A:UN'` +
                `BGM+220+PO-001+9'` +
                `DTM+137:20260503:102'` +
                `UNT+4+1'` +
                `UNZ+1+1'`;

// 1. Parse
const parser = new EdifactMessageParser(
  new EdifactDelimiterDetector(),
  new EdifactTokenizer(),
  new EdifactSegmentParser(),
);
const message = parser.parse(edifact);

console.log(message.standard);           // 'EDIFACT'
console.log(message.version.value);      // 'D.96A'
console.log(message.messageType.value);  // 'ORDERS'
console.log(message.segments.length);    // 4 (BGM, DTM + envelope stripped)

// 2. Validate
const validator = EdifactValidationServiceBuilder.forEDIFACT();
const result    = validator.validate(message);
console.log(result.isValid);             // true
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

Works with all EDIFACT data packages (all MIT licensed):

| Package | Messages | Description |
|---------|----------|-------------|
| **[@ediflow/edifact-d96a](https://www.npmjs.com/package/@ediflow/edifact-d96a)** | 126 | D.96A (1996) |
| **[@ediflow/edifact-d01b](https://www.npmjs.com/package/@ediflow/edifact-d01b)** | 211 | D.01B (2001) |
| **[@ediflow/edifact-d20b](https://www.npmjs.com/package/@ediflow/edifact-d20b)** | 195 | D.20B (2020) — latest |
| **[@ediflow/edifact-d12a](https://www.npmjs.com/package/@ediflow/edifact-d12a)** | 196 | D.12A (2012) — most complete |
| **[@ediflow/eancom-2002](https://www.npmjs.com/package/@ediflow/eancom-2002)** | 49 | EANCOM 2002 — GS1 retail |

**Total: 777 unique message types** across all EDIFACT versions.

### Message Type Categories (D.12A — 196 types)

**📦 Supply Chain & Logistics**
DESADV, ORDERS, ORDRSP, ORDCHG, DELFOR, DELJIT, RECADV, COPARN, COREOR, COPRAR, COPINO, IFTMIN, IFTMAN, IFTMBC, IFTMCS, IFTSTA, IFTSAI, IFCSUM, COSTCO, COSTOR

**💰 Finance & Payment**
INVOIC, REMADV, PAYORD, PAYEXT, PAYMUL, PAYDUC, FINSTA, FINPAY, CREADV, CREEXT, CREMUL, DEBADV, DEBMUL, DEBREC, DIRDEB

**📋 Catalog & Inventory**
PRICAT, PRIHIS, INVRPT, SLSRPT, SLSFCT, QUOTES, REQOTE

**🚢 Transport & Customs**
CUSCAR, CUSDEC, CUSEXP, CUSRES, BAPLIE, COARRI, CODECO, VESDEP, MOVINS, BERMAN, HANMOV, IFTSTQ, IFTDGN, SAFHAZ, PAXLST

**🏥 Healthcare**
MEQPOS, MEDPID, MEDPRE, MEDREQ, MEDRPT, MEDRUC, INSDES, INSREQ, INSPRE, INSRPT

**🏦 Banking & Trade Finance**
BANSTA, DOCADV, DOCAPP, DOCARE, DOCAMA, DOCAMI, DOCAMR, DOCINF, BOPBNK, BOPCUS, BOPDIR, BOPINF

**📊 Reporting & Statistics**
STATAC, STLRPT, TPFREP, INVRPT, RDRMES, ITRRPT, GENRAL, GESMES

**Plus:** PARTIN, AUTHOR, APERAK, CONTRL, KEYMAN, and 100+ more

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
- [EDIFACT Examples on GitHub](https://github.com/ediflow-lib/core/tree/main/examples/edifact)

## 🤝 Contributing

See [CONTRIBUTING.md](https://github.com/ediflow-lib/core/blob/main/CONTRIBUTING.md)

## 📄 License

MIT - See [LICENSE](https://github.com/ediflow-lib/core/blob/main/LICENSE)

---

**Part of EdiFlow** - Modern, type-safe EDI parsing for TypeScript/JavaScript
