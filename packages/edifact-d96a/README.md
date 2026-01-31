# @ediflow/edifact-d96a

> EDIFACT D.96A (1996) Standard Definitions

[![NPM Version](https://img.shields.io/npm/v/@ediflow/edifact-d96a.svg)](https://www.npmjs.com/package/@ediflow/edifact-d96a)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Package Size](https://img.shields.io/bundlephobia/min/@ediflow/edifact-d96a)](https://www.npmjs.com/package/@ediflow/edifact-d96a)

**EDIFACT D.96A** • **7 Message Types** • **MIT Licensed** • **Free**

---

## 📦 What is this?

This package contains **EDIFACT D.96A (1996) standard definitions** for use with `@ediflow/core`.

**Includes:**
- Message structures (7 message types)
- Segment definitions
- Element definitions
- Composite definitions
- Code lists

**Version:** D.96A (1996) - Early EDIFACT standard

---

## 🚀 Installation

```bash
# Install core library (required)
npm install @ediflow/core

# Install this standard package
npm install @ediflow/edifact-d96a
```

---

## 📊 Supported Message Types (7)

| Message Type | Description | Use Case |
|--------------|-------------|----------|
| **DESADV** | Despatch Advice | Shipping notifications |
| **INVOIC** | Invoice | Billing documents |
| **ORDERS** | Purchase Order | Order placement |
| **ORDRSP** | Order Response | Order confirmations |
| **PRICAT** | Price Catalogue | Product pricing |
| **RECADV** | Receiving Advice | Goods receipt |
| **SLSRPT** | Sales Report | Sales data |

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

// Validate against D.96A structure
const validation = validateUseCase.execute({
  message: parsed.message,
  messageType: 'ORDERS',
  version: 'D96A',
  repositoryPath: './node_modules/@ediflow/edifact-d96a/data'
});

if (validation.success) {
  console.log('✅ Valid D.96A ORDERS message!');
}
```

---

## 📁 Package Contents

```
@ediflow/edifact-d96a/
└── data/
    ├── codes/               # Code lists
    ├── composites.json      # Composite elements
    ├── elements.json        # Data elements
    ├── messages/            # Message structures (7 types)
    │   ├── DESADV.json
    │   ├── INVOIC.json
    │   ├── ORDERS.json
    │   ├── ORDRSP.json
    │   ├── PRICAT.json
    │   ├── RECADV.json
    │   └── SLSRPT.json
    └── segments.json        # Segment definitions
```

**Package Size:** ~0.32 MB

---

## 🎯 When to Use D.96A

**Use D.96A if:**
- ✅ Trading partner requires D.96A specifically
- ✅ Legacy system integration (1996-2000 era)
- ✅ Early EDIFACT adopter
- ✅ Automotive industry (early implementations)

**Consider newer versions if:**
- 🔄 **D.20B** - Latest standard (2020) - More message types
- 🔄 **D.12A** - Comprehensive (196 message types)
- 🔄 **D.01B** - Intermediate standard (2001)

---

## 📦 Related Packages

**Core:**
- [`@ediflow/core`](https://npmjs.com/package/@ediflow/core) - Core library (REQUIRED)

**Other EDIFACT Standards:**
- [`@ediflow/edifact-d01b`](https://npmjs.com/package/@ediflow/edifact-d01b) - D.01B (2001) - 4 messages
- [`@ediflow/edifact-d20b`](https://npmjs.com/package/@ediflow/edifact-d20b) - D.20B (2020) - 7 messages
- [`@ediflow/edifact-d12a`](https://npmjs.com/package/@ediflow/edifact-d12a) - D.12A (2012) - 196 messages

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
- **NPM:** [@ediflow/edifact-d96a](https://www.npmjs.com/package/@ediflow/edifact-d96a)
- **Core Package:** [@ediflow/core](https://www.npmjs.com/package/@ediflow/core)

---

**Made with ❤️ for the EDI community**
