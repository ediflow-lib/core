# Architecture Guide - EDIFlow

This guide explains the **Clean Architecture** design of EDIFlow and how all components work together.

> **📢 Updated for v0.3.0** - X12 support added, complete package overview!

---

## 🎯 Architecture Overview

EDIFlow follows **Clean Architecture** principles (by Robert C. Martin "Uncle Bob") with strict layer separation and dependency inversion.

### Core Principles

1. **Independence** - Framework-agnostic core
2. **Testability** - Every layer can be tested independently
3. **Maintainability** - Easy to understand and modify
4. **Scalability** - Easy to add new standards (IDOC, VDA, etc.)

---

## 📦 Package Structure (v0.3.0)

```
packages/
├── core/                        # ✅ PURE Domain + Application
│   ├── src/
│   │   ├── domain/             # Entities, Value Objects, Rules
│   │   └── application/        # Use Cases, Ports, DTOs, Services
│   └── test/                   # Unit tests
│
├── edifact/                    # ✅ EDIFACT Infrastructure
│   ├── src/
│   │   ├── infrastructure/
│   │   │   ├── parsers/        # EdifactMessageParser, Tokenizer, etc.
│   │   │   ├── builders/       # EdifactMessageBuilder
│   │   │   └── validation/     # EDIFACT-specific validation rules
│   │   └── index.ts
│   └── test/                   # Integration tests
│
├── x12/                        # ✅ X12 Infrastructure
│   ├── src/
│   │   ├── infrastructure/
│   │   │   ├── parsers/        # X12MessageParser, Tokenizer, etc.
│   │   │   ├── repositories/   # (via infrastructure-shared)
│   │   │   └── validation/     # X12 validation rules (STRICT/LENIENT)
│   │   └── index.ts
│   └── test/                   # Integration tests
│
├── infrastructure-shared/      # ✅ Reusable Infrastructure
│   ├── src/
│   │   ├── repositories/       # FileBasedMessageStructureRepository
│   │   ├── loaders/           # CachingMessageStructureRepository
│   │   └── cache/             # LRUCacheManager
│   └── test/
│
├── cli/                        # ✅ Presentation Layer
│   └── src/
│       ├── presentation/cli/   # Commands (parse, validate, build, export-schema)
│       └── infrastructure/     # DIContainer
│
├── edifact-d96a/              # ✅ Data Package (EDIFACT D.96A)
├── edifact-d01b/              # ✅ Data Package (EDIFACT D.01B)
├── edifact-d12a/              # ✅ Data Package (EDIFACT D.12A)
├── edifact-d20b/              # ✅ Data Package (EDIFACT D.20B)
├── eancom-2002/               # ✅ Data Package (EANCOM 2002)
├── hipaa-x12-005010/          # ✅ Data Package (HIPAA X12 005010)
├── x12-004010/                # ✅ Data Package (X12 004010)
└── x12-006040/                # ✅ Data Package (X12 006040)
```

### Historical Note (v0.2.0 refactoring)

The monorepo was restructured in v0.2.0 — EDIFACT infrastructure moved from `@ediflow/core` into `@ediflow/edifact` and `@ediflow/infrastructure-shared`. v0.3.0 added `@ediflow/x12`, EANCOM and HIPAA data packages.

**Before Sprint 9 (v0.1.x):**
```
packages/
├── core/                          # ❌ Mixed everything together!
│   ├── src/
│   │   ├── domain/               # ✅ OK
│   │   ├── application/          # ✅ OK
│   │   ├── infrastructure/       # ❌ EDIFACT parsers were HERE!
│   │   │   ├── parsers/
│   │   │   │   ├── edifact/     # ❌ Format-specific in core!
│   │   │   │   │   ├── EdifactMessageParser.ts
│   │   │   │   │   ├── EdifactTokenizer.ts
│   │   │   │   │   └── ...
│   │   │   ├── repositories/     # ❌ Mixed in core!
│   │   │   └── generators/       # ❌ Mixed in core!
│   │   └── presentation/         # ❌ CLI also in core!
│   └── test/
├── cli/                          # Separate but small
├── edifact-d96a/                # Data packages
├── edifact-d01b/
└── ...
```

