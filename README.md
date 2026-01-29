# EDIFlow 🚀

> Modern EDIFACT Parser, Validator & Builder for TypeScript/JavaScript

[![NPM Version](https://img.shields.io/npm/v/@ediflow/core.svg)](https://www.npmjs.com/package/@ediflow/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-590%20passing-brightgreen)](https://github.com/ediflow-lib/ediflow)
[![Downloads](https://img.shields.io/npm/dm/@ediflow/core.svg)](https://www.npmjs.com/package/@ediflow/core)

**Clean Architecture** • **Type-Safe** • **Zero Config** • **Battle-Tested**

EDIFlow is a modern, enterprise-grade EDIFACT library built with **Clean Architecture** principles. Parse, validate, and build EDIFACT messages with full TypeScript support and comprehensive validation.

---

## ✨ Why EDIFlow?

✅ **Type-Safe** - Full TypeScript support with advanced type inference  
✅ **Clean Architecture** - SOLID principles, testable, maintainable  
✅ **Complete EDIFACT Support** - 214 message types across 4 versions  
✅ **3-Phase Validation** - Syntax → Structure → Business Logic  
✅ **Phase 2 Mapping** - Auto-convert to/from business objects  
✅ **Envelope Support** - UNH/UNT/UNB/UNZ generation & parsing  
✅ **Well-Tested** - 590 tests, 100% coverage goal  
✅ **Zero Config** - Works out of the box  

---

---

## 🚀 Quick Start

### Installation

EDIFlow is published as **5 separate NPM packages** (all MIT licensed):

```bash
# 1. Install core library (required)
npm install @ediflow/core

# 2. Install EDIFACT standard(s) you need (choose one or more)
npm install @ediflow/edifact-d20b   # Latest (2020) - 7 message types
npm install @ediflow/edifact-d12a   # Comprehensive (2012) - 196 message types
npm install @ediflow/edifact-d01b   # Legacy (2001) - 4 message types
npm install @ediflow/edifact-d96a   # Classic (1996) - 7 message types
```

### Parse EDIFACT Message

```typescript
import { DIContainer } from '@ediflow/core';

const container = DIContainer.getInstance();
const parseUseCase = container.resolve('ParseEDIUseCase');

// Parse EDIFACT string to structured message
const result = parseUseCase.execute({
  message: edifactString,
  standard: 'EDIFACT'
});

if (result.success) {
  console.log(result.message.header);      // UNH segment
  console.log(result.message.segments);    // All segments
  console.log(result.message.trailer);     // UNT segment
}
```

### Validate Message

```typescript
const validateUseCase = container.resolve('ValidateMessageUseCase');

const validation = validateUseCase.execute({
  message: result.message,
  messageType: 'ORDERS',
  version: 'D20B',
  repositoryPath: './node_modules/@ediflow/edifact-d20b/data'
});

if (validation.success) {
  console.log('✅ Message is valid!');
} else {
  console.log('❌ Validation errors:', validation.errors);
}
```

### Build EDIFACT Message

```typescript
const buildUseCase = container.resolve('BuildEDIUseCase');

const ediString = buildUseCase.execute({
  message: ediMessage,
  standard: 'EDIFACT',
  // Optional: Add envelope (UNH/UNT/UNB/UNZ)
  envelope: {
    sender: { id: 'SENDER123', qualifier: '14' },
    receiver: { id: 'RECEIVER456', qualifier: '14' }
  }
});

console.log(ediString); // Ready to send!
```

---

## 📦 Package Overview

| Package | Size | Messages | Use Case |
|---------|------|----------|----------|
| **[@ediflow/core](packages/core)** | 120 KB | - | Parser, Validator, Builder engine |
| **[@ediflow/edifact-d96a](packages/edifact-d96a)** | 0.32 MB | 7 | D.96A (1996) - Early adopters |
| **[@ediflow/edifact-d01b](packages/edifact-d01b)** | 0.36 MB | 4 | D.01B (2001) - Legacy systems |
| **[@ediflow/edifact-d20b](packages/edifact-d20b)** | 1.34 MB | 7 | D.20B (2020) - Latest standard |
| **[@ediflow/edifact-d12a](packages/edifact-d12a)** | 4.44 MB | 196 | D.12A (2012) - Full coverage |

**Total if all installed:** 6.6 MB • **214 message types** • **All MIT licensed**

💡 **Tip:** Install only what you need! Most projects need only `core` + one standard.

---

---

## 🎯 Features

### Core Features
- **Parse** - EDIFACT string → Structured EDIMessage
- **Validate** - 3-phase validation (Syntax → Structure → Business)
- **Build** - EDIMessage → EDIFACT string
- **Map** - Auto-convert to/from business objects (Phase 2)
- **Envelopes** - UNH/UNT/UNB/UNZ generation & parsing

### EDIFACT Versions Supported
- **D.96A** (1996) - 7 message types
- **D.01B** (2001) - 4 message types  
- **D.20B** (2020) - 7 message types
- **D.12A** (2012) - 196 message types (Full Coverage!)

### Message Types (214 total)
**Logistics:** DESADV, ORDERS, ORDRSP, RECADV, IFTMIN, IFTSTA, IFCSUM  
**Financial:** INVOIC, REMADV, FINSTA, PAYMUL  
**Catalog:** PRICAT, SLSRPT  
**Plus:** 200+ more message types in D.12A

---

## 🏗️ Architecture

EDIFlow follows **Clean Architecture** (Uncle Bob) with strict layer separation:

```
┌─────────────────────────────────────┐
│      Presentation Layer             │  CLI, Future: API
│      (packages/core/src/presentation)│
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Application Layer              │  Use Cases, DTOs
│      (packages/core/src/application)│  ParseEDI, ValidateMessage, BuildEDI
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Domain Layer                   │  Entities, Value Objects
│      (packages/core/src/domain)     │  EDIMessage, ValidationRules
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Infrastructure Layer           │  Parsers, Repositories
│      (packages/core/src/infrastructure)│  EdifactParser, FileBasedRepo
└─────────────────────────────────────┘
```

**Key Principles:**
- ✅ Dependencies point **inward** (Domain has zero deps)
- ✅ Domain Layer is **framework-agnostic**
- ✅ Use Cases orchestrate business logic
- ✅ Dependency Injection via DIContainer
- ✅ Repository Pattern for standard definitions

**Read more:** [Architecture Documentation](docs/ARCHITECTURE.md)

---

## 📚 Documentation

- **[Quick Start Guide](docs/QUICK_START.md)** - Get started in 5 minutes
- **[Architecture](docs/ARCHITECTURE.md)** - Clean Architecture explained
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Contributing, testing, development
- **[API Reference](docs/API.md)** - Complete API documentation
- **[Release Process](docs/RELEASE_PROCESS.md)** - How we release

### Package Documentation
- **[@ediflow/core](packages/core/README.md)** - Core library
- **[@ediflow/edifact-d96a](packages/edifact-d96a/README.md)** - D.96A standard
- **[@ediflow/edifact-d01b](packages/edifact-d01b/README.md)** - D.01B standard
- **[@ediflow/edifact-d20b](packages/edifact-d20b/README.md)** - D.20B standard
- **[@ediflow/edifact-d12a](packages/edifact-d12a/README.md)** - D.12A standard

---

## 🗺️ Roadmap

### ✅ M1 - EDIFACT Foundation (February 2026)
- EDIFACT parsing, validation, building
- 4 EDIFACT versions (D.96A, D.01B, D.20B, D.12A)
- 214 message types
- Clean Architecture
- 590 tests

### 🚀 M2 - Enhanced Features (Q2 2026)
- UNG/UNE functional groups
- More message types
- Performance optimizations
- SaaS Platform (EDIFlow Cloud)

### 🌍 M3 - Multi-Standard (Q4 2026 - 2027)
- X12 support (ANSI ASC X12)
- IDOC support (SAP)
- VDA support (Automotive)
- Unified API for all standards

---

## 🧪 Testing

EDIFlow is extensively tested with **TDD (Test-Driven Development)**:

- **590 tests** passing (Unit + Integration + E2E)
- **100% coverage goal** for critical paths
- **E2E roundtrip tests** across 3 EDIFACT versions
- **Performance tests** (< 200ms parse-build-parse cycle)

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

---

## 🤝 Contributing

We welcome contributions! EDIFlow is **MIT licensed** and built by the community.

**Ways to contribute:**
- 🐛 Report bugs via [GitHub Issues](https://github.com/ediflow-lib/ediflow/issues)
- 💡 Suggest features
- 📖 Improve documentation
- 🔧 Submit pull requests

**Getting started:**
1. Read [Contributing Guide](CONTRIBUTING.md)
2. Check [Developer Guide](docs/DEVELOPER_GUIDE.md)
3. Fork, develop, test, submit PR

---

## 👥 Community & Support

- **GitHub Discussions:** [Ask questions, share ideas](https://github.com/ediflow-lib/ediflow/discussions)
- **Issues:** [Bug reports & feature requests](https://github.com/ediflow-lib/ediflow/issues)
- **Email:** hello.ediflow@gmail.com
- **Website:** [ediflow.org](https://ediflow.org) (coming soon)

### Enterprise Support

Need professional support? We offer:
- 💼 **Enterprise Support** - SLA-based support (€5.000 - €25.000/year)
- 🔧 **Professional Services** - Custom repositories, integration (€2.000 - €15.000/project)
- 🎓 **Training & Workshops** - EDI fundamentals, Clean Architecture
- ☁️ **EDIFlow Cloud** - Parsing/Validation as a Service (coming Q2 2026)

**Contact:** hello.ediflow@gmail.com

---

## 📊 Stats

![Stars](https://img.shields.io/github/stars/ediflow-lib/ediflow?style=social)
![Forks](https://img.shields.io/github/forks/ediflow-lib/ediflow?style=social)
![Issues](https://img.shields.io/github/issues/ediflow-lib/ediflow)
![PRs](https://img.shields.io/github/issues-pr/ediflow-lib/ediflow)

- **Downloads:** Check [NPM stats](https://www.npmjs.com/package/@ediflow/core)
- **Repository:** [github.com/ediflow-lib/ediflow](https://github.com/ediflow-lib/ediflow)
- **Releases:** [See all releases](https://github.com/ediflow-lib/ediflow/releases)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

**Summary:**
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ℹ️ License and copyright notice required

---

## 🙏 Acknowledgments

EDIFlow is built with:
- **TypeScript** - Type safety
- **Vitest** - Testing framework
- **Clean Architecture** - Architecture pattern by Robert C. Martin (Uncle Bob)
- **UN/EDIFACT** - Standards by United Nations

Special thanks to the EDI community for feedback and contributions.

---

**Made with ❤️ for the EDI community**

**Status:** 🚀 Production Ready  
**Version:** 0.1.0  
**Released:** February 2026  
**Maintained by:** [EDIFlow Contributors](https://github.com/ediflow-lib/ediflow/graphs/contributors)

---

<p align="center">
  <a href="https://github.com/ediflow-lib/ediflow">⭐ Star us on GitHub</a> •
  <a href="https://www.npmjs.com/package/@ediflow/core">📦 View on NPM</a> •
  <a href="docs/QUICK_START.md">🚀 Quick Start</a> •
  <a href="https://github.com/ediflow-lib/ediflow/issues">🐛 Report Bug</a>
</p>
