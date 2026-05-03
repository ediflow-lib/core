# @ediflow/x12-006040

> X12 006040 (2026) Standard Definitions - Latest ANSI ASC X12 Release

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Package Size](https://img.shields.io/bundlephobia/min/@ediflow/x12-006040)](https://www.npmjs.com/package/@ediflow/x12-006040)

**X12 006040** • **319 Transaction Sets** • **Latest 2026 Release** • **MIT Licensed** • **Free**

---

## 📦 What is this?

This package contains **X12 006040 (2026) standard definitions** for use with `@ediflow/core`.

**X12 006040** is the **latest ANSI ASC X12 release** with the most comprehensive transaction set coverage.

**Includes:**
- Transaction set structures (319 transaction sets)
- Segment definitions
- Element definitions
- Composite definitions
- Code lists
- Syntax rules

**Version:** 006040 (Released 2026) - Latest standard

---

## 🚀 Installation

```bash
# Install core library (required)
npm install @ediflow/core

# This package is internal - install locally
cd packages/x12-006040
npm install
```

---

## 📊 Supported Transaction Sets (319)

### 🛒 Core Purchasing
| Transaction Set | Description | Use Case |
|----------------|-------------|----------|
| **850** | Purchase Order | Order placement |
| **855** | Purchase Order Acknowledgment | Order confirmation |
| **860** | Purchase Order Change | Order modifications |
| **865** | Purchase Order Change Acknowledgment | Change confirmation |

### 📦 Shipping & Receiving
| Transaction Set | Description | Use Case |
|----------------|-------------|----------|
| **856** | Ship Notice/Manifest | ASN (Advanced Shipping Notice) |
| **857** | Shipment & Billing Notice | Shipment details |

### 💰 Invoicing & Payment
| Transaction Set | Description | Use Case |
|----------------|-------------|----------|
| **810** | Invoice | Billing documents |
| **820** | Payment Order/Remittance | Payment processing |
| **824** | Application Advice | Transaction status |
| **997** | Functional Acknowledgment | EDI receipt confirmation |

### 🏥 Healthcare (HIPAA)
| Transaction Set | Description |
|----------------|-------------|
| **270/271** | Eligibility Inquiry/Response |
| **276/277** | Claim Status Inquiry/Response |
| **278** | Authorization Request |
| **834** | Benefit Enrollment |
| **835** | Claims Payment/Remittance |
| **837** | Healthcare Claims (I/P/D) |

### 🚚 Transportation
| Transaction Set | Description |
|----------------|-------------|
| **204** | Motor Carrier Load Tender |
| **210** | Freight Invoice |
| **214** | Transportation Shipment Status |
| **990** | Response to Load Tender |

### 📊 Inventory & Planning
| Transaction Set | Description |
|----------------|-------------|
| **846** | Inventory Inquiry/Advice |
| **830** | Planning Schedule |
| **862** | Shipping Schedule |

**+ 300+ additional transaction sets** covering all industries and use cases.

---

## 📖 Usage Example

```typescript
import { DIContainer } from '@ediflow/core';

const container = DIContainer.getInstance();
const parseUseCase = container.resolve('ParseEDIUseCase');
const validateUseCase = container.resolve('ValidateMessageUseCase');

// Parse X12 message
const parsed = parseUseCase.execute({
  message: x12String,
  standard: 'X12'
});

// Validate against 006040 structure
const validation = validateUseCase.execute({
  message: parsed.message,
  messageType: '850',
  version: '006040',
  repositoryPath: './packages/x12-006040/data'
});

if (validation.success) {
  console.log('✅ Valid 006040 850 Purchase Order!');
}
```

---

## 📁 Package Contents

```
@ediflow/x12-006040/
└── data/
    ├── codes/                    # Code lists
    │   └── codes.json
    ├── composites.json           # Composite elements
    ├── elements.json             # Data elements
    ├── index.json                # Package metadata
    ├── messages/                 # Transaction set structures (319)
    │   ├── 850.json             # Purchase Order
    │   ├── 810.json             # Invoice
    │   ├── 856.json             # ASN
    │   ├── 997.json             # Functional ACK
    │   └── ... (315 more)
    ├── segment-syntax-rules.json # Segment validation rules
    └── segments.json             # Segment definitions
```

**Package Size:** ~8.5 MB

---

## 🎯 When to Use 006040

**Use 006040 if:**
- ✅ **Latest features** - Need newest transaction sets
- ✅ **Future-proofing** - Planning for long-term compatibility
- ✅ **Development** - Testing against latest standard
- ✅ **Internal systems** - Not exchanging with external partners

**Use 004010 instead if:**
- 🔄 **Production** - Most widely adopted (industry standard)
- 🔄 **Interoperability** - Trading partners use 004010
- 🔄 **Automotive** - Industry standard for automotive

**Use 005010 instead if:**
- 🔄 **Healthcare** - HIPAA compliance required
- 🔄 **Medical claims** - 837/835 transactions

---

## 🆚 Version Comparison

| Version | Year | Transaction Sets | Use Case |
|---------|------|-----------------|----------|
| **004010** | 2000 | 293 | **Industry standard** |
| **005010** | 2012 | 310 | HIPAA healthcare |
| **006040** | 2026 | 319 | **Latest release** |

---

## 📦 Related Packages

**Core:**
- [`@ediflow/core`](https://npmjs.com/package/@ediflow/core) - Core library (REQUIRED)

**Other X12 Standards:**
- [`@ediflow/x12-004010`](https://npmjs.com/package/@ediflow/x12-004010) - 004010 (2000) - **RECOMMENDED**
- [`@ediflow/hipaa-x12-005010`](https://npmjs.com/package/@ediflow/hipaa-x12-005010) - 005010 HIPAA (2012)

---

## 📚 Documentation

- **[Quick Start Guide](https://github.com/ediflow-lib/core/blob/main/docs/QUICK_START.md)**
- **[Main README](https://github.com/ediflow-lib/core/blob/main/README.md)**
- **[Architecture](https://github.com/ediflow-lib/core/blob/main/docs/ARCHITECTURE.md)**

---

## 🤝 Contributing

Data corrections or additional transaction sets? We welcome contributions!
- [Report issues](https://github.com/ediflow-lib/core/issues)
- [Contribute](https://github.com/ediflow-lib/core/blob/main/CONTRIBUTING.md)

---

## 📄 License

MIT License - see [LICENSE](https://github.com/ediflow-lib/core/blob/main/LICENSE)

---

## 🔗 Links

- **GitHub:** https://github.com/ediflow-lib/core
- **ASC X12:** https://x12.org

---

**Built with ❤️ by the EDIFlow community**