**Problem:** 
- Core package had EDIFACT-specific parsers mixed in
- Infrastructure layer violated Clean Architecture
- Hard to add X12 or other formats
- Core was format-dependent

**After Sprint 9 (v0.2.0):**
```
packages/
├── core/                        # ✅ PURE Domain + Application!
│   ├── src/
│   │   ├── domain/             # ✅ Entities, Value Objects
│   │   └── application/        # ✅ Use Cases, Ports, DTOs
│   └── test/
│
├── edifact/                    # ✅ EDIFACT Infrastructure (NEW!)
│   ├── src/
│   │   └── infrastructure/
│       │   ├── parsers/
│       │   │   ├── EdifactMessageParser.ts
│       │   │   ├── EdifactTokenizer.ts
│       │   │   └── ...
│       │   ├── builders/
│       │   └── validation/
│   └── test/
│
├── x12/                        # ✅ X12 Infrastructure (NEW!)
│   ├── src/
│   │   └── infrastructure/
│   │       └── parsers/
│   └── test/
│
├── infrastructure-shared/      # ✅ Reusable Infrastructure (NEW!)
│   ├── src/
│   │   ├── repositories/       # Moved from core!
│   │   ├── loaders/
│   │   └── cache/             # CacheService
│   └── test/
│
├── cli/                        # ✅ Presentation Layer (cleaned)
│   └── src/
│       └── presentation/cli/
│
├── edifact-d96a/              # Data packages
├── edifact-d01b/
├── x12-004010/                # ✅ NEW!
└── hipaa-x12-005010/          # ✅ NEW!
```

**Solution:**
- ✅ Core is now PURE (only domain + application)
- ✅ EDIFACT parsers moved to `@ediflow/edifact` package
- ✅ X12 parsers in separate `@ediflow/x12` package
- ✅ Shared infrastructure extracted to `@ediflow/infrastructure-shared`
- ✅ Clean Architecture strictly enforced!

**Benefits:**
- ✅ Clean Architecture strictly enforced
- ✅ Format-specific code properly separated
- ✅ Infrastructure reusable across formats
- ✅ Easy to add new standards (IDOC, VDA, HL7v2)
- ✅ Tree-shakeable packages

---

## 🏗️ Layer Structure

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                     │
│          (CLI, Future: REST API, Web UI)                │
│                                                           │
│  • Commands (parse, validate, build)                    │
│  • User interaction                                      │
│  • Output formatting                                     │
└────────────────────┬────────────────────────────────────┘
                     │ depends on
┌────────────────────▼────────────────────────────────────┐
│                  Application Layer                      │
│              (Use Cases, DTOs, Ports)                   │
│                                                           │
│  • ParseEDIUseCase                                       │
│  • ValidateMessageUseCase                                │
│  • BuildEDIUseCase                                       │
│  • DTOs (Input/Output)                                   │
│  • Ports (Interfaces)                                    │
└────────────────────┬────────────────────────────────────┘
                     │ depends on
┌────────────────────▼────────────────────────────────────┐
│                   Domain Layer                          │
│         (Entities, Value Objects, Rules)                │
│                                                           │
│  • EDIMessage, EDISegment, EDIElement                    │
│  • ValidationRule, MessageStructure                      │
│  • Business Logic                                        │
│  • NO external dependencies                              │
└────────────────────┬────────────────────────────────────┘
                     │ used by
