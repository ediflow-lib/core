# @ediflow/cli

**EDIFlow Command Line Interface** - Parse, Build, Validate & Export Schemas for EDI messages from the command line.

## 🆕 What's New in v0.3.0

- ✅ **X12 Support** — Parse, validate, build and export-schema for X12 (850, 810, 837, 856, ...)
- ✅ **HIPAA Support** — Healthcare 837P/837I/835 via `@ediflow/hipaa-x12-005010`
- ✅ **EANCOM Support** — GS1 retail standard via `@ediflow/eancom-2002`
- ✅ **Business Object output** — `--output-type business-object` with `--property-parse-mode`
- ✅ **Build from Business Object** — JSON with `--key-style` option
- ✅ **`--key-style`** — `code | name | camelCase | snake_case | kebab-case` (aligns with `--property-parse-mode`)

---

## 🎯 Overview

This package provides a CLI wrapper around `@ediflow/core` with support for EDIFACT, X12, EANCOM and HIPAA.

**Clean Architecture:**
- **Presentation Layer:** CLI commands (`ParseCommand`, `BuildCommand`, `ValidateCommand`, `ExportSchemaCommand`)
- **Infrastructure Layer:** DI Container that wires format-specific parsers

## 📦 Installation

```bash
npm install -g @ediflow/cli
```

## 🚀 Usage

### Parse EDI Message

```bash
# Parse EDIFACT from file
ediflow parse examples/cli/edifact/parse/input/orders.edi

# Parse X12 — output as Business Object with camelCase keys
ediflow parse examples/cli/x12/parse/input/purchase-order-850.edi --output-type business-object --property-parse-mode camelCase

# Auto-detect standard, output JSON
ediflow parse message.edi -o output.json
```

### Build EDI Message

```bash
# Build EDIFACT from raw JSON (segments)
ediflow build examples/cli/edifact/build/input/orders.json

# Build X12 850 from Business Object JSON with camelCase keys
ediflow build examples/cli/x12/build/input/purchase-order-850-business-object-camel.json --key-style camelCase
```

### Validate EDI Message

```bash
# Validate EDIFACT
ediflow validate examples/cli/edifact/validate/input/orders.edi

# Validate X12 with strict mode
ediflow validate examples/cli/x12/validate/input/purchase-order-850.edi --strict
```

### Export Schema

```bash
# Export X12 004010 850 as JSON Schema
ediflow export-schema --standard X12 --version 004010 --type 850

# Export EDIFACT D.20B ORDERS as YAML
ediflow export-schema --standard EDIFACT --version D.20B --type ORDERS --format yaml
```

## 🏗️ Architecture

```
@ediflow/cli
├── src/
│   ├── presentation/cli/
│   │   ├── commands/          # CLI Commands (Presentation Layer)
│   │   │   ├── ParseCommand.ts
│   │   │   ├── BuildCommand.ts
│   │   │   ├── ValidateCommand.ts
│   │   │   └── ExportSchemaCommand.ts
│   │   └── utils/             # CLI Utilities
│   │       ├── ErrorHandler.ts
│   │       └── OutputFormatter.ts
│   ├── infrastructure/
│   │   └── container/         # DI Container (wires format packages)
│   │       └── DIContainer.ts
│   └── index.ts               # CLI Entry Point
└── test/
    └── e2e/                   # End-to-End CLI Tests
```

## 🔌 Dependencies

- `@ediflow/core` - Core domain & application logic
- `@ediflow/edifact` - EDIFACT parser & builder
- `@ediflow/x12` - X12 parser & validator
- `commander` - CLI framework

## 📝 Examples

> **📖 See [CLI Examples on GitHub](https://github.com/ediflow-lib/core/tree/main/examples/cli) for a comprehensive guide with all commands, options, and runnable examples for EDIFACT, X12, EANCOM, and HIPAA.**
>
> Each use case has `input/` and `result/` files you can run directly.

## 🧪 Testing

```bash
npm test           # all tests (unit + e2e)
npm run test:e2e   # end-to-end only
```

## 📄 License

MIT
