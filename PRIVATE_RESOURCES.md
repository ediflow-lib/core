# Private Resources & Data - Setup Guide

**⚠️ WICHTIG:** Die folgenden Dateien/Ordner sind **NICHT** im öffentlichen Repository enthalten:

- `scripts/` - Generator-Scripts (privat)
- `resources/` - UN/EDIFACT Spezifikationen (urheberrechtlich geschützt)
- `directories/` - Generierte JSON-Daten (Community: über NPM Packages)

---

## 🏗️ Neue Architektur (seit Sprint 5)

### Code vs. Daten Trennung

**VORHER (veraltet):**
- ❌ `packages/edifact-d20b/` - TypeScript Code mit Daten gemischt
- ❌ Duplikate (Segments mehrfach definiert)
- ❌ Große Bundle-Größe

**JETZT (neu):**
- ✅ `@ediflow/core` - Code (Domain, Application, Infrastructure)
- ✅ `directories/edifact-d20b/` - JSON Daten (Elements, Segments, Messages)
- ✅ Keine Duplikate (Segments via `segmentRef` referenziert)
- ✅ Kleine Bundle-Größe

### Struktur

```
directories/
├── schema/                         # YAML: Globale Struktur-Definitionen (wiederverwendbar)
│   ├── elements.schema.yml         # Schema für alle Element-Definitionen
│   ├── composites.schema.yml       # Schema für alle Composite-Definitionen
│   ├── segments.schema.yml         # Schema für alle Segment-Definitionen
│   ├── codelists.schema.yml        # Schema für alle Code List-Definitionen
│   └── messages.schema.yml         # Schema für alle Message-Definitionen
│
└── edifact-d20b/                   # Standard-spezifische JSON-Daten
    └── data/
        ├── elements.json           # 649 Data Elements
        ├── composites.json         # 100+ Composite Elements
        ├── segments.json           # 100+ Segment Definitions
        ├── codelists.json          # 200+ Code Lists
        └── messages/
            ├── ORDERS.json
            ├── INVOIC.json
            └── ...
```

**Rationale:** Schemas sind **standard-übergreifend** (D.20B, D.96A nutzen gleiche Struktur),
daher einmal in `directories/schema/` statt in jedem Standard-Ordner.

---

## 🔐 Für Repository-Owner (nur du)

### 1. Scripts erhalten

Die Generator-Scripts sind in einem **separaten privaten Backup** gespeichert.

```bash
# Option A: Von privatem Backup wiederherstellen
# (Details: Siehe interne Dokumentation)

# Option B: Von lokalem Backup
cp -r ~/Backups/ediflow-scripts/* scripts/
```

### 2. Resources erhalten

UN/EDIFACT Spezifikationen können von der offiziellen UN/CEFACT Seite heruntergeladen werden:

**Download:**
- **D.20B:** https://unece.org/trade/uncefact/unedifact-directories (ZIP)
- Entpacke nach: `resources/edifact/d20b/`

**Struktur:**
```
resources/edifact/d20b/
├── edmd/      # Message Definitions
├── edsd/      # Segment Definitions
├── eded/      # Data Element Definitions
├── edcd/      # Composite Element Definitions
└── uncl/      # Code Lists
```

---

## 👥 Für externe Entwickler (Community)

**Du benötigst die Scripts/Resources NICHT!**

Die **generierten JSON-Daten** werden als NPM Packages verteilt (z.B. `@ediflow/edifact-d20b`).

### Was du brauchst:

```bash
# 1. Core installieren
npm install @ediflow/core

# 2. Community Directory installieren (FREE)
npm install @ediflow/edifact-d20b

# 3. Nutzen
import { FileBasedMessageStructureRepository } from '@ediflow/core';

const repoPath = require.resolve('@ediflow/edifact-d20b');
const repo = new FileBasedMessageStructureRepository(repoPath);

const ordersDefinition = await repo.getMessageDefinition('EDIFACT', 'D.20B', 'ORDERS');
```

### Was du NICHT brauchst:

- ❌ `scripts/generate-d20b.ts` - Generator (nur für Maintainer)
- ❌ `resources/edifact/d20b/` - Original UN/EDIFACT Files (nur für Generation)
- ❌ `directories/` lokal - Wird über NPM Package geliefert

**Die JSON-Daten** im NPM Package sind ausreichend!

---

## 📝 Warum sind Scripts/Resources privat?

### 1. Generator-Scripts (`scripts/`)
- **Geistiges Eigentum** - Proprietäre Parsing-Logik
- **Wettbewerbsvorteil** - Automatische Generierung spart Wochen Arbeit
- **Komplexität** - Externe Entwickler würden sie nicht verstehen/brauchen