┌────────────────────▼────────────────────────────────────┐
│               Infrastructure Layer                      │
│        (Parsers, Repositories, Adapters)                │
│                                                           │
│  • EdifactMessageParser (implements IMessageParser)      │
│  • FileBasedRepository (implements IRepository)          │
│  • JsonSchemaGenerator                                   │
└─────────────────────────────────────────────────────────┘
```

### Dependency Rule

**Dependencies ALWAYS point INWARD:**
- ✅ Presentation → Application → Domain
- ✅ Infrastructure → Domain (implements ports)
- ❌ Domain → Infrastructure (NEVER!)
- ❌ Domain → Application (NEVER!)

---

## 📦 Layer Breakdown

### 1. Domain Layer (`src/domain/`)

**Purpose:** Core business logic, entities, and rules

**Contains:**
- **Entities:** `EDIMessage`, `EDISegment`, `EDIElement`, `MessageStructure`
- **Value Objects:** `Standard`, `ValidationError`, `SegmentDefinition`
- **Domain Services:** `EnvelopeGenerator`, `StructureMapper`
- **Validation Rules:** Business logic for validation

**Characteristics:**
- ✅ **Zero external dependencies** (only TypeScript)
- ✅ **Framework-agnostic**
- ✅ **Pure business logic**
- ✅ **Highly testable**

**Example:**

```typescript
// src/domain/entities/EDIMessage.ts
export class EDIMessage {
  constructor(
    public readonly id: string,
    public readonly standard: Standard,
    public readonly version: string,
    public readonly messageType: string,
    public readonly segments: EDISegment[],
    public readonly header?: EDISegment,
    public readonly trailer?: EDISegment
  ) {}

  // Business logic method
  findSegment(tag: string): EDISegment | undefined {
    return this.segments.find(s => s.tag === tag);
  }
}
```

---

### 2. Application Layer (`src/application/`)

**Purpose:** Orchestrate domain logic, define use cases

**Contains:**
- **Use Cases:** Business workflows (Parse, Validate, Build)
- **DTOs:** Data Transfer Objects (Input/Output)
- **Ports:** Interfaces for Infrastructure (IMessageParser, IRepository)
- **Factories:** Object creation logic

**Characteristics:**
- ✅ **Orchestrates domain entities**
- ✅ **Defines application workflows**
- ✅ **Technology-agnostic**
- ✅ **Depends only on Domain**

**Example:**

```typescript
// src/application/use-cases/parse/ParseEDIUseCase.ts
export class ParseEDIUseCase {
  constructor(
    private readonly messageParser: IMessageParser  // Port (interface)
  ) {}

  execute(input: ParseEDIInputDTO): ParseEDIOutputDTO {
    // 1. Use infrastructure (via port)
    const message = this.messageParser.parse(input.message);
    
    // 2. Apply domain logic
    if (!message.isValid()) {
      return { success: false, errors: message.getErrors() };
    }
    
    // 3. Return DTO
    return { success: true, message };
  }
}
```

**Ports (Interfaces):**

```typescript
// src/application/ports/IMessageParser.ts
export interface IMessageParser {
  parse(message: string): EDIMessage;
}

// src/application/ports/IMessageStructureRepository.ts
export interface IMessageStructureRepository {
  getMessageStructure(
    messageType: string,
    version: string
  ): MessageStructure | null;
}
```

---

### 3. Infrastructure Layer (Separated by Format)

**Purpose:** Implements technical details (parsers, repositories, adapters)

**NEW in v0.2.0:** Infrastructure is now **separated into format-specific packages**!

**Package Structure:**
```
packages/
├── edifact/                    # EDIFACT-specific infrastructure
│   └── infrastructure/
│       ├── parsers/
│       │   ├── EdifactMessageParser.ts
│       │   ├── EdifactTokenizer.ts
│       │   ├── EdifactSegmentParser.ts
│       │   └── EdifactDelimiterDetector.ts
│       ├── builders/
│       │   └── EdifactMessageBuilder.ts
│       └── validation/
│           └── EdifactMessageValidator.ts
│
├── x12/                        # X12-specific infrastructure
│   └── infrastructure/
│       └── parsers/
│           ├── X12MessageParser.ts
│           ├── X12Tokenizer.ts
│           ├── X12SegmentParser.ts
│           ├── X12EnvelopeParser.ts
│           └── X12DelimiterDetector.ts
│
└── infrastructure-shared/      # Reusable infrastructure
    ├── repositories/
    │   ├── FileBasedMessageStructureRepository.ts
    │   └── InMemoryMessageStructureRepository.ts
    ├── loaders/
    │   └── CachingMessageStructureRepository.ts
    └── cache/
        └── CacheService.ts
