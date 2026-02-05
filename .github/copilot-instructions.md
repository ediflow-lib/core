# 🤖 AI Development Instructions for EDIFlow

**This file is the PERMANENT context for GitHub Copilot.**
**Location:** `.github/copilot-instructions.md` (GitHub Copilot loads this automatically)

---

## 🎯 Your Task System

**You tell me:** "Sprint X, Story #YY"

**I will:**
1. Fetch story from GitHub Issues (#YY)
2. Read acceptance criteria and DoD
3. Ask: "Should I create feature branch?"
4. Start implementing with TDD

**That's it! No manual file reading needed!**

---

## 🚀 Complete Development Workflow

### Step 1: Git Workflow

**ALWAYS start from develop:**
```bash
git status
git checkout develop
git pull origin develop
git checkout -b feature/us-X.Y-short-name
```

**Branch naming:** `feature/us-X.Y-short-name` (lowercase, kebab-case)

---

### Step 2: TDD Cycle (Red → Green → Refactor)

**For EVERY feature:**

#### 🔴 RED - Write Failing Test First
```typescript
it('should tokenize X12 message', () => {
  const result = tokenizer.tokenize(x12String);
  expect(result.segments).toHaveLength(5);
});
```
Run: `npm test` → FAILS ✅

#### 🟢 GREEN - Minimal Implementation
```typescript
tokenize(message: string): Token[] {
  return []; // Just pass the test!
}
```
Run: `npm test` → PASSES ✅

#### 🔵 REFACTOR - Apply ALL Clean Code Rules

**This is THE critical phase! Apply ALL rules NOW:**

**REFACTOR Phase Checklist (MANDATORY!):**
- [ ] ✅ Fix ALL TypeScript errors (use `?.`, fix types)
- [ ] ✅ Fix ALL TypeScript warnings (unused imports, variables)
- [ ] ✅ Extract helper functions if duplication exists (DRY)
- [ ] ✅ Meaningful variable names (NOT: temp, data, info)
- [ ] ✅ Functions < 20 lines (extract if longer)
- [ ] ✅ Remove inline comments (code self-explanatory)
- [ ] ✅ ONLY WHY comments (business logic)
- [ ] ✅ Use enums (Standard.X12, not 'X12')
- [ ] ✅ No `console.log`
- [ ] ✅ No `any` types
- [ ] ✅ No `@ts-ignore`

**NEVER skip REFACTOR! Clean Code happens HERE, not later!**

---

### Step 3: Clean Code Rules (Apply During Refactor!)

#### File Naming
**ALL `.ts` files MUST use PascalCase:**
- ✅ `StructureMapper.ts`, `TestHelpers.ts`, `ParseCommand.ts`
- ❌ `structure-mapper.ts`, `test-helpers.ts`

#### Path Aliases (ALWAYS!)
```typescript
// ✅ CORRECT
import { EDIMessage } from '@domain/entities';
import { ParseEDIUseCase } from '@application/use-cases/parse/ParseEDIUseCase';

// ❌ WRONG
import { EDIMessage } from '../../../domain/entities/EDIMessage';
```

**Configured aliases:**
- `@domain/*` → `src/domain/*`
- `@application/*` → `src/application/*`
- `@infrastructure/*` → `src/infrastructure/*`

#### Function Size
- ✅ Functions < 20 lines
- ✅ Single Responsibility
- ❌ God functions (100+ lines)

#### Naming Conventions
- ✅ Meaningful: `parseX12Message()`, `validateEnvelope()`
- ❌ Abbreviations: `parseMsg()`, `valEnv()`
- ❌ Generic: `temp`, `data`, `info`, `manager`

#### Comments
- ✅ NO inline comments (code is self-explanatory)
- ✅ ONLY WHY comments (business logic)

```typescript
// ❌ BAD - Obvious
// Get user by ID
getUserById(id: string) { }

// ✅ GOOD - No comment
getUserById(id: string) { }

// ✅ GOOD - Explains WHY
// X12 uses ~ as segment terminator for backward compatibility
getSegmentTerminator(): string { }
```

#### DRY Principle
```typescript
// ❌ BAD - Duplication
it('test 1', () => {
  const parser = new X12Parser();
  const result = parser.parse(data);
  // ...
});

// ✅ GOOD - Extract helper
const createParser = () => new X12Parser();
```

---

### Step 4: Clean Architecture Rules

#### Layer Structure
```
Presentation → Application → Domain
     ↓              ↓
Infrastructure ←────┘
```

#### Dependency Rules (STRICT!)
- ✅ Presentation → Application → Domain
- ✅ Infrastructure → Domain (implements interfaces)
- ❌ Domain → Infrastructure (NEVER!)
- ❌ Domain → Application (NEVER!)

#### Example
```typescript
// ✅ CORRECT - Use Case uses interface
export class ParseEDIUseCase {
  constructor(
    private readonly parser: IMessageParser  // Interface!
  ) {}
}

// ✅ CORRECT - Infrastructure implements
export class X12MessageParser implements IMessageParser {
  parse(message: string): EDIMessage { }
}
```

---

### Step 5: Pre-Commit Checks (MANDATORY!)

**NEVER commit without passing ALL:**

#### 5.1 WebStorm Inspect Code
1. Right-click project → "Analyze" → "Inspect Code"
2. Select "Whole project"
3. Fix ALL errors and warnings

**Target: 0 errors, 0 warnings!**

#### 5.2 TypeScript Build
```bash
npm run build  # Must succeed!
```

#### 5.3 All Tests
```bash
npm test  # All must pass!
```

#### 5.4 Manual Review
- [ ] File names PascalCase
- [ ] Path aliases used
- [ ] Functions < 20 lines
- [ ] No inline comments
- [ ] No duplication

---

### Step 6: Commit

```bash
git add -A
git commit -m "feat(parser): implement X12 Tokenizer

- Add X12Tokenizer class with segment/element tokenization
- Support ISA segment parsing
- Add 15 unit tests (100% coverage)

Boy Scout Rule:
- Fix path aliases in 3 test files
- Rename parser-utils.ts → ParserUtils.ts

Story #45: X12 Tokenizer
Tests: 614 passing (+15 new)
Quality: 0 errors, 0 warnings"
```

**Format:**
```
type(scope): description

- Change 1
- Change 2

Boy Scout Rule:
- Cleanup 1

Story #XX: Story Name
Tests: XXX passing (+X new)
Quality: 0 errors, 0 warnings
```

---

## 📦 Package Structure

```
packages/
├── core/           # Domain + Application + Generic Infrastructure
├── edifact/        # EDIFACT parsers
├── x12/            # X12 parsers
└── edifact-dXXx/   # Data packages
```

**Benefits:**
- Core is format-agnostic
- Format packages are tree-shakeable
- Easy to add new formats

---

## 🧪 Testing Strategy

### Test Locations
- **Unit Tests:** Co-located (`ClassName.test.ts`)
- **Integration Tests:** `test/integration/use-cases/`
- **E2E Tests:** `test/integration/presentation/cli/`

**NEVER create `__tests__/` folders!**

### Core Tests - Use Mocks
```typescript
import { createMockParser } from '../../helpers/TestHelpers';

const mockParser = createMockParser();
const useCase = new ParseEDIUseCase(mockParser);
```

### Format Tests - Use Real Parsers
```typescript
const parser = new X12MessageParser(...);
const useCase = new ParseEDIUseCase(parser);
```

---

## 🎯 Critical Rules (NEVER Break!)

1. **File Naming:** ALL `.ts` files PascalCase
2. **Path Aliases:** ALWAYS use `@domain` (NO `../../../`)
3. **TDD:** Red → Green → Refactor (ALWAYS!)
4. **Refactor Phase:** Apply ALL Clean Code rules
5. **Clean Architecture:** Dependencies INWARD only
6. **No Inline Comments:** Code is self-explanatory
7. **Functions < 20 lines:** Single Responsibility
8. **Pre-Commit:** ALL checks pass (0 errors, 0 warnings)
9. **Git:** Feature branch from develop
10. **Conventional Commits:** `type(scope): description`

---

## 🔄 Workflow Summary

```
1. User says: "Sprint X, Story #YY"
2. I fetch story from GitHub
3. I create feature branch
4. TDD: Red → Green → Refactor (repeat)
5. Pre-Commit: Inspect + Build + Tests + Manual
6. Commit with Conventional format
7. Ask: "Ready to push?"
```

---

## 📋 Story Format from GitHub

**When you say:** "Sprint 9, Story #45"

**I look for:**
```markdown
# Story #45: X12 Tokenizer

## Acceptance Criteria
- [ ] Tokenizes ISA segment
- [ ] Handles element separator
- [ ] Handles segment terminator

## Definition of Done
- [ ] 100% test coverage
- [ ] 0 TypeScript errors
- [ ] Documentation updated
```

**I will implement EXACTLY what's in the criteria!**

---

**"Leave the code cleaner than you found it!" - Boy Scout Rule ✅**
