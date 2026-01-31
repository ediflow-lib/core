# @ediflow/edifact-d20b

> EDIFACT D.20B (2020) Standard Definitions

[![NPM Version](https://img.shields.io/npm/v/@ediflow/edifact-d20b.svg)](https://www.npmjs.com/package/@ediflow/edifact-d20b)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Package Size](https://img.shields.io/bundlephobia/min/@ediflow/edifact-d20b)](https://www.npmjs.com/package/@ediflow/edifact-d20b)

**EDIFACT D.20B** • **7 Message Types** • **MIT Licensed** • **Free**

---

## 📦 What is this?

This package contains **EDIFACT D.20B (2020) standard definitions** for use with `@ediflow/core`.

**Includes:**
- Message structures (7 message types)
- Segment definitions
- Element definitions
- Composite definitions
- Code lists

**Version:** D.20B (2020) - **Latest EDIFACT standard** ⭐

---

## 🚀 Installation

```bash
# Install core library (required)
npm install @ediflow/core

# Install this standard package
npm install @ediflow/edifact-d20b
```

---

## 📊 Supported Message Types (7)

| Message Type | Description | Use Case |
|--------------|-------------|----------|
| **APERAK** | Application Error & Acknowledgement | Error handling |
| **DESADV** | Despatch Advice | Shipping notifications |
| **IFTMIN** | Forwarding & Transport Message | Transport instructions |
| **INVOIC** | Invoice | Billing documents |
| **ORDERS** | Purchase Order | Order placement |
| **ORDRSP** | Order Response | Order confirmations |
| **RECADV** | Receiving Advice | Goods receipt |

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

// Validate against D.20B structure
const validation = validateUseCase.execute({
  message: parsed.message,
  messageType: 'ORDERS',
  version: 'D20B',
  repositoryPath: './node_modules/@ediflow/edifact-d20b/data'
});

if (validation.success) {
  console.log('✅ Valid D.20B ORDERS message!');
}
```

---

## 📁 Package Contents

```
@ediflow/edifact-d20b/
└── data/
    ├── codes/               # Code lists
    ├── composites.json      # Composite elements
    ├── elements.json        # Data elements
    ├── messages/            # Message structures (7 types)
    │   ├── APERAK.json
    │   ├── DESADV.json
    │   ├── IFTMIN.json
    │   ├── INVOIC.json
    │   ├── ORDERS.json
    │   ├── ORDRSP.json
    │   └── RECADV.json
    └── segments.json        # Segment definitions
```

**Package Size:** ~1.34 MB

---

## 🎯 When to Use D.20B

**Use D.20B if:**
- ✅ Starting new EDIFACT integration (recommended!)
- ✅ Need latest standard features
- ✅ Modern logistics & retail
- ✅ No legacy system constraints

**This is the recommended version for new projects!** ⭐

**Consider other versions if:**
- 🔄 **D.12A** - Need more message types (196 total)
- 🔄 **D.96A** or **D.01B** - Legacy partner requirements

---

## 📦 Related Packages

**Core:**
- [`@ediflow/core`](https://npmjs.com/package/@ediflow/core) - Core library (REQUIRED)

**Other EDIFACT Standards:**
- [`@ediflow/edifact-d96a`](https://npmjs.com/package/@ediflow/edifact-d96a) - D.96A (1996) - 7 messages
- [`@ediflow/edifact-d01b`](https://npmjs.com/package/@ediflow/edifact-d01b) - D.01B (2001) - 4 messages
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
- **NPM:** [@ediflow/edifact-d20b](https://www.npmjs.com/package/@ediflow/edifact-d20b)
- **Core Package:** [@ediflow/core](https://www.npmjs.com/package/@ediflow/core)

---

**Made with ❤️ for the EDI community**
