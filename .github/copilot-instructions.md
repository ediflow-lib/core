# 🤖 AI Development Instructions for EDIFlow

**This file is the PERMANENT context for GitHub Copilot.**
**Location:** `.github/copilot-instructions.md` (GitHub Copilot loads this automatically)

---

## 🎯 Your Task System

**You tell me:** "Sprint X, Story #YY"

**I will:**
1. Fetch story using the script: `npx ts-node --project tsconfig.scripts.json scripts/fetch-story.ts YY`
2. Read acceptance criteria and DoD from the output
3. Ask: "Should I create feature branch?"
4. Start implementing with TDD

**Script location:** `scripts/fetch-story.ts`
**Usage:** `npx ts-node --project tsconfig.scripts.json scripts/fetch-story.ts <issue-number>`

**That's it! No manual file reading needed! ALWAYS use fetch-story.ts to get the story!**

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

### 🗂️ File & Naming
1. **File Naming:** ALL `.ts` files **PascalCase** — `StructureMapper.ts` ✅ / `structure-mapper.ts` ❌
2. **Path Aliases:** ALWAYS use `@domain/*`, `@application/*`, `@infrastructure/*` — NO `../../../` ❌
3. **Meaningful Names:** `parseX12Message()` ✅ / `parseMsg()` ❌ / `temp`, `data`, `info` ❌
4. **Use Enums:** `Standard.X12` ✅ / `'X12'` (magic string) ❌

### 🧱 Code Structure
5. **Functions < 20 lines:** Single Responsibility — extract if longer ❌ God functions
6. **No `any` types:** Always use concrete types or generics ❌ `any`
7. **No `@ts-ignore`:** Fix the type error properly ❌ `@ts-ignore`
8. **No `console.log`:** Use proper logging or remove ❌ `console.log`
9. **DRY Principle:** Extract helpers — NO copy-paste code ❌ duplication
10. **No Inline Comments:** Code is self-explanatory — ONLY WHY comments ❌ `// Get user by ID`

### 🏗️ Architecture
11. **Clean Architecture:** Dependencies INWARD only — Domain never imports Infrastructure ❌
12. **Ports & Adapters:** Use Cases use Interfaces (Ports), not concrete classes ❌ `new X12Parser()`
13. **No Domain → Application:** Domain layer is pure — no use case imports ❌

### 🧪 TDD
14. **TDD:** Red → Green → Refactor — ALWAYS! Write test first ❌ code without tests
15. **Refactor Phase:** Apply ALL Clean Code rules during Refactor — NEVER skip ❌
16. **Test Co-location:** `ClassName.test.ts` next to `ClassName.ts` ❌ `__tests__/` folders

### ✅ Pre-Commit & Git
17. **Pre-Commit:** ALL checks pass — `npm run build` + `npm test` + Inspect Code ❌ skip
18. **Quality Gate:** 0 TypeScript errors, 0 warnings before every commit ❌
19. **Git:** Feature branch from `develop` — NEVER commit to `main` directly ❌
20. **Conventional Commits:** `type(scope): description` — `feat(parser): add X12Tokenizer` ✅
21. **fetch-story.ts:** ALWAYS use `npx ts-node --project tsconfig.scripts.json scripts/fetch-story.ts <N>` to fetch stories ❌ manual reading

---

## 🔄 Workflow Summary

```
1. User says: "Sprint X, Story #YY"
2. I run: npx ts-node --project tsconfig.scripts.json scripts/fetch-story.ts YY
3. I create feature branch: feature/us-X.Y-short-name from develop
4. TDD: Red → Green → Refactor (repeat per acceptance criterion)
5. Refactor: Apply ALL 21 Critical Rules
6. Pre-Commit: Inspect + npm run build + npm test → 0 errors, 0 warnings
7. Commit with Conventional format
8. Ask: "Ready to push?"
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

---

## 📦 NPM Release Process (Git Flow)

### When to Release

**Trigger:** After Sprint complete OR major feature ready

**Version Strategy:**
- **MAJOR (x.0.0):** Breaking changes
- **MINOR (0.x.0):** New features, no breaking changes
- **PATCH (0.0.x):** Bug fixes only

---

### Release Checklist (Complete Process)

#### Step 1: Prepare Release Branch
```bash
# From develop (with all changes committed and pushed)
git checkout develop
git pull origin develop
git checkout -b release/X.Y.Z
```

#### Step 2: Update Documentation
- [ ] Update `CHANGELOG.md` with all changes
- [ ] Update `ARCHITECTURE.md` if structure changed
- [ ] Update `DEVELOPER_GUIDE.md` if workflow changed
- [ ] Update `QUICK_START.md` if API changed
- [ ] Add v0.2.0 banners to package READMEs:
  ```markdown
  ## 🆕 What's New in vX.Y.Z
  - Feature 1
  - Feature 2
  ⚠️ Migrating from vX.Y-1? [Migration guide]
  ```

#### Step 3: Bump Versions
```bash
# Update ALL package.json files to new version
# packages/core/package.json
# packages/edifact/package.json
# packages/infrastructure-shared/package.json
# packages/cli/package.json
# packages/edifact-d96a/package.json
# packages/edifact-d01b/package.json
# packages/edifact-d12a/package.json
# packages/edifact-d20b/package.json
# packages/x12/package.json (internal)
# packages/x12-004010/package.json (internal)
# packages/x12-005010/package.json (internal)
```

#### Step 4: Commit and Push Release Branch
```bash
git add -A
git commit -m "chore: bump all package versions to X.Y.Z"
git push origin release/X.Y.Z
```

#### Step 5: Merge to Main (Git Flow)
```bash
git checkout main
git pull origin main
git merge release/X.Y.Z --no-ff -m "release: vX.Y.Z - [Title]