```

**Contains:**
- **Format-Specific Parsers:** EDIFACT, X12 (each in own package)
- **Format-Specific Builders:** EdifactMessageBuilder
- **Format-Specific Validation:** EDIFACT validation rules
- **Shared Repositories:** FileBasedMessageStructureRepository
- **Shared Loaders:** CachedDefinitionLoader
- **Shared Cache:** CacheService

**Characteristics:**
- ✅ **Implements Application Ports** (IMessageParser, IMessageStructureRepository)
- ✅ **Contains all external dependencies**
- ✅ **Can be replaced without changing Domain/Application**
- ✅ **Format-specific code isolated** (EDIFACT ≠ X12)

**Example:**

```typescript
// packages/edifact/src/infrastructure/parsers/EdifactMessageParser.ts
import { IMessageParser, EDIMessage } from '@ediflow/core';

export class EdifactMessageParser implements IMessageParser {
  constructor(
    private readonly delimiterDetector: IDelimiterDetector,
    private readonly tokenizer: ITokenizer,
    private readonly segmentParser: ISegmentParser
  ) {}

  parse(message: string): EDIMessage {
    // EDIFACT-specific parsing logic
  }
  
  getSupportedStandard(): Standard {
    return Standard.EDIFACT;
  }
}
```

```typescript
// packages/x12/src/infrastructure/parsers/X12MessageParser.ts
import { IMessageParser, EDIMessage } from '@ediflow/core';

export class X12MessageParser implements IMessageParser {
  constructor(
    private readonly delimiterDetector: IDelimiterDetector,
    private readonly segmentParser: X12SegmentParser,
    private readonly envelopeParser: X12EnvelopeParser
  ) {}

  parse(message: string): EDIMessage {
    // X12-specific parsing logic
  }
  
  getSupportedStandard(): Standard {
    return Standard.X12;
  }
}
```

**Why Separate Packages?**
- Different formats have different parsing rules
- EDIFACT uses `'` for segments, X12 uses `~`
- X12 has complex envelope structure (ISA/GS/ST)
- Each format can evolve independently
- Users only install formats they need

---

### 4. Presentation Layer (`src/presentation/`)

**Purpose:** User interface (CLI, API, Web)

**Contains:**
- **CLI:** Commands (parse, validate, build)
- **Future:** REST API, GraphQL, Web UI

**Characteristics:**
- ✅ **Depends on Application Layer**
- ✅ **Uses DIContainer for dependency injection**
- ✅ **Handles user input/output**

**Example:**

```typescript
// src/presentation/cli/commands/ParseCommand.ts
export class ParseCommand {
  constructor(
    private readonly parseUseCase: ParseEDIUseCase,
    private readonly validateUseCase: ValidateMessageUseCase
  ) {}

  async execute(filePath: string, options: Options): Promise<void> {
    // 1. Read input
    const ediString = await readFile(filePath);
    
    // 2. Call use case
    const result = this.parseUseCase.execute({
      message: ediString,
      standard: 'EDIFACT'
    });
    
    // 3. Format output
    console.log(JSON.stringify(result, null, 2));
  }
}
```

---

## 🔌 Dependency Injection

EDIFlow uses **DIContainer** for dependency injection:

