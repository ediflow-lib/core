# @ediflow/edifact-d01b

> EDIFACT D.01B (2001) Standard Definitions

[![NPM Version](https://img.shields.io/npm/v/@ediflow/edifact-d01b.svg)](https://www.npmjs.com/package/@ediflow/edifact-d01b)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Package Size](https://img.shields.io/bundlephobia/min/@ediflow/edifact-d01b)](https://www.npmjs.com/package/@ediflow/edifact-d01b)

**EDIFACT D.01B** • **4 Message Types** • **MIT Licensed** • **Free**

---

## 📦 What is this?

This package contains **EDIFACT D.01B (2001) standard definitions** for use with `@ediflow/core`.

**Includes:**
- Message structures (4 message types)
- Segment definitions
- Element definitions
- Composite definitions
- Code lists

**Version:** D.01B (2001) - Intermediate EDIFACT standard

---

## 🚀 Installation

```bash
# Install core library (required)
npm install @ediflow/core

# Install this standard package
npm install @ediflow/edifact-d01b
```

---

## 📊 Supported Message Types (4)

| Message Type | Description | Use Case |
|--------------|-------------|----------|
| **IFCSUM** | Forwarding & Consolidation Summary | Freight forwarding |
| **IFTMIN** | Forwarding & Transport Message | Transport instructions |
| **IFTSTA** | Transport Status Message | Shipment tracking |
| **INVOIC** | Invoice | Billing documents |

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

// Validate against D.01B structure
const validation = validateUseCase.execute({
  message: parsed.message,
  messageType: 'IFTMIN',
  version: 'D01B',
  repositoryPath: './node_modules/@ediflow/edifact-d01b/data'
});

if (validation.success) {
  console.log('✅ Valid D.01B IFTMIN message!');
}
```

---

## 📁 Package Contents

```
@ediflow/edifact-d01b/
└── data/
    ├── codes/               # Code lists
    ├── composites.json      # Composite elements
    ├── elements.json        # Data elements
    ├── messages/            # Message structures (4 types)
    │   ├── IFCSUM.json
    │   ├── IFTMIN.json
    │   ├── IFTSTA.json
    │   └── INVOIC.json
    └── segments.json        # Segment definitions
```

**Package Size:** ~0.36 MB

---

## 🎯 When to Use D.01B

**Use D.01B if:**
- ✅ Trading partner requires D.01B specifically
- ✅ Legacy system integration (2001-2010 era)
- ✅ Transportation & logistics focus
- ✅ Freight forwarding industry

**Consider other versions if:**
- 🔄 **D.20B** - Latest standard (2020) - More message types
- 🔄 **D.12A** - Comprehensive (196 message types)
- 🔄 **D.96A** - Older standard (1996) - 7 message types

---

## 📦 Related Packages

**Core:**
- [`@ediflow/core`](https://npmjs.com/package/@ediflow/core) - Core library (REQUIRED)

**Other EDIFACT Standards:**
- [`@ediflow/edifact-d96a`](https://npmjs.com/package/@ediflow/edifact-d96a) - D.96A (1996) - 7 messages
- [`@ediflow/edifact-d20b`](https://npmjs.com/package/@ediflow/edifact-d20b) - D.20B (2020) - 7 messages
- [`@ediflow/edifact-d12a`](https://npmjs.com/package/@ediflow/edifact-d12a) - D.12A (2012) - 196 messages

---

## 📚 Documentation

- **[Quick Start Guide](https://github.com/ediflow-lib/ediflow/blob/main/docs/QUICK_START.md)**
- **[Main README](https://github.com/ediflow-lib/ediflow/blob/main/README.md)**
- **[Architecture](https://github.com/ediflow-lib/ediflow/blob/main/docs/ARCHITECTURE.md)**

---

## 🤝 Contributing

Data corrections or additional message types? We welcome contributions!
- [Report issues](https://github.com/ediflow-lib/ediflow/issues)
- [Contribute](https://github.com/ediflow-lib/ediflow/blob/main/CONTRIBUTING.md)

---

## 📄 License

MIT License - see [LICENSE](https://github.com/ediflow-lib/ediflow/blob/main/LICENSE)

---

## 🔗 Links

- **GitHub:** [ediflow-lib/ediflow](https://github.com/ediflow-lib/ediflow)
- **NPM:** [@ediflow/edifact-d01b](https://www.npmjs.com/package/@ediflow/edifact-d01b)
- **Core Package:** [@ediflow/core](https://www.npmjs.com/package/@ediflow/core)

---

**Made with ❤️ for the EDI community**
