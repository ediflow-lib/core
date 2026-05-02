# EDIFlow X12 Examples

Runnable examples demonstrating **@ediflow/x12** features with real X12 messages and actual output.

## 🚀 Run All Examples

```bash
# From repository root
node examples/x12/parse-850/index.js
node examples/x12/validate-837/index.js
node examples/x12/schema-export/index.js
node examples/x12/multi-message/index.js
```

---

## 📦 Examples

### 1. parse-850 — Parse X12 850 Purchase Order

Parse a real X12 850 message and extract buyer, seller, line items, and totals.

```bash
node examples/x12/parse-850/index.js
```

**Output:**
```
╔══════════════════════════════════════════╗
║     EDIFlow — Parse X12 850 Example      ║
╚══════════════════════════════════════════╝

📋 Message Info
  Standard:      X12
  Type:          850 (Purchase Order)
  Version:       005010
  Segments:      14

📄 Order Header
  PO Number:     PO123456
  Order Date:    2026-02-04
  Purpose:       Original Order
  Order Type:    Stand-alone

🏢 Buyer
  Name:          ACME Corporation
  ID:            BUYER123
  Address:       123 Main Street
  City/State:    New York, NY 10001

🏭 Seller
  Name:          Best Supplier Inc
  ID:            SUPP456

📦 Line Items
  Line 1:        100 EA × USD 10.50 = USD 1050.00  [WIDGET-A]
  Line 2:        50 EA × USD 25.00 = USD 1250.00  [GADGET-B]

💰 Summary
  Total Lines:   2
  Total Value:   USD 2300.00

✅ Parsing complete!
```

---

### 2. validate-837 — Validate X12 837 Healthcare Claim

Parse a healthcare claim, inspect service lines, and demonstrate both valid and invalid validation scenarios.

```bash
node examples/x12/validate-837/index.js
```

**Output:**
```
╔══════════════════════════════════════════╗
║   EDIFlow — Validate X12 837 Example     ║
╚══════════════════════════════════════════╝

─── Test 1: Parse 837 Healthcare Claim ─────────────────────
  Message Type:    837 (Healthcare Claim)
  Claim ID:        CLAIM001
  Claim Amount:    USD 1500.00
  Member:          JOHN, DOE
  Provider:        CITY MEDICAL CENTER
  Service Lines:
    1. Procedure: HC:99213 | Amount: USD 150.00 | Units: 1
    2. Procedure: HC:85025 | Amount: USD 50.00 | Units: 1

─── Test 2: Validate With Envelope Segments ─────────────────
  Result:          ✅ VALID
  Errors:          0

─── Test 3: Validate With Control Number Mismatch ───────────
  Result:          ❌ INVALID
  Errors:          1
    ⚠  [ENVELOPE_CONTROL_NUMBER_MISMATCH] ISA/IEA control number mismatch
```

---

### 3. schema-export — Load X12 004010 Definitions

Load X12 message structure definitions from `@ediflow/x12-004010` and export as JSON Schema.

```bash
node examples/x12/schema-export/index.js
```

**Requires:** `@ediflow/x12-004010` package

**Output:**
```
─── Loading X12 004010 850 Structure ────────────────────────
  Standard:        X12
  Version:         004010
  Message Type:    850
  Name:            Purchase Order
  Segments:        40

─── JSON Schema Export (simplified) ────────────────────────
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "X12 004010 850 Purchase Order",
  ...
}
```

---

### 4. multi-message — Parse Multiple Transaction Types

Parse 850, 810, 856, and 997 in a single run and show a summary table.

```bash
node examples/x12/multi-message/index.js
```

**Output:**
```
─── Parsed Messages ────────────────────────────────────────
  Type  Name                          Segments  Version  Status
  ────  ────────────────────────────  ────────  ───────  ──────
  850   Purchase Order                       6  005010   ✅
  810   Invoice                              6  005010   ✅
  856   Advance Ship Notice                 11  005010   ✅
  997   Functional Acknowledgment            6  005010   ✅
```

---

## 📚 Learn More

- [Architecture Guide](../../docs/ARCHITECTURE.md)
- [Quick Start](../../docs/QUICK_START.md)
- [@ediflow/x12 package](../../packages/x12/README.md)
- [@ediflow/x12-004010 definitions](../../packages/x12-004010/README.md)