```typescript
// src/application/configuration/DIContainer.ts
export class DIContainer {
  private static instance: DIContainer;
  private services = new Map<string, any>();

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
      DIContainer.instance.registerServices();
    }
    return DIContainer.instance;
  }

  private registerServices(): void {
    // Register parsers
    this.register('EdifactTokenizer', () => new EdifactTokenizer());
    this.register('EdifactSegmentParser', () => new EdifactSegmentParser());
    this.register('EdifactMessageParser', () => 
      new EdifactMessageParser(
        this.resolve('EdifactTokenizer'),
        this.resolve('EdifactSegmentParser')
      )
    );

    // Register use cases
    this.register('ParseEDIUseCase', () =>
      new ParseEDIUseCase(
        this.resolve('EdifactMessageParser')
      )
    );
  }

  resolve<T>(serviceName: string): T {
    return this.services.get(serviceName);
  }
}
```

**Usage:**

```typescript
const container = DIContainer.getInstance();
const parseUseCase = container.resolve('ParseEDIUseCase');
```

---

## 📐 Design Patterns Used

### 1. Repository Pattern

**Purpose:** Abstract data access

```typescript
// Application defines interface (Port)
interface IMessageStructureRepository {
  getMessageStructure(type: string, version: string): MessageStructure | null;
}

// Infrastructure implements
class FileBasedMessageStructureRepository 
  implements IMessageStructureRepository {
  
  getMessageStructure(type: string, version: string): MessageStructure {
    const data = readFileSync(`./data/${version}/${type}.json`);
    return JSON.parse(data);
  }
}
```

### 2. Use Case Pattern

**Purpose:** Encapsulate business workflows

```typescript
class ParseEDIUseCase {
  execute(input: ParseEDIInputDTO): ParseEDIOutputDTO {
    // Single responsibility: Parse EDI message
  }
}

class ValidateMessageUseCase {
  execute(input: ValidateInputDTO): ValidateOutputDTO {
    // Single responsibility: Validate message
  }
}
```

### 3. Factory Pattern

**Purpose:** Create complex objects

```typescript
class EDIMessageFactory {
  static fromSegments(segments: EDISegment[]): EDIMessage {
    const header = segments.find(s => s.tag === 'UNH');
    const trailer = segments.find(s => s.tag === 'UNT');
    
    return new EDIMessage({
      header,
      trailer,
      segments: segments.filter(s => 
        s.tag !== 'UNH' && s.tag !== 'UNT'
      )
    });
  }
}
```

### 4. Strategy Pattern

**Purpose:** Interchangeable algorithms

```typescript
interface IMessageParser {
  parse(message: string): EDIMessage;
}

class EdifactMessageParser implements IMessageParser {
  parse(message: string): EDIMessage { /* EDIFACT logic */ }
}

class X12MessageParser implements IMessageParser {
  parse(message: string): EDIMessage { /* X12 logic */ }
}

// Use based on standard
const parser: IMessageParser = 
  standard === 'EDIFACT' 
    ? new EdifactMessageParser() 
    : new X12MessageParser();
```

---

## 🔄 Data Flow Example

**Scenario:** Parse EDIFACT message

```
1. USER (CLI)
   └─> ParseCommand.execute()
        │
2. PRESENTATION LAYER
   └─> DIContainer.resolve('ParseEDIUseCase')
        │
3. APPLICATION LAYER
   └─> ParseEDIUseCase.execute(input)
        │
        ├─> IMessageParser.parse(string)  [Port/Interface]
        │    │
4. INFRASTRUCTURE LAYER
        │    └─> EdifactMessageParser.parse()
        │         │
        │         ├─> EdifactTokenizer.tokenize()
        │         └─> EdifactSegmentParser.parse()
        │              │
5. DOMAIN LAYER
        │              └─> new EDIMessage(...)
        │                   └─> new EDISegment(...)
        │                        └─> new EDIElement(...)
        │
   └─> Return ParseEDIOutputDTO
        │
6. PRESENTATION LAYER
   └─> Format and display result to USER
```

---

## 🧪 Testing Strategy

### Unit Tests (70%)

Test each layer independently:

