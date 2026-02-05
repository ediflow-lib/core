# 🔵 REFACTOR Phase Checklist

**Use this prompt:** `@workspace /explain #file:refactor-checklist.md - Review my code`

---

## ⚠️ MANDATORY BEFORE COMMIT!

**This is THE critical phase! Apply ALL rules NOW:**

---

## 1️⃣ Comments - MOST IMPORTANT! 🚨

### Rule: NO Inline Comments!
Code must be **self-explanatory** through:
- ✅ Meaningful variable names
- ✅ Descriptive function names
- ✅ Small functions (< 20 lines)

### ONLY WHY Comments Allowed
```typescript
// ❌ BAD - Obvious WHAT
// Extract delimiters from ISA segment
const delimiters = this.extractDelimiters(isa);

// ✅ GOOD - No comment needed (self-explanatory)
const delimiters = this.extractDelimiters(isa);

// ✅ GOOD - Explains WHY (business rule)
// X12 standard requires ISA segment to be exactly 106 characters
// for backward compatibility with fixed-length legacy systems
if (isa.length !== 106) {
  throw new Error('Invalid ISA length');
}
```

### Comment Inspection Checklist
- [ ] ✅ No "what" comments (extract → function name)
- [ ] ✅ No "how" comments (complex logic → extract function)
- [ ] ✅ ONLY "why" comments (business rules, standards)
- [ ] ✅ No commented-out code

---

## 2️⃣ TypeScript Quality

### Errors & Warnings
- [ ] ✅ TypeScript errors: **0**
- [ ] ✅ TypeScript warnings: **0**
- [ ] ✅ No unused imports
- [ ] ✅ No unused variables
- [ ] ✅ No `any` types
- [ ] ✅ No `@ts-ignore`
- [ ] ✅ Use optional chaining (`?.`)

---

## 3️⃣ Clean Code Principles

### Function Size
- [ ] ✅ All functions < **20 lines**
- [ ] ✅ Single Responsibility per function
- [ ] ✅ Extract long functions → helper functions

### Naming
- [ ] ✅ Meaningful names (`parseX12Message`, not `parseMsg`)
- [ ] ✅ No abbreviations (`validator`, not `val`)
- [ ] ✅ No generic names (`temp`, `data`, `info`, `manager`)
- [ ] ✅ Boolean functions start with `is`, `has`, `should`

### DRY (Don't Repeat Yourself)
- [ ] ✅ No code duplication
- [ ] ✅ Extract repeated logic → helper functions
- [ ] ✅ Extract test setup → test helpers

---

## 4️⃣ Architecture & Structure

### File Naming
- [ ] ✅ ALL `.ts` files use **PascalCase**
  - ✅ `StructureMapper.ts`, `TestHelpers.ts`
  - ❌ `structure-mapper.ts`, `test-helpers.ts`

### Path Aliases
- [ ] ✅ Use `@domain`, `@application`, `@infrastructure`
- [ ] ✅ NO relative imports (`../../../`)

### Clean Architecture
- [ ] ✅ Infrastructure → Domain (implements interfaces)
- [ ] ✅ Application → Domain (uses interfaces)
- [ ] ❌ Domain → Infrastructure (FORBIDDEN!)

---

## 5️⃣ Code Quality

### Console & Debugging
- [ ] ✅ No `console.log`
- [ ] ✅ No `console.debug`
- [ ] ✅ Use proper logging framework (if needed)

### Type Safety
- [ ] ✅ Enums used (`Standard.X12`, not `'X12'`)
- [ ] ✅ Interfaces for contracts
- [ ] ✅ Type guards for runtime checks

---

## 6️⃣ Testing

### Test Quality
- [ ] ✅ Descriptive test names (`should tokenize ISA segment`)
- [ ] ✅ Arrange-Act-Assert pattern
- [ ] ✅ No duplication in tests (use helpers)
- [ ] ✅ Test edge cases

---

## 🎯 How to Use This Checklist

### During REFACTOR Phase (TDD)
```
1. Tests GREEN ✅
2. Open this checklist
3. Go through EVERY item
4. Fix violations
5. Run tests again
6. Commit only when ALL ✅
```

### Before Every Commit
```
@workspace Review my code
#file:refactor-checklist.md

Check:
1. Comments removed?
2. Functions < 20 lines?
3. Path aliases used?
4. TypeScript errors: 0?
```

---

## 📋 Quick Examples

### Example 1: Remove WHAT Comment
```typescript
// ❌ BEFORE
// Split message by segment terminator
const segments = message.split(terminator);

// ✅ AFTER - Extract to function
const segments = this.splitIntoSegments(message, terminator);
```

### Example 2: Extract Long Function
```typescript
// ❌ BEFORE - 45 lines
tokenize(message: string): Token[] {
  const isa = this.extractISA(message);
  const elementSep = isa[3];
  const segmentTerm = isa[105];
  // ... 40 more lines
}

// ✅ AFTER - < 20 lines each
tokenize(message: string): Token[] {
  const delimiters = this.extractDelimiters(message);
  const segments = this.splitIntoSegments(message, delimiters);
  return this.parseSegments(segments, delimiters);
}
```

### Example 3: Fix Generic Name
```typescript
// ❌ BEFORE
const data = parser.parse(message);
const temp = data.segments[0];
const result = processData(temp);

// ✅ AFTER
const ediMessage = parser.parse(message);
const isaSegment = ediMessage.segments[0];
const validatedEnvelope = this.validateEnvelope(isaSegment);
```

---

## 🚨 Zero Tolerance Rules

**NEVER commit code with:**
1. ❌ Inline "what" or "how" comments
2. ❌ Functions > 20 lines
3. ❌ TypeScript errors
4. ❌ Unused imports/variables
5. ❌ Relative imports (`../../../`)
6. ❌ kebab-case file names
7. ❌ `console.log`
8. ❌ `any` types

---

**💡 Remember:** Clean Code is not optional - it's mandatory in REFACTOR phase!

**"Any fool can write code that a computer can understand. Good programmers write code that humans can understand." - Martin Fowler**
