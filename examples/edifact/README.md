# EDIFlow EDIFACT Examples

Runnable examples demonstrating **@ediflow/edifact** features with real EDIFACT messages and actual output.

## 🚀 Run All Examples

```bash
# From repository root
npx tsx examples/edifact/build-invoic/index.ts
npx tsx examples/edifact/parse-orders/index.ts
npx tsx examples/edifact/validate-desadv/index.ts
```

---

## 📦 Examples

### 1. build-invoic — Build EDIFACT INVOIC (Invoice)

Build a complete EDIFACT INVOIC message from scratch, wrap it in UNH/UNT and UNB/UNZ envelopes, and verify with a round-trip parse.

```bash
npx tsx examples/edifact/build-invoic/index.ts
```

**Output:**
```
╔══════════════════════════════════════════╗
║  EDIFlow — Build EDIFACT INVOIC Example  ║
╚══════════════════════════════════════════╝

─── Generated EDIFACT INVOIC ────────────────────────────────
UNB+UNOC:3+SUPP456:14+BUYER123:14+260205:0800+2'
UNH+1+INVOIC:D:20B:UN'
BGM+380+INV-2026-001+9'
DTM+137:20260205:102'
DTM+35:20260215:102'
NAD+SE+SUPP456::92++Best Supplier Inc+456 Industrial Ave+Chicago++60601+US'
NAD+BY+BUYER123::92++ACME Corporation'
CUX+2:EUR:4'
LIN+1++WIDGET-A:SA'
QTY+47:100:PCE'
MOA+203:1050.00'
PRI+INV:10.50:CA'
LIN+2++GADGET-B:SA'
QTY+47:50:PCE'
MOA+203:1250.00'
PRI+INV:25.00:CA'
UNS+S'
MOA+79:2300.00'
CNT+2:2'
UNT+19+1'
UNZ+1+2'

─── Round-Trip Verification ─────────────────────────────────
  Standard:      EDIFACT
  Type:          INVOIC (Invoice)
  Version:       D.20B
  Invoice #:     INV-2026-001
  Line Items:    2
  Total Amount:  EUR 2300.00

✅ Build + Round-trip complete!
```

---

### 2. parse-orders — Parse EDIFACT ORDERS (Purchase Order)

Demonstrates **two levels** of parsing: raw segment access (Level 1) vs. schema-aware access with `@ediflow/edifact-d96a` definitions (Level 2).

```bash
npx tsx examples/edifact/parse-orders/index.ts
```

**Output:**
```
╔══════════════════════════════════════════╗
║  EDIFlow — Parse EDIFACT ORDERS Example  ║
╚══════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────┐
│ LEVEL 1 — Syntax Parsing (raw EDIMessage)                   │
│ Low-level: you work with segments and element indices        │
└─────────────────────────────────────────────────────────────┘

  Standard:   EDIFACT
  Version:    D.96A
  Type:       ORDERS
  Segments:   18

  Raw access (must know segment/element positions by heart):
    PO Number:  bgm.elements[1].value               → "PO-2026-001"
    Buyer Name: nad.elements[3].value               → "ACME Corporation"

  ⚠️  Problem: What is elements[1]? You must look up the spec every time!

┌─────────────────────────────────────────────────────────────┐
│ LEVEL 2 — Schema-Aware Parsing (the real EDIFlow power!)    │
│ @ediflow/edifact-d96a → named element definitions           │
└─────────────────────────────────────────────────────────────┘

  ✅ Schema loaded: "Purchase order"
     Standard: EDIFACT   Version: D.96A   Type: ORDERS
     Top-level nodes: 26 (segments + segment groups)

  BGM element[1] = 1004 "Document/message number" = PO number ✅

✅ Done!
```

**Requires:** `@ediflow/edifact-d96a` package

---

### 3. validate-desadv — Validate EDIFACT DESADV (Despatch Advice)

Parse and validate a DESADV (Despatch Advice) message with `@ediflow/edifact-d01b` definitions.

```bash
npx tsx examples/edifact/validate-desadv/index.ts
```

**Output:**
```
╔══════════════════════════════════════════╗
║ EDIFlow — Validate EDIFACT DESADV Example║
╚══════════════════════════════════════════╝

─── Parse DESADV ────────────────────────────────────────────
  Standard:       EDIFACT
  Type:           DESADV (Despatch Advice)
  Version:        D.01B
  Segments:       18

  Shipment ID:    SHIP-2026-001
  Despatch Date:  2026-02-06
  Est. Delivery:  2026-02-07

  Supplier:       Best Supplier Inc (SUPP456)
  Buyer:          ACME Corporation (BUYER123)

  Shipped Items:
    1. WIDGET-A      100 PCE
    2. GADGET-B      50 PCE

─── Validate ────────────────────────────────────────────────
  Result:         ✅ VALID
  Errors:         0
  → Message passes all EDIFACT structure validation rules

✅ Validate DESADV example complete!
```

---

## 📚 Learn More

- [Architecture Guide](../../docs/ARCHITECTURE.md)
- [Quick Start](../../docs/QUICK_START.md)
- [@ediflow/edifact package](../../packages/edifact/README.md)
- [@ediflow/edifact-d96a definitions](../../packages/edifact-d96a/README.md)
- [@ediflow/edifact-d20b definitions](../../packages/edifact-d20b/README.md)