```typescript
// Domain Layer - Pure business logic
describe('EDIMessage', () => {
  it('should find segment by tag', () => {
    const message = new EDIMessage({ /* ... */ });
    const bgm = message.findSegment('BGM');
    expect(bgm).toBeDefined();
  });
});

// Application Layer - Use cases with mocks
describe('ParseEDIUseCase', () => {
  it('should parse valid message', () => {
    const mockParser = { parse: vi.fn() };
    const useCase = new ParseEDIUseCase(mockParser);
    
    const result = useCase.execute({ message: '...' });
    
    expect(result.success).toBe(true);
  });
});
```

### Integration Tests (25%)

Test layer interactions:

```typescript
describe('Parse and Validate Integration', () => {
  it('should parse and validate ORDERS message', () => {
    const container = DIContainer.getInstance();
    const parseUseCase = container.resolve('ParseEDIUseCase');
    const validateUseCase = container.resolve('ValidateMessageUseCase');
    
    const parsed = parseUseCase.execute({ message: ordersEDI });
    const validated = validateUseCase.execute({ 
      message: parsed.message,
      messageType: 'ORDERS'
    });
    
    expect(validated.success).toBe(true);
  });
});
```

### E2E Tests (5%)

Test complete workflows:

```typescript
describe('E2E Roundtrip', () => {
  it('should parse, validate, build, and re-parse', () => {
    // Parse
    const parsed = parse(ordersEDI);
    
    // Validate
    const validated = validate(parsed.message);
    expect(validated.success).toBe(true);
    
    // Build
    const built = build(parsed.message);
    
    // Re-parse
    const reparsed = parse(built);
    
    // Should be identical
    expect(reparsed.message).toEqual(parsed.message);
  });
});
```

---

## 🚀 Adding New Standards (X12, IDOC)

Clean Architecture makes it easy to add new standards:

### Step 1: Add Domain Entities (if needed)

```typescript
// Domain stays mostly the same!
// EDIMessage is standard-agnostic
```

### Step 2: Add Application Port (if needed)

```typescript
// Application defines interface
interface IMessageParser {
  parse(message: string): EDIMessage;  // Already exists!
}
```

### Step 3: Implement Infrastructure

```typescript
// Infrastructure implements for X12
export class X12MessageParser implements IMessageParser {
  parse(message: string): EDIMessage {
    // X12-specific parsing logic
    // Returns same EDIMessage domain entity
  }
}
```

### Step 4: Register in DIContainer

```typescript
container.register('X12MessageParser', () => new X12MessageParser());
container.register('ParseX12UseCase', () => 
  new ParseEDIUseCase(container.resolve('X12MessageParser'))
);
```

**That's it!** Domain and Application layers remain unchanged! ✅

---

## 📊 Benefits of This Architecture

### ✅ Testability
- Each layer can be tested independently
- Easy to mock dependencies
- Fast test execution

### ✅ Maintainability
- Clear separation of concerns
- Easy to locate and fix bugs
- Self-documenting code structure

### ✅ Flexibility
- Easy to swap implementations (parsers, repositories)
- Framework-agnostic core
- Can migrate infrastructure without touching business logic

### ✅ Scalability
- Easy to add new standards (X12, IDOC, VDA)
- Easy to add new features (SaaS API, Web UI)
- Parallel development possible (teams work on different layers)

---

## 🎓 Learning Resources

**Books:**
- "Clean Architecture" by Robert C. Martin
- "Domain-Driven Design" by Eric Evans
- "Patterns of Enterprise Application Architecture" by Martin Fowler

**Articles:**
- [The Clean Architecture (Uncle Bob)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)

**Our Docs:**
- [Quick Start Guide](QUICK_START.md) - Get started quickly
- [Developer Guide](DEVELOPER_GUIDE.md) - Contributing guidelines
- [Examples](https://github.com/ediflow-lib/core/tree/main/examples) - Runnable TypeScript examples

---

## 🤝 Questions?

- **GitHub Discussions:** [Ask questions](https://github.com/ediflow-lib/ediflow/discussions)
- **Email:** hello.ediflow@gmail.com

---

**Next:** [Developer Guide](DEVELOPER_GUIDE.md) - Learn how to contribute! 🚀
