# EDIFlow

> The Modern EDI Flow Platform

Parse, Validate, and Build any EDI standard with a modern, type-safe API.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

## 🚧 In Active Development

EDIFlow is a next-generation EDI library for TypeScript/JavaScript, designed to make EDI integration simple and enjoyable.

### 🎯 Supported Standards

**EDI Standards:**
- ✅ **EDIFACT** (UN/EDIFACT) - Q2 2026
  - D.96A, D.01B, D.20B, D.23A
  - 10+ message types (DESADV, INVOIC, ORDERS, etc.)
  - **Effort:** 12 weeks
  
- 🚧 **X12** (ANSI ASC X12) - Q4 2026
  - 004010, 005010, 008020
  - Healthcare (837, 835, 270, 271) + Logistics (850, 810, 856, 204)
  - **Effort:** 12 weeks
  
- 🚧 **IDOC** (SAP Intermediate Document) - Q2 2027
  - SAP ECC, SAP S/4HANA
  - Flat File + XML support
  - 8+ IDOC types (ORDERS05, INVOIC02, MATMAS05)
  - **Effort:** 9 weeks
  
- 🚧 **VDA** (German Automotive) - End 2027
  - VDA 4905, 4906, 4908, 4913
  - Fixed-width + CSV formats
  - **Effort:** 5 weeks

**Healthcare Standards:**
- 🔮 **HL7 v2.x** (Health Level Seven) - Q2 2028
  - 2.3, 2.5.1, 2.7
  - ADT, ORM, ORU, MDM messages
  - **Effort:** 8 weeks
  
- 🔮 **HL7 v3** (XML-based) - Q4 2028
  - CDA (Clinical Document Architecture)
  - **Effort:** 4 weeks
  
- 🔮 **FHIR** (Fast Healthcare Interoperability Resources) - Q2 2029
  - REST API based
  - JSON/XML
  - **Effort:** 6 weeks

**See [MULTI_STANDARD_SCOPE.md](docs/private/MULTI_STANDARD_SCOPE.md) for detailed analysis.**

## ✨ Features

- 🔒 **Type-Safe** - Full TypeScript support with advanced type inference
- 🌍 **Multi-Standard** - One unified API for EDIFACT, X12, IDOC, and more
- 🎯 **Zero Dependencies** - Core library has no external dependencies
- 📦 **Modular** - Use only what you need
- ⚡ **Fast** - Optimized for performance
- 🧪 **Well-Tested** - Comprehensive test coverage with TDD approach

## 🚀 Quick Start

```typescript
import { parse } from '@ediflow/core';

// Parse any EDI standard
const result = parse('EDIFACT', 'DESADV', 'D.20B', edifactString);

if (result.success) {
  console.log(result.data); // Fully typed message object
  console.log(result.data.documentNumber);
  console.log(result.data.parties);
}
```

## 📊 Standards Comparison

| Standard | Complexity | Market | Use Cases | Timeline |
|----------|-----------|--------|-----------|----------|
| **EDIFACT** | Medium | Europe, Global | Logistics, Retail, Manufacturing | Q2 2026 ✅ |
| **X12** | Medium-High | North America | Healthcare, Retail, Logistics | Q4 2026 |
| **IDOC** | Medium-High | SAP Customers | ERP Integration, Master Data | Q2 2027 |
| **VDA** | Low-Medium | German Automotive | JIT, Kanban, Quality | End 2027 |
| **HL7 v2** | Medium-High | Healthcare | Hospital Systems, Labs, Pharmacy | Q2 2028 |
| **HL7 v3** | High | Healthcare | Clinical Documents | Q4 2028 |
| **FHIR** | Medium | Healthcare | Modern APIs, Mobile Health | Q2 2029 |

**Total Development Time:** ~56 weeks (13 months focused development)

## 📚 Documentation

- **Website:** [ediflow.org](https://ediflow.org) (coming soon)
- **API Documentation:** Coming soon
- **GitHub:** [github.com/ediflow-lib](https://github.com/ediflow-lib)

## 🏗️ Architecture

EDIFlow follows Clean Architecture principles with multi-standard support from the ground up:

- **Domain Layer:** Standard-agnostic entities (EDIMessage, EDISegment, EDIElement)
- **Application Layer:** Use cases for parsing, validation, and building
- **Infrastructure Layer:** Standard-specific implementations (EDIFACT, X12, IDOC parsers)
- **Repository System:** External definition repositories per standard and version

## 🗺️ Roadmap

### Q2 2026: EDIFACT Support (Phase 1)
- ✅ Parser, Validator, Builder
- ✅ D.20B Repository (DESADV, INVOIC, ORDERS, IFTMIN, IFCSUM, IFTSTA, RECADV)
- ✅ Full TypeScript definitions
- ✅ Comprehensive test coverage (>80%)
- ✅ CLI tool
- 📦 **Release:** @ediflow/core@1.0.0

### Q4 2026: X12 Support (Phase 2)
- X12 Parser & Validator
- Version 005010 (current standard)
- Healthcare: 837, 835, 270, 271, 834
- Logistics: 850, 810, 856, 204, 214
- 📦 **Release:** @ediflow/x12-005010@1.0.0

### Q2 2027: IDOC Support (Phase 3)
- SAP Integration
- Flat File + XML format support
- Common IDOC types: ORDERS05, INVOIC02, DESADV01, MATMAS05
- 📦 **Release:** @ediflow/idoc-sap-ecc@1.0.0

### End 2027: VDA Support (Phase 4)
- German Automotive standard
- VDA 4905, 4906, 4908, 4913
- Fixed-width + CSV formats
- 📦 **Release:** @ediflow/vda-4905@1.0.0

### 2028-2029: Healthcare Standards (Phase 5-7)
**Q2 2028: HL7 v2.x**
- ADT, ORM, ORU, MDM messages
- Versions 2.3, 2.5.1, 2.7
- 📦 **Release:** @ediflow/hl7-v2@1.0.0

**Q4 2028: HL7 v3**
- XML-based Clinical Document Architecture (CDA)
- 📦 **Release:** @ediflow/hl7-v3@1.0.0

**Q2 2029: FHIR**
- REST API client
- JSON/XML resources
- Patient, Observation, Condition, etc.
- 📦 **Release:** @ediflow/fhir@1.0.0

### Future: SaaS Platform
- Cloud-based parsing & validation
- REST API
- Web UI
- Multi-language support (DE, EN, ES, RU, FR, PT, CN, JP)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📧 Contact

- **Email:** hello.ediflow@gmail.com
- **Website:** [ediflow.org](https://ediflow.org)

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

**Status:** 🚧 In Active Development  
**Version:** 0.1.0-alpha  
**Last Updated:** January 2026

Made with ❤️ for the EDI community
