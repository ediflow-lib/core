# @ediflow/x12-004010

> X12 004010 (2000) Standard Definitions - Industry Standard

[![NPM Version](https://img.shields.io/npm/v/@ediflow/x12-004010.svg)](https://www.npmjs.com/package/@ediflow/x12-004010)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Package Size](https://img.shields.io/bundlephobia/min/@ediflow/x12-004010)](https://www.npmjs.com/package/@ediflow/x12-004010)

**X12 004010** • **293 Transaction Sets** • **Industry Standard** • **MIT Licensed** • **Free**

---

## 📦 What is this?

This package contains **X12 004010 (2000) standard definitions** for use with `@ediflow/core`.

**X12 004010** is the **most widely adopted** ANSI ASC X12 standard in North America, used by retail, manufacturing, automotive, logistics, and healthcare industries.

**Includes:**
- Transaction set structures (293 transaction sets)
- Segment definitions
- Element definitions
- Composite definitions
- Code lists
- Syntax rules

**Version:** 004010 (Released 2000) - Industry standard

---

## 🚀 Installation

```bash
# Install core library (required)
npm install @ediflow/core

# Install this standard package
npm install @ediflow/x12-004010
```

---

## 📊 Supported Transaction Sets (293)

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

**+ 278+ additional transaction sets** covering all industries and use cases.

---

## 📁 Package Contents

```
@ediflow/x12-004010/
└── data/
    ├── codes/                    # Code lists
    │   └── codes.json
    ├── composites.json           # Composite elements
    ├── elements.json             # Data elements
    ├── index.json                # Package metadata
    ├── messages/                 # Transaction set structures (293)
    │   ├── 850.json             # Purchase Order
    │   ├── 810.json             # Invoice
    │   ├── 856.json             # ASN
    │   ├── 997.json             # Functional ACK
    │   └── ... (289 more)
    ├── segment-syntax-rules.json # Segment validation rules
    └── segments.json             # Segment definitions
```

**Package Size:** ~7.8 MB

---

## 📖 Usage Example

```typescript
import {
  X12MessageParser,
  X12DelimiterDetector,
  X12SegmentParser,
  X12EnvelopeParser
} from '@ediflow/x12';
import { FileBasedMessageStructureRepository } from '@ediflow/infrastructure-shared';
import path from 'path';

// 1. Set up parser
const parser = new X12MessageParser(
  new X12DelimiterDetector(),
  new X12SegmentParser(),
  new X12EnvelopeParser()
);

// 2. Parse X12 850 Purchase Order
const x12String = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00401*000000001*0*P*>~GS*PO*SENDER*RECEIVER*20260204*1030*1*X*004010~ST*850*0001~BEG*00*NE*PO123456**20260210~SE*3*0001~GE*1*1~IEA*1*000000001~`;

const message = parser.parse(x12String);

console.log(message.standard);          // 'X12'
console.log(message.messageType.value); // '850'
console.log(message.version.value);     // '004010'

// 3. Load 004010 definitions
const basePath = path.resolve(__dirname, 'node_modules');
const repository = new FileBasedMessageStructureRepository(basePath);
const structure = await repository.getMessageStructure('X12', '004010', '850');

console.log(structure?.name);           // 'Purchase Order'
```

---

## 📋 Transaction Set Details

### 850 - Purchase Order

**Use Case:** Buyer sends order to supplier

**Key Segments:**
- `ST` - Transaction Set Header
- `BEG` - Order details (PO number, date, type)
- `REF` - Reference numbers (contract, customer ref, etc.)
- `DTM` - Dates (delivery, ship, etc.)
- `N1_LOOP` - Party information (BY=Buyer, SE=Seller, ST=ShipTo)
- `PO1_LOOP` - Line items (product, quantity, price)
- `CTT` - Transaction totals
- `SE` - Transaction Set Trailer

**Example:**
```
ST*850*000000001~
BEG*00*NE*PO123456**20260210~
REF*DP*ACME~
DTM*002*20260215~
N1*BY*ACME Corp*92*ACME001~
N3*123 Main Street~
N4*New York*NY*10001*US~
PO1*1*100*EA*9.99**VP*WIDGET001~
CTT*1~
SE*9*000000001~
```

### 810 - Invoice

**Use Case:** Supplier sends invoice to buyer

**Key Segments:**
- `BIG` - Invoice number, date, PO number
- `IT1_LOOP` - Line items
- `TDS` - Total dollar amount (mandatory!)
- `CTT` - Line item count

### 856 - Ship Notice/ASN

**Use Case:** Supplier notifies buyer of shipment

**Key Segments:**
- `BSN` - Shipment ID, date, time
- `HL_LOOP` - Hierarchical structure
  - Level S (Shipment)
  - Level O (Order)
  - Level P (Pack/Carton)
  - Level I (Item)

**Hierarchy Example:**
```
HL*1**S*1~        (Shipment level)
  HL*2*1*O*1~     (Order level, parent=1)
    HL*3*2*P*1~   (Pack level, parent=2)
      HL*4*3*I*0~ (Item level, parent=3, no children)
```

### 997 - Functional Acknowledgment

**Use Case:** Receiver confirms receipt of functional group

**Key Segments:**
- `AK1` - Functional group being acknowledged
- `AK2_LOOP` - Individual transaction set acknowledgments
- `AK9` - Summary (accepted/rejected counts)

**Codes:**
- `A` = Accepted
- `E` = Accepted with errors
- `R` = Rejected

---

## 🎯 When to Use 004010

**Perfect for:**
- ✅ **Industry standard** - Most widely adopted X12 version
- ✅ **Retail** - Walmart, Target, Amazon require 004010
- ✅ **Automotive** - OEMs and suppliers
- ✅ **Manufacturing** - Supply chain integration
- ✅ **Logistics** - 3PLs and freight forwarders
- ✅ **Healthcare** - Pre-HIPAA or non-regulated claims

**Industries using 004010:**
- 🛒 Retail & E-commerce
- 🚗 Automotive
- 🏭 Manufacturing
- 📦 Logistics & Transportation
- 🏥 Healthcare (non-HIPAA)

**Consider alternatives if:**
- 🔄 **HIPAA compliance** - Use `@ediflow/hipaa-x12-005010` (005010)
- 🔄 **Latest features** - Use `@ediflow/x12-006040` (006040, internal)

---

## 🆚 Version Comparison

| Version | Year | Transaction Sets | Use Case |
|---------|------|-----------------|----------|
| **004010** | 2000 | 293 | **Industry standard** |
| **005010** | 2012 | 310 | HIPAA healthcare |
| **006040** | 2026 | 319 | Latest release |

---

## 📦 Related Packages

**Core:**
- [`@ediflow/core`](https://npmjs.com/package/@ediflow/core) - Core library (REQUIRED)

**Other X12 Standards:**
- [`@ediflow/hipaa-x12-005010`](https://npmjs.com/package/@ediflow/hipaa-x12-005010) - HIPAA 005010 (Internal)
- [`@ediflow/x12-006040`](https://npmjs.com/package/@ediflow/x12-006040) - Latest 006040 (Internal)

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

- **NPM:** https://npmjs.com/package/@ediflow/x12-004010
- **GitHub:** https://github.com/ediflow-lib/core
- **ASC X12:** https://x12.org

---

**Built with ❤️ by the EDIFlow community**

MIT

