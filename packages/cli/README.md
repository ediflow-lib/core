# @ediflow/cli

**EDIFlow Command Line Interface** - Parse, Build & Validate EDI messages from the command line.

## 🎯 Overview

This package provides a CLI wrapper around `@ediflow/core` with support for multiple EDI formats (EDIFACT, X12).

**Clean Architecture:**
- **Presentation Layer:** CLI commands (`ParseCommand`, `BuildCommand`, `ValidateCommand`)
- **Infrastructure Layer:** DI Container that wires format-specific parsers

## 📦 Installation

```bash
npm install -g @ediflow/cli
```

## 🚀 Usage

### Parse EDI Message

```bash
# Parse EDIFACT from file
ediflow parse -f message.edi -s EDIFACT -o output.json

# Parse X12 from stdin
cat message.x12 | ediflow parse -s X12

# Parse with strict validation
ediflow parse -f message.edi --strict
```

### Build EDI Message

```bash
# Build EDI from JSON
ediflow build -f input.json -o message.edi

# Build with validation
ediflow build -f input.json -o message.edi --validate
```

### Validate EDI Message

```bash
# Validate EDIFACT message
ediflow validate -f message.edi -s EDIFACT

# Validate X12 with strict mode
ediflow validate -f message.x12 -s X12 --strict
```

## 🏗️ Architecture

```
@ediflow/cli
├── src/
│   ├── presentation/cli/
│   │   ├── commands/          # CLI Commands (Presentation Layer)
│   │   │   ├── ParseCommand.ts
│   │   │   ├── BuildCommand.ts
│   │   │   └── ValidateCommand.ts
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
- `@ediflow/edifact` - EDIFACT parser
- `@ediflow/x12` - X12 parser
- `commander` - CLI framework

## 📝 Examples

### Parse EDIFACT ORDERS D.96A

```bash
ediflow parse -f examples/orders-d96a.edi -s EDIFACT
```

Output:
```json
{
  "success": true,
  "message": {
    "standard": "EDIFACT",
    "version": "D.96A",
    "messageType": "ORDERS",
    "segments": [...]
  }
}
```

### Build from JSON

```bash
ediflow build -f examples/order.json -o output.edi --validate
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run E2E tests
npm run test:e2e

# Watch mode
npm run test:watch
```

## 📄 License

MIT
