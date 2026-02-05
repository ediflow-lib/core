# 📋 Reusable Prompts für GitHub Copilot

Diese Prompts helfen dir, Clean Code und Clean Architecture zu validieren.

---

## 🎯 Verfügbare Prompts

### 1. **Clean Architecture Check**
📄 Datei: `clean-architecture-check.md`
🎯 Zweck: Validierung der Architektur-Regeln

### 2. **Refactor Checklist**
📄 Datei: `refactor-checklist.md`
🎯 Zweck: Vollständige Refactor-Phase Checkliste (inkl. Kommentare!)

---

## 📞 Wie rufst du sie auf?

### In GitHub Copilot Chat

#### Methode 1: Mit @workspace
```
@workspace Check Clean Architecture
#file:.github/prompts/clean-architecture-check.md
```

#### Methode 2: Mit /explain
```
@workspace /explain #file:.github/prompts/refactor-checklist.md
Review my code against this checklist
```

#### Methode 3: Direkt referenzieren
```
Check my code using the refactor checklist
#file:.github/prompts/refactor-checklist.md
```

---

## 🔄 Wann verwendest du welchen Prompt?

### Während TDD - REFACTOR Phase
```
@workspace Review my code
#file:.github/prompts/refactor-checklist.md

Check especially:
1. Comments removed?
2. Functions < 20 lines?
3. TypeScript errors: 0?
```

### Vor jedem Commit
```
@workspace Validate architecture
#file:.github/prompts/clean-architecture-check.md

Check:
1. Domain entities used?
2. Interfaces in @domain/ports?
3. Path aliases used?
```

### Nach größeren Änderungen
```
@workspace Complete quality check

#file:.github/prompts/refactor-checklist.md
#file:.github/prompts/clean-architecture-check.md

Full validation before commit
```

---

## 💡 Tipps

### 1. Kombiniere mit spezifischen Fragen
```
@workspace #file:.github/prompts/refactor-checklist.md
Check X12Tokenizer.ts - are there any violations?
```

### 2. Nutze für Code Review
```
@workspace #file:.github/prompts/clean-architecture-check.md
Review my PR changes for architecture violations
```

### 3. Automatische Erinnerung
```
@workspace Before I commit, check:
#file:.github/prompts/refactor-checklist.md
```

---

## 🚀 Workflow Integration

### Standard TDD-Zyklus
```
1. RED: Write test
2. GREEN: Minimal implementation
3. REFACTOR: @workspace #file:.github/prompts/refactor-checklist.md
4. Commit
```

### Pre-Commit Check
```
Before git commit:
@workspace #file:.github/prompts/clean-architecture-check.md
@workspace #file:.github/prompts/refactor-checklist.md
```

---

## 📝 Beispiel-Session

```
User: I've implemented X12Tokenizer. Ready to commit?

You: @workspace Review X12Tokenizer.ts
#file:.github/prompts/refactor-checklist.md

Check:
1. All comments removed?
2. Functions < 20 lines?
3. Path aliases used?

Copilot: [Prüft Code gegen Checkliste]
- ❌ Found WHAT comment on line 45
- ❌ Function tokenize() is 35 lines (>20)
- ✅ Path aliases correct

You: Fix violations

Copilot: [Fixes issues]

You: @workspace #file:.github/prompts/clean-architecture-check.md
Check architecture

Copilot: ✅ All architecture rules followed
```

---

**💡 Pro-Tipp:** Speichere diese Befehle als Snippets in WebStorm!
