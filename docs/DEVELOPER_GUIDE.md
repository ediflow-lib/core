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
git remote add upstream https://github.com/ediflow-lib/ediflow.git

# 4. Install dependencies
npm install
```

---

## 💻 Development Setup

### Install Dependencies

```bash
npm install
```

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

```
ediflow/
├── packages/                    # Monorepo packages
│   ├── core/                   # @ediflow/core
│   │   ├── src/
│   │   │   ├── domain/         # Entities, Value Objects
│   │   │   ├── application/    # Use Cases, DTOs
│   │   │   ├── infrastructure/ # Parsers, Repositories
│   │   │   └── presentation/   # CLI
│   │   ├── dist/               # Build output
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── edifact-d96a/           # @ediflow/edifact-d96a
│   ├── edifact-d01b/           # @ediflow/edifact-d01b
│   ├── edifact-d20b/           # @ediflow/edifact-d20b
│   └── edifact-d12a/           # @ediflow/edifact-d12a
│
├── scripts/                     # Build & generation scripts
├── docs/                        # Documentation
├── test/                        # Integration & E2E tests
├── coverage/                    # Test coverage reports
├── package.json                 # Workspace config
└── tsconfig.json                # TypeScript config
```

### Source Code Structure (`packages/core/src/`)

```
src/
├── domain/                      # Domain Layer
│   ├── entities/               # EDIMessage, EDISegment, EDIElement
│   ├── value-objects/          # Standard, ValidationError
│   ├── services/               # EnvelopeGenerator, StructureMapper
│   └── validation/             # ValidationRules
│
├── application/                 # Application Layer
│   ├── use-cases/              # ParseEDI, ValidateMessage, BuildEDI
│   │   ├── parse/
│   │   ├── validate/
│   │   └── build/
│   ├── ports/                  # Interfaces (IMessageParser, IRepository)
│   ├── factories/              # Object creation
│   └── configuration/          # DIContainer
│
├── infrastructure/              # Infrastructure Layer
│   ├── parsers/                # EdifactMessageParser, EdifactTokenizer
│   │   └── edifact/
│   ├── repositories/           # FileBasedRepository, InMemoryRepository
│   └── generators/             # JsonSchemaGenerator
│
└── presentation/                # Presentation Layer
    └── cli/                    # CLI commands
        ├── commands/
        └── index.ts
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
// ✅ Use path aliases
import { EDIMessage } from '@domain/entities';
import { ParseEDIUseCase } from '@application/use-cases/parse';

// ❌ Relative imports
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

- **GitHub Discussions:** [Ask questions](https://github.com/ediflow-lib/ediflow/discussions)
- **GitHub Issues:** [Report bugs](https://github.com/ediflow-lib/ediflow/issues)
- **Email:** hello.ediflow@gmail.com

---

## 🙏 Thank You!

Thank you for contributing to EDIFlow! Every contribution helps make EDI integration easier for everyone. 🚀

**Happy coding!** ✨
