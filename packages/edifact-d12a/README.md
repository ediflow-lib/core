# @ediflow/edifact-d12a

> EDIFACT D.12A (2012) Standard Definitions - Full Coverage

[![NPM Version](https://img.shields.io/npm/v/@ediflow/edifact-d12a.svg)](https://www.npmjs.com/package/@ediflow/edifact-d12a)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Package Size](https://img.shields.io/bundlephobia/min/@ediflow/edifact-d12a)](https://www.npmjs.com/package/@ediflow/edifact-d12a)

**EDIFACT D.12A** • **196 Message Types** • **MIT Licensed** • **Free**

---

## 📦 What is this?

This package contains **EDIFACT D.12A (2012) standard definitions** for use with `@ediflow/core`.

**Includes:**
- Message structures (196 message types - **FULL COVERAGE**)
- Segment definitions
- Element definitions
- Composite definitions
- Code lists

**Version:** D.12A (2012) - **Comprehensive EDIFACT standard** 🎯

---

## 🚀 Installation

```bash
# Install core library (required)
npm install @ediflow/core

# Install this standard package
npm install @ediflow/edifact-d12a
```

---

## 📊 Supported Message Types (196)

### Logistics (Sample)
- **DESADV** - Despatch Advice
- **ORDERS** - Purchase Order
- **ORDRSP** - Order Response
- **RECADV** - Receiving Advice
- **IFTMIN** - Forwarding & Transport
- **IFTSTA** - Transport Status
- **IFCSUM** - Consolidation Summary

### Financial (Sample)
- **INVOIC** - Invoice
- **REMADV** - Remittance Advice
- **FINSTA** - Financial Statement
- **PAYMUL** - Multiple Payment Order
- **CREADV** - Credit Advice

### Catalog & Pricing (Sample)
- **PRICAT** - Price Catalogue
- **SLSRPT** - Sales Report
- **PRODAT** - Product Data

### Healthcare (Sample)
- **MEDPID** - Person Identification
- **MEDPRE** - Prescription
- **MEDRPT** - Medical Service Report

### And 180+ more message types! 🚀

---

## 📖 Usage Example

```typescript
import { DIContainer } from '@ediflow/core';

const container = DIContainer.getInstance();
const parseUseCase = container.resolve('ParseEDIUseCase');
const validateUseCase = container.resolve('ValidateMessageUseCase');

// Parse EDIFACT message
const parsed = parseUseCase.execute({
  message: edifactString,
  standard: 'EDIFACT'
});

// Validate against D.12A structure
const validation = validateUseCase.execute({
  message: parsed.message,
  messageType: 'ORDERS', // Any of 196 message types!
  version: 'D12A',
  repositoryPath: './node_modules/@ediflow/edifact-d12a/data'
});

if (validation.success) {
  console.log('✅ Valid D.12A message!');
}
```

---

## 📁 Package Contents

```
@ediflow/edifact-d12a/
└── data/
    ├── codes/               # Code lists
    ├── composites.json      # Composite elements
    ├── elements.json        # Data elements
    ├── messages/            # Message structures (196 types!)
    │   ├── APERAK.json
    │   ├── DESADV.json
    │   ├── INVOIC.json
    │   ├── ORDERS.json
    │   ├── PRICAT.json
    │   ├── ... (191 more)
    └── segments.json        # Segment definitions
```

**Package Size:** ~4.44 MB

---

## 🎯 When to Use D.12A

**Use D.12A if:**
- ✅ Need comprehensive message type coverage
- ✅ Multi-industry integrations (logistics, finance, healthcare)
- ✅ Large-scale EDI hub or service provider
- ✅ Want all message types in one package
- ✅ Don't want to worry about missing message types

**This is the most comprehensive EDIFACT package!** 🎯

**Consider lighter versions if:**
- 🔄 **D.20B** - Latest standard, but only 7 message types
- 🔄 **D.96A** or **D.01B** - Legacy requirements with fewer message types

---

## 📦 Message Type Categories

### Business Documents (60+)
ORDERS, ORDRSP, INVOIC, REMADV, QUOTES, REQOTE, ORDCHG, and more

### Logistics & Transport (50+)
DESADV, RECADV, IFTMIN, IFTSTA, IFCSUM, IFTMAN, COPARN, and more

### Financial (30+)
FINSTA, PAYMUL, PAYORD, CREADV, DEBADV, BANSTA, and more

### Catalog & Product (20+)
PRICAT, PRODAT, SLSRPT, INVRPT, PRIHIS, and more

### Healthcare (15+)
MEDPID, MEDPRE, MEDRPT, MEDRUC, and more

### Customs & Trade (15+)
CUSCAR, CUSDEC, CUSREP, CUSRES, and more

### And many more categories! 🌟

---

## 📦 Related Packages

**Core:**
- [`@ediflow/core`](https://npmjs.com/package/@ediflow/core) - Core library (REQUIRED)

**Other EDIFACT Standards:**
- [`@ediflow/edifact-d96a`](https://npmjs.com/package/@ediflow/edifact-d96a) - D.96A (1996) - 7 messages
- [`@ediflow/edifact-d01b`](https://npmjs.com/package/@ediflow/edifact-d01b) - D.01B (2001) - 4 messages
- [`@ediflow/edifact-d20b`](https://npmjs.com/package/@ediflow/edifact-d20b) - D.20B (2020) - 7 messages
- [`@ediflow/eancom-2002`](https://npmjs.com/package/@ediflow/eancom-2002) - EANCOM 2002 - 50 messages (GS1 Retail)

---

## 💡 Why 198 Message Types?

D.12A represents the **mature EDIFACT standard** (2012) with extensive industry coverage:

- **Enterprise Ready** - Handle any EDIFACT message your partners send
- **Future Proof** - Support new message types without upgrading
- **One Package** - No need to install multiple versions
- **Complete** - Covers logistics, finance, healthcare, customs, and more

**Perfect for:**
- EDI service providers
- Multi-industry businesses
- Large enterprises
- EDI hubs and platforms

---

## 📚 Documentation

- **[Quick Start Guide](https://github.com/ediflow-lib/core/blob/main/docs/QUICK_START.md)**
- **[Main README](https://github.com/ediflow-lib/core/blob/main/README.md)**
- **[Architecture](https://github.com/ediflow-lib/core/blob/main/docs/ARCHITECTURE.md)**

---

## 🤝 Contributing

Data corrections or additional message types? We welcome contributions!
- [Report issues](https://github.com/ediflow-lib/core/issues)
- [Contribute](https://github.com/ediflow-lib/core/blob/main/CONTRIBUTING.md)

---

## 📄 License

MIT License - see [LICENSE](https://github.com/ediflow-lib/core/blob/main/LICENSE)

---

## 🔗 Links

- **GitHub:** [ediflow-lib/core](https://github.com/ediflow-lib/core)
- **NPM:** [@ediflow/edifact-d12a](https://www.npmjs.com/package/@ediflow/edifact-d12a)
- **Core Package:** [@ediflow/core](https://www.npmjs.com/package/@ediflow/core)

---

**Made with ❤️ for the EDI community**
