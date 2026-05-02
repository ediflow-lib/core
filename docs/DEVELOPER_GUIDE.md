# Developer Guide - EDIFlow

Welcome to EDIFlow development! This guide helps you contribute to the project.

---

## 🎯 Table of Contents

1. [Getting Started](#-getting-started)
2. [Development Setup](#-development-setup)
3. [Project Structure](#-project-structure)
4. [Development Workflow](#-development-workflow)
5. [Testing](#-testing)
6. [Code Style](#-code-style)
7. [Git Workflow](#-git-workflow)
8. [Pull Request Process](#-pull-request-process)
9. [Troubleshooting](#-troubleshooting)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git** >= 2.30.0
- **TypeScript** knowledge
- **Clean Architecture** understanding (read [ARCHITECTURE.md](ARCHITECTURE.md))

### Fork & Clone

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/ediflow.git
cd ediflow

# 3. Add upstream remote
git remote add upstream https://github.com/ediflow-lib/core.git

# 4. Install dependencies
npm install
```

---

## 💻 Development Setup

### Install Dependencies

```bash
# Install all dependencies (workspace)
npm install
```

This installs dependencies for **all packages**:
- `@ediflow/core` - Domain + Application
- `@ediflow/edifact` - EDIFACT infrastructure
- `@ediflow/x12` - X12 infrastructure (parsers, validation)
- `@ediflow/infrastructure-shared` - Shared repositories/loaders
- `@ediflow/cli` - Command-line interface
- Data packages (edifact-d96a, edifact-d01b, x12-004010, etc.)

**Workspace Benefits:**
- Single `npm install` for entire monorepo
- Packages can depend on each other
- Shared dependencies (TypeScript, Vitest, etc.)

### Build Project

```bash
npm run build
```

### Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Run CLI (Development)

```bash
# Parse a message
npm run dev -- parse ./test/fixtures/edifact/d20b/orders.edi

# Validate
npm run dev -- validate ./test/fixtures/edifact/d20b/orders.edi --type ORDERS --version D20B

# Build
npm run dev -- build ./output.edi --type ORDERS --version D20B
```

---

## 📁 Project Structure

> **📢 Updated for v0.2.0** - Complete architecture refactoring in Sprint 9!

```
ediflow/ (Monorepo)
├── packages/                    # NPM packages
│   ├── core/                   # @ediflow/core - Domain + Application ONLY
│   │   ├── src/
│   │   │   ├── domain/         # Entities, Value Objects, Services
│   │   │   └── application/    # Use Cases, Ports, DTOs
│   │   ├── test/               # Unit tests
│   │   ├── dist/               # Build output
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   └── vitest.config.ts
│   │
│   ├── edifact/                # @ediflow/edifact - EDIFACT Infrastructure
│   │   ├── src/
│   │   │   ├── infrastructure/
│   │   │   │   ├── parsers/   # EdifactMessageParser, etc.
│   │   │   │   ├── builders/  # EdifactMessageBuilder
│   │   │   │   └── validation/
│   │   │   └── index.ts
│   │   └── test/              # Integration tests
│   │
│   ├── x12/                    # @ediflow/x12 - X12 Infrastructure (internal)
│   │   ├── src/
│   │   │   ├── infrastructure/
│   │   │   │   └── parsers/   # X12MessageParser, etc.
│   │   │   └── index.ts
│   │   └── test/              # Integration tests
│   │
│   ├── infrastructure-shared/  # @ediflow/infrastructure-shared
│   │   ├── src/
│   │   │   ├── repositories/  # FileBasedMessageStructureRepository
│   │   │   ├── loaders/       # CachedDefinitionLoader
│   │   │   └── cache/         # CacheService
│   │   └── test/
│   │
│   ├── cli/                    # @ediflow/cli - Presentation Layer
│   │   ├── src/
│   │   │   ├── presentation/cli/  # Commands
│   │   │   └── infrastructure/    # DIContainer
│   │   └── test/
│   │
│   ├── edifact-d96a/           # @ediflow/edifact-d96a (Data)
│   ├── edifact-d01b/           # @ediflow/edifact-d01b (Data)
│   ├── edifact-d20b/           # @ediflow/edifact-d20b (Data)
│   ├── edifact-d12a/           # @ediflow/edifact-d12a (Data)
│   ├── x12-004010/             # @ediflow/x12-004010 (Data, internal)
│   └── x12-005010/             # @ediflow/x12-005010 (Data, internal)
│
├── scripts/                     # Build & generation scripts
├── docs/                        # Documentation
├── coverage/                    # Test coverage reports
├── package.json                 # Workspace config
└── tsconfig.json                # Root TypeScript config
```

### Package Responsibilities (v0.2.0)

**Core Package** (`@ediflow/core`)
- ✅ Domain entities (EDIMessage, EDISegment)
- ✅ Application use cases (ParseEDI, ValidateMessage, BuildEDI)
- ✅ Ports (interfaces)
- ❌ NO infrastructure code
- ❌ NO format-specific code

**Format Packages** (`@ediflow/edifact`, `@ediflow/x12`)
- ✅ Format-specific parsers
- ✅ Format-specific builders
- ✅ Format-specific validation
- ✅ Implements core interfaces

**Shared Infrastructure** (`@ediflow/infrastructure-shared`)
- ✅ FileBasedMessageStructureRepository (works for all formats)
- ✅ CachedDefinitionLoader (works for all formats)
- ✅ CacheService

**CLI Package** (`@ediflow/cli`)
- ✅ Commands (parse, validate, build)
- ✅ DIContainer
- ✅ User interaction

**Data Packages** (`@ediflow/edifact-d96a`, etc.)
- ✅ Message structure definitions (JSON)
- ✅ Segment definitions
- ✅ Element definitions

### Source Code Structure (`packages/core/src/`)

```
src/
├── domain/                      # Domain Layer (Pure Business Logic)
│   ├── entities/               # EDIMessage, EDISegment, EDIElement
│   ├── value-objects/          # Standard, Version, MessageType
│   ├── services/               # EnvelopeGenerator, StructureMapper
│   └── validation/             # ValidationRules (business rules)
│
└── application/                 # Application Layer (Use Cases)
    ├── use-cases/              # ParseEDI, ValidateMessage, BuildEDI
    │   ├── parse/
    │   ├── validate/
    │   └── build/
    ├── ports/                  # Interfaces (IMessageParser, IRepository)
    │   ├── input/              # Use case inputs
    │   └── output/             # Infrastructure interfaces
    ├── dtos/                   # Data Transfer Objects
    ├── services/               # Application services
    └── configuration/          # UseCaseFactory
```

### Source Code Structure (`packages/edifact/src/`)

```
src/
└── infrastructure/              # Infrastructure Layer (EDIFACT)
    ├── parsers/                # EDIFACT-specific parsing
    │   ├── EdifactMessageParser.ts
    │   ├── EdifactTokenizer.ts
    │   ├── EdifactSegmentParser.ts
    │   └── EdifactDelimiterDetector.ts
    ├── builders/               # EDIFACT-specific building
    │   └── EdifactMessageBuilder.ts
    └── validation/             # EDIFACT-specific validation
        └── EdifactMessageValidator.ts
```

### Source Code Structure (`packages/x12/src/`)

```
src/
└── infrastructure/              # Infrastructure Layer (X12)
    └── parsers/                # X12-specific parsing
        ├── X12MessageParser.ts
        ├── X12Tokenizer.ts
        ├── X12SegmentParser.ts
        ├── X12EnvelopeParser.ts
        └── X12DelimiterDetector.ts
```

### Package Dependencies (v0.2.0)

Understanding how packages depend on each other:

```
Data Packages (edifact-d96a, x12-004010, etc.)
    ↑ (used by)
infrastructure-shared (repositories, loaders)
    ↑ (used by)
Format Packages (edifact, x12)
    ↑ (implements)
core (domain + application)
    ↑ (used by)
cli (presentation)
```

**Dependency Rules:**
- ✅ CLI depends on core + format packages
- ✅ Format packages (edifact, x12) depend on core
- ✅ infrastructure-shared depends on core
- ✅ Data packages have NO dependencies
- ❌ Core NEVER depends on format packages
- ❌ Core NEVER depends on infrastructure-shared

**Example package.json dependencies:**

```json
// packages/core/package.json
{
  "dependencies": {
    // NO dependencies on other EDIFlow packages!
  }
}

// packages/edifact/package.json
{
  "dependencies": {
    "@ediflow/core": "*"  // Only core!
  }
}

// packages/infrastructure-shared/package.json
{
  "dependencies": {
    "@ediflow/core": "*"  // Only core!
  }
}

// packages/cli/package.json
{
  "dependencies": {
    "@ediflow/core": "*",
    "@ediflow/edifact": "*",
    "@ediflow/infrastructure-shared": "*"  // Needed for repositories
  }
}
```

---

## 🔄 Development Workflow

### TDD (Test-Driven Development)

EDIFlow follows **strict TDD**:

1. **🔴 RED** - Write failing test first
2. **🟢 GREEN** - Write minimal code to pass
3. **🔵 REFACTOR** - Improve code quality

**Example:**

```typescript
// 1. RED - Write test first
describe('EDIMessage', () => {
  it('should find segment by tag', () => {
    const message = new EDIMessage({ segments: [bgmSegment] });
    const found = message.findSegment('BGM');
    expect(found).toBe(bgmSegment);
  });
});

// Run test → FAILS ❌

// 2. GREEN - Implement minimal code
class EDIMessage {
  findSegment(tag: string): EDISegment | undefined {
    return this.segments.find(s => s.tag === tag);
  }
}

// Run test → PASSES ✅

// 3. REFACTOR - Improve (if needed)
// - Extract helper methods
// - Add error handling
// - Optimize performance
```

### Feature Development Process

1. **Create feature branch**
   ```bash
   git checkout -b feature/us-X.Y-short-name
   ```

2. **Write tests first (TDD)**
   ```bash
   npm run test:watch
   ```

3. **Implement feature**
   - Follow Clean Architecture
   - Keep functions < 20 lines
   - Use meaningful names

4. **Run all tests**
   ```bash
   npm test
   ```

5. **Check build**
   ```bash
   npm run build
   ```

6. **Commit changes**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

---

## 🧪 Testing

### Test Structure

```
packages/core/src/
├── domain/
│   ├── entities/
│   │   ├── EDIMessage.ts
│   │   └── EDIMessage.test.ts        # Co-located unit tests
│   └── services/
│       ├── EnvelopeGenerator.ts
│       └── EnvelopeGenerator.test.ts

test/
└── integration/                       # Integration tests
    ├── use-cases/
    │   ├── ParseEDIUseCase.integration.test.ts
    │   └── BuildEDIUseCase.integration.test.ts
    └── roundtrip/
        ├── RoundtripD96A.test.ts      # E2E tests
        └── RoundtripD20B.test.ts
```

### Writing Tests

**Unit Test Example:**

```typescript
// EDIMessage.test.ts
import { describe, it, expect } from 'vitest';
import { EDIMessage } from './EDIMessage';

describe('EDIMessage', () => {
  it('should create message with segments', () => {
    const message = new EDIMessage({
      segments: [bgmSegment, dtmSegment]
    });
    
    expect(message.segments).toHaveLength(2);
  });
  
  it('should find segment by tag', () => {
    const message = new EDIMessage({ segments: [bgmSegment] });
    
    const found = message.findSegment('BGM');
    
    expect(found).toBe(bgmSegment);
  });
});
```

**Integration Test Example:**

```typescript
// ParseEDIUseCase.integration.test.ts
import { describe, it, expect } from 'vitest';
import { DIContainer } from '@application/configuration/DIContainer';

describe('ParseEDIUseCase Integration', () => {
  it('should parse ORDERS message', () => {
    const container = DIContainer.getInstance();
    const parseUseCase = container.resolve('ParseEDIUseCase');
    
    const result = parseUseCase.execute({
      message: ordersEDIFACT,
      standard: 'EDIFACT'
    });
    
    expect(result.success).toBe(true);
    expect(result.message.messageType).toBe('ORDERS');
  });
});
```

### Test Coverage

**Target:** > 90% coverage for critical paths

```bash
npm run test:coverage
```

View coverage report: `coverage/index.html`

---

## 🎨 Code Style

### TypeScript Style Guide

**Naming Conventions:**

```typescript
// ✅ PascalCase for classes
class EDIMessage {}
class ParseEDIUseCase {}

// ✅ camelCase for functions/variables
const parseMessage = () => {};
const ediString = '...';

// ✅ UPPER_CASE for constants
const SEGMENT_DELIMITER = "'";

// ✅ Interfaces start with I (optional)
interface IMessageParser {}
```

**File Naming:**

```
✅ PascalCase.ts          - EDIMessage.ts
✅ PascalCase.test.ts     - EDIMessage.test.ts
❌ kebab-case.ts          - edi-message.ts (NO!)
```

**Function Size:**

```typescript
// ✅ Functions < 20 lines
function parseSegment(line: string): EDISegment {
  // Max 20 lines
}

// ❌ God functions
function doEverything() {
  // 100+ lines (NO!)
}
```

**Path Aliases:**

```typescript
// ✅ Use path aliases (in core package)
import { EDIMessage } from '@domain/entities';
import { ParseEDIUseCase } from '@application/use-cases/parse';

// ✅ Import from other packages
import { EdifactMessageParser } from '@ediflow/edifact';
import { X12MessageParser } from '@ediflow/x12';
import { FileBasedMessageStructureRepository } from '@ediflow/infrastructure-shared';

// ❌ Relative imports (avoid when possible)
import { EDIMessage } from '../../../domain/entities/EDIMessage';
```

**Comments:**

```typescript
// ✅ WHY comments (business logic)
// EDIFACT uses CCYYMMDD format for Y2K compliance
const date = formatDate(Date.now());

// ❌ WHAT comments (redundant)
// Get user by ID
const user = getUserById(id);
```

---

## 🌳 Git Workflow

### Branching Strategy

```
main              ← Production releases (v0.1.0, v0.2.0)
  ↑
develop           ← Integration branch (latest development)
  ↑
feature/us-X.Y    ← Feature branches
```

### Commit Message Format

**Conventional Commits:**

```
type(scope): short description

- Detailed change 1
- Detailed change 2

US-X.Y: Story Name
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `test` - Add/update tests
- `docs` - Documentation
- `chore` - Maintenance

**Scopes:**
- `parser` - Parsing logic
- `validator` - Validation logic
- `builder` - Building logic
- `cli` - CLI commands
- `domain` - Domain layer
- `application` - Application layer
- `infrastructure` - Infrastructure layer

**Example:**

```bash
git commit -m "feat(parser): add UNG/UNE functional group support

- Add UNGSegment and UNESegment entities
- Extend EdifactMessageParser to handle functional groups
- Add 12 unit tests for functional group parsing

US-9.1: Functional Group Support
Tests: 602 passing (+12)
Quality: 0 TypeScript errors"
```

---

## 🔀 Pull Request Process

### Before Creating PR

1. **All tests pass**
   ```bash
   npm test
   ```

2. **Build succeeds**
   ```bash
   npm run build
   ```

3. **No TypeScript errors**
   ```bash
   npx tsc --noEmit
   ```

4. **Code is clean**
   - Functions < 20 lines
   - No console.log statements
   - No commented code

### Creating PR

1. **Push to your fork**
   ```bash
   git push origin feature/us-X.Y-short-name
   ```

2. **Create PR on GitHub**
   - Base: `develop` (NOT main!)
   - Title: `feat(scope): Short description`
   - Description: Link to issue, describe changes

3. **PR Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Related Issue
   Closes #123
   
   ## Changes Made
   - Added X feature
   - Fixed Y bug
   - Updated Z documentation
   
   ## Testing
   - [ ] Unit tests added
   - [ ] Integration tests added
   - [ ] All tests passing
   
   ## Checklist
   - [ ] Code follows style guide
   - [ ] Documentation updated
   - [ ] CHANGELOG updated
   ```

### PR Review Process

1. **Automated checks** (CI/CD)
   - Tests pass
   - Build succeeds
   - TypeScript compiles

2. **Code review**
   - Maintainer reviews code
   - Suggestions for improvement
   - Approve or request changes

3. **Merge**
   - Squash and merge to develop
   - Delete feature branch

---

## 🐛 Troubleshooting

### Build Fails

```bash
# Clean and rebuild
rm -rf dist
rm -rf node_modules
npm install
npm run build
```

### Tests Fail

```bash
# Run specific test
npm test -- EDIMessage.test.ts

# Debug mode
node --inspect-brk ./node_modules/.bin/vitest run
```

### TypeScript Errors

```bash
# Check all errors
npx tsc --noEmit

# Use correct path aliases
# ✅ import { X } from '@domain/entities'
# ❌ import { X } from '../../../domain/entities/X'
```

### Import Issues

```bash
# Check tsconfig.json paths
{
  "paths": {
    "@domain/*": ["src/domain/*"],
    "@application/*": ["src/application/*"],
    "@infrastructure/*": ["src/infrastructure/*"]
  }
}
```

---

## 📚 Additional Resources

- **[Quick Start](QUICK_START.md)** - Get started quickly
- **[Architecture](ARCHITECTURE.md)** - Clean Architecture explained
- **[API Reference](API.md)** - Complete API docs
- **[Contributing Guidelines](../CONTRIBUTING.md)** - Contribution rules

---

## 🤝 Getting Help

- **GitHub Discussions:** [Ask questions](https://github.com/ediflow-lib/core/discussions)
- **GitHub Issues:** [Report bugs](https://github.com/ediflow-lib/core/issues)
- **Email:** hello.ediflow@gmail.com

---

## 🙏 Thank You!

Thank you for contributing to EDIFlow! Every contribution helps make EDI integration easier for everyone. 🚀

**Happy coding!** ✨
