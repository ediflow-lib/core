# @ediflow/eancom-2002

> EANCOM 2002 (S4) Standard Definitions - GS1's EDIFACT Subset for Retail

[![NPM Version](https://img.shields.io/npm/v/@ediflow/eancom-2002.svg)](https://www.npmjs.com/package/@ediflow/eancom-2002)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Package Size](https://img.shields.io/bundlephobia/min/@ediflow/eancom-2002)](https://www.npmjs.com/package/@ediflow/eancom-2002)

**EANCOM 2002** • **50 Message Types** • **GS1 Standard** • **MIT Licensed** • **Free**

---

## 📦 What is this?

This package contains **EANCOM 2002 (S4) standard definitions** for use with `@ediflow/core`.

**EANCOM** is GS1's **industry-specific subset of UN/EDIFACT** optimized for retail, consumer goods, and supply chain operations.

**Includes:**
- Message structures (50 message types)
- Segment definitions
- Element definitions
- Composite definitions
- Code lists

**Version:** EANCOM 2002 (Syntax 4) - Industry standard for retail

---

## 🚀 Installation

```bash
# Install core library (required)
npm install @ediflow/core

# Install this standard package
npm install @ediflow/eancom-2002
```

---

## 📊 Supported Message Types (50)

### 🛒 Core Retail Messages
| Message Type | Description | Use Case |
|--------------|-------------|----------|
| **ORDERS** | Purchase Order | Order placement |
| **ORDRSP** | Order Response | Order confirmations |
| **DESADV** | Despatch Advice | Shipping notifications |
| **RECADV** | Receiving Advice | Goods receipt |
| **INVOIC** | Invoice | Billing documents |
| **PRICAT** | Price Catalogue | Product pricing |
| **SLSRPT** | Sales Report | Sales data |

### 📦 Logistics & Transport
| Message Type | Description |
|--------------|-------------|
| **IFTMIN** | Transport Instructions |
| **IFTSTA** | Transport Status |
| **IFCSUM** | Forwarding Summary |

### 💰 Financial Messages
| Message Type | Description |
|--------------|-------------|
| **REMADV** | Remittance Advice |
| **FINSTA** | Financial Statement |
| **PAYMUL** | Multiple Payment |
| **CREMUL** | Credit Advice |
| **DEBMUL** | Debit Advice |

### 🏭 Inventory & Planning
| Message Type | Description |
|--------------|-------------|
| **INVRPT** | Inventory Report |
| **DELFOR** | Delivery Forecast |
| **DELJIT** | JIT Delivery Schedule |
| **PRODAT** | Product Data |

**+ 32 additional message types** covering logistics, finance, and supply chain operations.

---

## 📖 Usage Example

```typescript
import { DIContainer } from '@ediflow/core';

const container = DIContainer.getInstance();
const parseUseCase = container.resolve('ParseEDIUseCase');
const validateUseCase = container.resolve('ValidateMessageUseCase');

// Parse EANCOM message
const parsed = parseUseCase.execute({
  message: eancomString,
  standard: 'EDIFACT'
});

// Validate against EANCOM 2002 structure
const validation = validateUseCase.execute({
  message: parsed.message,
  messageType: 'ORDERS',
  version: 'EANCOM2002',
  repositoryPath: './node_modules/@ediflow/eancom-2002/data'
});

if (validation.success) {
  console.log('✅ Valid EANCOM 2002 ORDERS message!');
}
```

---

## 📁 Package Contents

```
@ediflow/eancom-2002/
└── data/
    ├── codes/               # Code lists
    ├── composites.json      # Composite elements
    ├── elements.json        # Data elements
    ├── messages/            # Message structures (50 types)
    │   ├── APERAK.json
    │   ├── ORDERS.json
    │   ├── ORDRSP.json
    │   ├── DESADV.json
    │   ├── RECADV.json
    │   ├── INVOIC.json
    │   ├── PRICAT.json
    │   └── ... (43 more)
    └── segments.json        # Segment definitions
```

**Package Size:** ~1.2 MB

---

## 🎯 When to Use EANCOM 2002

**Perfect for:**
- ✅ **Retail industry** - Consumer goods, grocery, fashion
- ✅ **GS1 compliance** - Industry-standard subset
- ✅ **Supply chain** - Distribution, logistics, warehousing
- ✅ **European markets** - Widely adopted in EU
- ✅ **Established systems** - Legacy integration (2002-present)

**Industries using EANCOM:**
- 🛒 Retail & E-commerce
- 🍕 Food & Beverage
- 👕 Fashion & Apparel
- 🏥 Healthcare
- 📦 Logistics & Distribution

**Consider alternatives if:**
- 🔄 **Full UN/EDIFACT** - Need non-GS1 messages? Use `@ediflow/edifact-d*`
- 🔄 **X12** - North American standard? Use `@ediflow/x12-*`

---

## 🆚 EANCOM vs UN/EDIFACT

| Feature | EANCOM 2002 | UN/EDIFACT |
|---------|-------------|------------|
| **Message Types** | 50 (retail-focused) | 200+ (all industries) |
| **Complexity** | Simplified subset | Full specification |
| **Industry** | GS1/Retail | Cross-industry |
| **Use Case** | Supply chain | General B2B |

**EANCOM = UN/EDIFACT subset optimized for retail!**

---

## 📦 Related Packages

**Core:**
- [`@ediflow/core`](https://npmjs.com/package/@ediflow/core) - Core library (REQUIRED)

**Other EDIFACT Standards:**
- [`@ediflow/edifact-d96a`](https://npmjs.com/package/@ediflow/edifact-d96a) - D.96A (1996)
- [`@ediflow/edifact-d01b`](https://npmjs.com/package/@ediflow/edifact-d01b) - D.01B (2001)
- [`@ediflow/edifact-d12a`](https://npmjs.com/package/@ediflow/edifact-d12a) - D.12A (2012)
- [`@ediflow/edifact-d20b`](https://npmjs.com/package/@ediflow/edifact-d20b) - D.20B (2020)

---

## 📚 Documentation

- **[Quick Start Guide](https://github.com/ediflow-lib/core/blob/main/docs/QUICK_START.md)**
- **[Main README](https://github.com/ediflow-lib/core/blob/main/README.md)**
- **[Architecture](https://github.com/ediflow-lib/core/blob/main/docs/ARCHITECTURE.md)**
- **[EANCOM Examples](https://github.com/ediflow-lib/core/tree/main/examples/eancom)**

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

- **NPM:** https://npmjs.com/package/@ediflow/eancom-2002
- **GitHub:** https://github.com/ediflow-lib/core
- **GS1 EANCOM:** https://www.gs1.org/standards/edi/eancom

---

**Built with ❤️ by the EDIFlow community**

