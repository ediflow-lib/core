# EDIFlow EANCOM Examples

Runnable examples demonstrating **EANCOM 2002** message parsing and validation with **@ediflow/edifact** and **@ediflow/eancom-2002**.

> **EANCOM** is GS1's industry-specific subset of UN/EDIFACT for retail and supply chain.  
> Key difference to plain EDIFACT: uses **GLN** (Global Location Numbers) for parties and **EAN-13/GTIN** for products.

## 🚀 Run All Examples

```bash
# From repository root
npx tsx examples/eancom/parse-desadv/index.ts
npx tsx examples/eancom/validate-desadv/index.ts
```

---

## 📦 Examples

### 1. parse-desadv — Parse EANCOM DESADV (Despatch Advice / ASN)

Parse a real-world EANCOM 2002 Despatch Advice with GS1 GLN party identifiers, EAN-13 product barcodes, and transport details.

```bash
npx tsx examples/eancom/parse-desadv/index.ts
```

**Output:**
```
╔══════════════════════════════════════════╗
║  EDIFlow — Parse EANCOM DESADV Example   ║
╚══════════════════════════════════════════╝

📋 Message Info
  Standard:        EDIFACT
  Type:            DESADV (Despatch Advice)
  Version:         D.02B
  Segments:        27

📦 Shipment Header
  ASN Number:      ASN-2026-001
  Despatch Date:   2026-05-03
  Est. Delivery:   2026-05-04
  PO Reference:    PO-2026-001

🏢 Parties (GLN — Global Location Number)
  Buyer:           ACME Retail
  Buyer GLN:       5412345000013
  Buyer Address:   London,
  Supplier:        Best Supplier GmbH
  Supplier GLN:    4012345000014
  Supplier Address:Hamburg,

🚚 Transport
  Carrier:         DHL
  Mode:            Road (30)
  Vehicle Ref:     TRUCK-001
  Packages:        2 cartons

📋 Line Items (EAN-13 product codes)
  Line 1: WIDGET-A   EAN: 5412345111116  100 PCE  Premium Widget Type A
  Line 2: GADGET-B   EAN: 5412345222223   50 PCE  Smart Gadget Type B

  Total Items:     150 pcs across 2 lines

✅ Parse EANCOM DESADV complete!
```

---

### 2. validate-desadv — Validate EANCOM DESADV

Parse and validate an EANCOM DESADV — once with a correct envelope, once with a missing UNB segment.

```bash
npx tsx examples/eancom/validate-desadv/index.ts
```

**Output:**
```
╔══════════════════════════════════════════╗
║  EDIFlow — Validate EANCOM DESADV Example║
╚══════════════════════════════════════════╝

─── Parse DESADV ────────────────────────────────────────────
  Standard:       EDIFACT
  Type:           DESADV (Despatch Advice)
  Version:        D.02B
  Segments:       23
  ASN Number:     ASN-2026-001
  Despatch Date:  2026-05-03
  Supplier GLN:   4012345000014
  Buyer GLN:      5412345000013
  Line Items:     2

─── Validate: Correct Envelope ──────────────────────────────
  Result:   ✅ VALID
  Errors:   0
  → Message passes all EDIFACT structure validation rules

─── Validate: Missing UNB (BGM first) ───────────────────────
  Result:   ❌ INVALID
  Errors:   1
    ⚠  [INVALID_FIRST_SEGMENT] EDIFACT messages must start with UNB segment

✅ Validate EANCOM DESADV example complete!
```

---

## 🔑 EANCOM vs. Plain EDIFACT

| Feature | EANCOM 2002 | Plain EDIFACT |
|---------|-------------|---------------|
| **Party ID** | GLN (13-digit GS1 number, `:9`) | Free-form + qualifier |
| **Product ID** | EAN-13 / GTIN (`:EN`) | Free-form |
| **Message ref** | `DESADV:D:02B:UN:EAN008` | `DESADV:D:01B:UN` |
| **Industry** | Retail, FMCG, Consumer Goods | General |
| **Parser** | `@ediflow/edifact` | `@ediflow/edifact` |

---

## 📚 Learn More

- [Architecture Guide](../../docs/ARCHITECTURE.md)
- [Quick Start](../../docs/QUICK_START.md)
- [@ediflow/edifact package](../../packages/edifact/README.md)
- [@ediflow/eancom-2002 definitions](../../packages/eancom-2002/README.md)
- [CLI EANCOM examples](../cli/README.md) (parse, validate, export-schema)