### 2. UN/EDIFACT Spezifikationen (`resources/`)
- **Urheberrecht** - UN/CEFACT hält Copyright
- **Lizenzbedingungen** - Dürfen nicht ohne Weiteres verteilt werden
- **Dateigröße** - Hunderte von Megabytes (unnötig für Git)

### 3. Generierte Directories (`directories/`)
- **Lokal für Development** - Während der Entwicklung
- **Via NPM für Community** - Als `@ediflow/edifact-d20b` Package
- **Open Source** - MIT License (abgeleitetes Werk, Fair Use)

---

## 🚀 Für Maintainer: Repository-Generation

Falls du neue EDIFACT Versionen hinzufügen möchtest:

### Voraussetzungen:
1. Zugriff auf `scripts/` (privat)
2. UN/EDIFACT Directory in `resources/`

### Generation:

```bash
# D.20B mit 7 Messages generieren (JSON Output!)
npx tsx scripts/generate-d20b.ts ORDERS INVOIC DESADV IFTMIN APERAK ORDRSP RECADV

# Ausgabe:
# ✓ directories/edifact-d20b/data/elements.json (649 elements)
# ✓ directories/edifact-d20b/data/composites.json (100+ composites)
# ✓ directories/edifact-d20b/data/segments.json (100+ segments)
# ✓ directories/edifact-d20b/data/codelists.json (200+ code lists)
# ✓ directories/edifact-d20b/data/messages/ORDERS.json
# ✓ directories/edifact-d20b/data/messages/INVOIC.json
# ... (5 weitere Messages)
```

### NPM Package erstellen:

```bash
# 1. Generiere Daten
npx tsx scripts/generate-d20b.ts ORDERS INVOIC DESADV

# 2. Erstelle Package
cd directories/edifact-d20b
npm init -y
# Bearbeite package.json (name: @ediflow/edifact-d20b)

# 3. Publishe (Community = FREE, Professional = PAID)
npm publish --access public

# 4. Commit nur Schema (data/ wird via NPM verteilt)
git add directories/edifact-d20b/schema/
git commit -m "feat: add EDIFACT D.20B schema definitions"
```

### Neue Version hinzufügen:

```bash
# 1. Download D.24A von UN/CEFACT
# 2. Entpacke nach resources/edifact/d24a/
# 3. Generiere Repository
npx tsx scripts/generate-d24a.ts ORDERS INVOIC DESADV

# 4. Erstelle & Publishe NPM Package
cd directories/edifact-d24a
npm init -y
npm publish --access public

# 5. Commit nur Schema
git add directories/edifact-d24a/schema/
git commit -m "feat: add EDIFACT D.24A schema definitions"
```

---

## 📋 Zusammenfassung

| Datei/Ordner | Git Status | Grund |
|--------------|------------|-------|
| `src/` (Core) | ✅ **Public** | Code: Clean Architecture (MIT) |
| `directories/*/schema/` | ✅ **Public** | YAML Schema-Definitionen |
| `directories/*/data/` | 🔒 **Private** (lokal) | JSON-Daten via NPM verteilt |
| `scripts/` | 🔒 **Private** | Proprietäre Generator-Logik |
| `resources/` | 🔒 **Private** | UN/EDIFACT Specs (Copyright) |
| `docs/private/` | 🔒 **Private** | Interne Business-Dokumentation |

**NPM Packages:**
| Package | Status | Inhalt |
|---------|--------|--------|
| `@ediflow/core` | ✅ Public (FREE) | Code: Parser, Validator, Builder |
| `@ediflow/edifact-d20b` | ✅ Public (FREE) | JSON: 7 Messages (Community) |
| `@ediflow/edifact-d20b-pro` | 🔒 Private (PAID) | JSON: 50+ Messages (Professional) |

---

## ❓ FAQ

**Q: Kann ich selbst neue EDIFACT Versionen hinzufügen?**  
A: Nein, nur Maintainer mit Zugriff auf Scripts/Resources können das.

**Q: Kann ich die generierten Daten nutzen?**  
A: Ja! Via NPM: `npm install @ediflow/edifact-d20b` (Community = FREE)

**Q: Woher bekomme ich UN/EDIFACT Spezifikationen?**  
A: https://unece.org/trade/uncefact/unedifact-directories (offiziell)

**Q: Warum nicht alles Open Source?**  
A: Generator-Scripts sind geistiges Eigentum. Generierte Daten sind Open Source (Community).

**Q: Was ist der Unterschied zwischen Community und Professional?**  
A: Community = 7 Messages (FREE), Professional = 50+ Messages + Erweiterungen (PAID)

---

## 📚 Weitere Dokumentation

- **Architektur:** `docs/private/architecture/MESSAGE_STRUCTURE_REPOSITORY.md`
- **Sprint 5:** `docs/private/specifications/sprints/SPRINT_05.md`

---

**Last Updated:** 26 Jan 2026  
**Maintainer:** Nur Repository Owner
