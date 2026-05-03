# @ediflow/hipaa-x12-005010

> HIPAA X12 005010 Standard Definitions - Healthcare Transaction Sets

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Package Size](https://img.shields.io/bundlephobia/min/@ediflow/hipaa-x12-005010)](https://www.npmjs.com/package/@ediflow/hipaa-x12-005010)

**HIPAA 005010** • **14 Transaction Sets** • **Healthcare Standard** • **MIT Licensed** • **Free**

---

## 📦 What is this?

This package contains **HIPAA X12 005010 standard definitions** for use with `@ediflow/core`.

**HIPAA 005010** is the **mandated standard for healthcare transactions** in the United States, required by the Health Insurance Portability and Accountability Act (HIPAA).

**Includes:**
- Healthcare transaction set structures (14 transaction sets)
- Segment definitions
- Element definitions
- Composite definitions
- Code lists
- HIPAA-specific syntax rules

**Version:** 005010 (Mandated 2012) - HIPAA compliance standard

---

## 🚀 Installation

```bash
# Install core library (required)
npm install @ediflow/core

# This package is internal - install locally
cd packages/hipaa-x12-005010
npm install
```

---

## 📊 Supported Transaction Sets (14)

### 🏥 Eligibility & Benefits
| Transaction Set | Version | Description | Use Case |
|----------------|---------|-------------|----------|
| **270** | B1 | Eligibility Inquiry | Check patient coverage |
| **271** | B1 | Eligibility Response | Coverage details |

### 💰 Claims & Remittance
| Transaction Set | Version | Description | Use Case |
|----------------|---------|-------------|----------|
| **837** | Q1 | Professional Claims (837P) | Physician claims |
| **837** | Q2 | Institutional Claims (837I) | Hospital claims |
| **837** | Q3 | Dental Claims (837D) | Dental claims |
| **835** | W1 | Claims Payment/Remittance | Payment advice |

### 📋 Claim Status
| Transaction Set | Version | Description | Use Case |
|----------------|---------|-------------|----------|
| **276** | A1 | Claim Status Inquiry | Check claim status |
| **277** | A1 | Claim Status Response | Status details |
| **277** | B3 | Claim Acknowledgment | Claim receipt |

### 🔐 Authorization
| Transaction Set | Version | Description | Use Case |
|----------------|---------|-------------|----------|
| **278** | A1 | Authorization Request | Prior authorization |
| **278** | A3 | Authorization Response | Authorization decision |

### 👥 Enrollment & Membership
| Transaction Set | Version | Description | Use Case |
|----------------|---------|-------------|----------|
| **834** | A1 | Benefit Enrollment | Member enrollment |
| **820** | A1 | Premium Payment | Premium processing |

### ✅ Acknowledgments
| Transaction Set | Version | Description | Use Case |
|----------------|---------|-------------|----------|
| **999** | A1 | Implementation Acknowledgment | HIPAA acknowledgment |

---

## 📖 Usage Example

```typescript
import { DIContainer } from '@ediflow/core';

const container = DIContainer.getInstance();
const parseUseCase = container.resolve('ParseEDIUseCase');
const validateUseCase = container.resolve('ValidateMessageUseCase');

// Parse HIPAA X12 message
const parsed = parseUseCase.execute({
  message: x12String,
  standard: 'X12'
});

// Validate against HIPAA 005010 structure
const validation = validateUseCase.execute({
  message: parsed.message,
  messageType: '837-Q1',  // Professional Claims
  version: '005010',
  repositoryPath: './packages/hipaa-x12-005010/data'
});

if (validation.success) {
  console.log('✅ Valid HIPAA 837P Professional Claim!');
}
```

---

## 📁 Package Contents

```
@ediflow/hipaa-x12-005010/
└── data/
    ├── codes/                    # Code lists
    ├── composites.json           # Composite elements
    ├── elements.json             # Data elements
    ├── messages/                 # Transaction set structures (14)
    │   ├── 270-B1.json          # Eligibility Inquiry
    │   ├── 271-B1.json          # Eligibility Response
    │   ├── 276-A1.json          # Claim Status Inquiry
    │   ├── 277-A1.json          # Claim Status Response
    │   ├── 277-B3.json          # Claim Acknowledgment
    │   ├── 278-A1.json          # Auth Request
    │   ├── 278-A3.json          # Auth Response
    │   ├── 820-A1.json          # Premium Payment
    │   ├── 834-A1.json          # Enrollment
    │   ├── 835-W1.json          # Remittance
    │   ├── 837-Q1.json          # Professional Claims
    │   ├── 837-Q2.json          # Institutional Claims
    │   ├── 837-Q3.json          # Dental Claims
    │   └── 999-A1.json          # Implementation ACK
    ├── segment-syntax-rules.json # HIPAA-specific rules
    └── segments.json             # Segment definitions
```

**Package Size:** ~1.8 MB

---

## 🎯 When to Use HIPAA 005010

**Use HIPAA 005010 if:**
- ✅ **Healthcare industry** - Medical claims, eligibility, etc.
- ✅ **HIPAA compliance** - Required by law (US healthcare)
- ✅ **Payers/Providers** - Insurance companies, hospitals, clinics
- ✅ **Clearinghouses** - Healthcare data exchange
- ✅ **837/835/270/271** - Healthcare-specific transactions

**Use X12 004010 instead if:**
- 🔄 **Non-healthcare** - Retail, logistics, manufacturing
- 🔄 **General B2B** - Purchase orders, invoices, ASNs

---

## 🏥 HIPAA Transaction Overview

### Claims Flow
```
1. 837 → Submit claim (Provider → Payer)
2. 277 → Acknowledge receipt (Payer → Provider)
3. 835 → Payment/remittance (Payer → Provider)
```

### Eligibility Flow
```
1. 270 → Check eligibility (Provider → Payer)
2. 271 → Eligibility response (Payer → Provider)
```

### Authorization Flow
```
1. 278 Request → Prior auth request (Provider → Payer)
2. 278 Response → Authorization decision (Payer → Provider)
```

---

## 🆚 Version Comparison

| Version | Year | Use Case | Transaction Sets |
|---------|------|----------|-----------------|
| **004010** | 2000 | General X12 | 293 |
| **005010** | 2012 | **HIPAA Healthcare** | 310 (14 HIPAA) |
| **006040** | 2026 | Latest X12 | 319 |

**005010 = 004010 base + HIPAA-specific healthcare enhancements**

---

## ⚠️ HIPAA Compliance Notes

**This package provides HIPAA transaction structure definitions.**

**For full HIPAA compliance, you must also implement:**
- ✅ **Security Rules** - Encryption, access controls
- ✅ **Privacy Rules** - PHI protection
- ✅ **Transaction Rules** - This package helps here!
- ✅ **Code Set Rules** - ICD-10, CPT, HCPCS
- ✅ **Identifier Rules** - NPI, EIN

**Consult HIPAA legal counsel for compliance requirements.**

---

## 📦 Related Packages

**Core:**
- [`@ediflow/core`](https://npmjs.com/package/@ediflow/core) - Core library (REQUIRED)

**Other X12 Standards:**
- [`@ediflow/x12-004010`](https://npmjs.com/package/@ediflow/x12-004010) - 004010 General X12
- [`@ediflow/x12-006040`](https://npmjs.com/package/@ediflow/x12-006040) - 006040 Latest (Internal)

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

**Note:** This license applies to the software only. HIPAA compliance is your responsibility.

---

## 🔗 Links

- **GitHub:** https://github.com/ediflow-lib/core
- **ASC X12:** https://x12.org
- **CMS HIPAA:** https://www.cms.gov/regulations-and-guidance/administrative-simplification/hipaa-aca

---

**Built with ❤️ by the EDIFlow community**