[Short description]

Released Packages:
- @ediflow/core@X.Y.Z
- @ediflow/edifact@X.Y.Z
- [... list all]

See CHANGELOG.md for full details."

git tag -a vX.Y.Z -m "Release vX.Y.Z - [Title]

[Release notes summary]"

git push origin main
git push origin vX.Y.Z
```

#### Step 6: Build and Publish to NPM
```bash
# Build all packages
cd packages/core && npm run build
cd ../edifact && npm run build
cd ../infrastructure-shared && npm run build
cd ../cli && npm run build

# Publish to NPM (in order!)
cd packages/core && npm publish --access public
cd ../infrastructure-shared && npm publish --access public
cd ../edifact && npm publish --access public
cd ../cli && npm publish --access public
cd ../edifact-d96a && npm publish --access public
cd ../edifact-d01b && npm publish --access public
cd ../edifact-d12a && npm publish --access public
cd ../edifact-d20b && npm publish --access public

# DO NOT publish internal packages:
# - @ediflow/x12
# - @ediflow/x12-004010
# - @ediflow/x12-005010
```

#### Step 7: Create GitHub Release
1. Go to: https://github.com/ediflow-lib/core/releases/new
2. Tag: `vX.Y.Z` (already exists)
3. Title: `vX.Y.Z - [Feature Name]`
4. Description: Copy from `docs/private/business/GITHUB_RELEASE_vX.Y.Z.md`
5. ✅ "Set as latest release"
6. Click "Publish release"

#### Step 8: Marketing & Communication

**GitHub Discussions (5 min):**
```markdown
Category: Announcements
Title: 📢 vX.Y.Z Released - [Feature Name]

Body:
We just released vX.Y.Z with [key features]!

🔥 What's New:
- Feature 1
- Feature 2

⚠️ Breaking Changes: [None/List]

📝 Full changelog: [link to release]
💬 Questions? Ask below!
```

**Discord Announcement (if we have Discord):**
```markdown
Channel: #announcements

@everyone 🚀 **EDIFlow vX.Y.Z Released!**

What's new:
✨ Feature 1
✨ Feature 2

📦 Upgrade: `npm install @ediflow/core@X.Y.Z`
📝 Changelog: [link]

Questions? Head to #support!
```

**Dev.to Article (1-2h, optional for major releases):**
- Technical deep dive
- Before/After examples
- Lessons learned
- Link to GitHub

**Reddit/LinkedIn (optional):**
- r/typescript or r/javascript
- LinkedIn professional network
- Focus on technical achievement

#### Step 9: Merge Back to Develop
```bash
git checkout develop
git pull origin develop
git merge main --no-ff -m "chore: merge main back to develop after vX.Y.Z release"
git push origin develop
```

#### Step 10: Clean Up
```bash
# Delete release branch (optional)
git branch -d release/X.Y.Z
git push origin --delete release/X.Y.Z
```

---

### ⚠️ Important Notes

**README Updates on NPM:**
- README changes require NEW version (NPM doesn't allow re-publishing)
- For README-only updates: Bump PATCH version (0.2.0 → 0.2.1)
- Document in CHANGELOG as "docs: update package READMEs"

**Internal Packages:**
- NEVER publish @ediflow/x12, x12-004010, x12-005010 until ready
- Mark in package.json: `"private": true` to prevent accidental publish

**Version Sync:**
- Keep ALL packages in sync (easier to track)
- Even internal packages should have same version number

---

**"Leave the code cleaner than you found it!" - Boy Scout Rule ✅**
