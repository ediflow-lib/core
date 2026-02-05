# 🏛️ Clean Architecture Validation

**Use this prompt:** `@workspace /explain #file:clean-architecture-check.md - Check my changes`

---

## ✅ Dependency Rules (STRICT!)

```
Presentation → Application → Domain
     ↓              ↓
Infrastructure ←────┘
```

### Allowed Dependencies
- ✅ **Infrastructure → Domain** (implements interfaces)
- ✅ **Application → Domain** (uses interfaces)
- ✅ **Presentation → Application** (calls use cases)
- ✅ **Presentation → Domain** (uses entities/DTOs)

### FORBIDDEN Dependencies
- ❌ **Domain → Infrastructure** (NEVER!)
- ❌ **Domain → Application** (NEVER!)
- ❌ **Domain → Presentation** (NEVER!)

---

## 🔍 Quick Validation Checklist

### 1. Domain Entities Used Everywhere?
```typescript
// ✅ CORRECT - Infrastructure returns domain entities
export class X12Tokenizer implements ITokenizer {
  tokenize(message: string): Token[] {  // Token from @domain/entities
    // ...
  }
}

// ❌ WRONG - Custom entity in infrastructure
export class X12Tokenizer {
  tokenize(message: string): X12Token[] {  // Custom entity!
    // ...
  }
}
```

### 2. Interfaces in @domain/ports?
```typescript
// ✅ CORRECT - Interface in domain
// @domain/ports/ITokenizer.ts
export interface ITokenizer {
  tokenize(message: string): Token[];
}

// ❌ WRONG - Interface in infrastructure
// @infrastructure/parsers/ITokenizer.ts
```

### 3. Path Aliases Used?
```typescript
// ✅ CORRECT
import { Token } from '@domain/entities';
import { ITokenizer } from '@domain/ports';

// ❌ WRONG
import { Token } from '../../../domain/entities/Token';
```

### 4. No Custom Entities in Infrastructure?
```typescript
// ✅ CORRECT - Use domain entities
export class X12Parser implements IMessageParser {
  parse(message: string): EDIMessage {  // Domain entity
    return new EDIMessage(/* ... */);
  }
}

// ❌ WRONG - Custom entity
export class X12Parser {
  parse(message: string): X12Message {  // Infrastructure entity!
    // ...
  }
}
```

---

## 🎯 How to Use This Prompt

### In Chat
```
@workspace Check Clean Architecture in my changes
#file:clean-architecture-check.md
```

### Before Commit
```
Run this checklist:
1. All domain entities used?
2. Interfaces in @domain/ports?
3. Path aliases used?
4. No custom entities in infrastructure?
```

---

## 📋 Common Violations & Fixes

### Violation 1: Custom Infrastructure Entity
```typescript
// ❌ BEFORE
export interface X12Token {
  type: string;
  value: string;
}

// ✅ AFTER - Use domain entity
import { Token } from '@domain/entities';
```

### Violation 2: Wrong Interface Location
```typescript
// ❌ BEFORE
// packages/x12/src/IParser.ts
export interface IParser { }

// ✅ AFTER
// packages/core/src/domain/ports/IMessageParser.ts
export interface IMessageParser { }
```

### Violation 3: Relative Imports
```typescript
// ❌ BEFORE
import { EDIMessage } from '../../../domain/entities/EDIMessage';

// ✅ AFTER
import { EDIMessage } from '@domain/entities';
```

---

**💡 Remember:** Infrastructure is replaceable! Domain is stable!
