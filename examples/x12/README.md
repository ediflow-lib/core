# EDIFlow X12 Examples

Runnable examples demonstrating **@ediflow/x12** features with real X12 messages and actual output.

## 🚀 Run All Examples

```bash
# From repository root
npx tsx examples/x12/build-850/index.ts
npx tsx examples/x12/parse-850/index.ts
npx tsx examples/x12/validate-837/index.ts
npx tsx examples/x12/schema-export/index.ts
npx tsx examples/x12/multi-message/index.ts
```

---

## 📦 Examples

### 1. build-850 — Build X12 850 Purchase Order

Build a complete X12 850 message from scratch using `X12MessageBuilder` and verify it with a round-trip parse.

```bash
npx tsx examples/x12/build-850/index.ts
```

**Output:**
```
╔══════════════════════════════════════════╗
║   EDIFlow — Build X12 850 PO Example     ║
╚══════════════════════════════════════════╝

─── Generated X12 850 ───────────────────────────────────────
ST*850*0001~
BEG*00*SA*PO-2026-001**20260503~
REF*DP*DEPT001~
DTM*002*20260510~
N1*BY*ACME Corporation*92*BUYER123~
N3*123 Main Street~
N4*New York*NY*10001*US~
N1*SE*Best Supplier Inc*92*SUPP456~
PO1*1*100*EA*10.50*PE*BP*WIDGET-A~
PID*F****Blue Widget 100-Pack~
PO1*2*50*EA*25.00*PE*BP*GADGET-B~
PID*F****Premium Gadget~
CTT*2~
SE*14*0001~

─── Round-Trip Verification ─────────────────────────────────
  Standard:      X12
  Type:          850 (Purchase Order)
  Version:       004010
  PO Number:     PO-2026-001
  Order Date:    20260503
  Line Items:    2
  Total Value:   USD 2300.00

✅ Build + Round-trip complete!
```

---

### 2. parse-850 — Parse X12 850 Purchase Order

Parse a real X12 850 message and extract buyer, seller, line items, and totals.

```bash
npx tsx examples/x12/parse-850/index.ts
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

### 3. validate-837 — Validate X12 837 Healthcare Claim

Parse a healthcare claim, inspect service lines, and demonstrate both valid and invalid validation scenarios.

```bash
npx tsx examples/x12/validate-837/index.ts
```

**Output:**
```
╔══════════════════════════════════════════╗
║   EDIFlow — Validate X12 837 Example     ║
╚══════════════════════════════════════════╝

─── Parse 837 Healthcare Claim ──────────────────────────────
  Message Type:    837 (Healthcare Claim)
  Version:         005010
  Claim ID:        CLAIM001
  Claim Amount:    USD 1500.00
  Service Dates:   20260101-20260131

  Member:          JOHN, DOE
  Member ID:       MEMB123456789

  Provider:        CITY MEDICAL CENTER
  NPI:             1234567890

  Service Lines:
    1. Procedure: HC:99213  |  Amount: USD 150.00  |  Units: 1
    2. Procedure: HC:85025  |  Amount: USD 50.00  |  Units: 1

─── Validate: Correct Envelope ──────────────────────────────
  Result:   ✅ VALID
  Errors:   0

─── Validate: ISA/IEA Control Number Mismatch ───────────────
  Result:   ❌ INVALID
  Errors:   1
    ⚠  [ENVELOPE_CONTROL_NUMBER_MISMATCH] ISA/IEA control number mismatch: ISA="000000002" IEA="999999999"

✅ Validation example complete!
```

---

### 4. schema-export — Load X12 004010 Definitions

Load X12 message structure definitions from `@ediflow/x12-004010` and inspect segment/element definitions, then export as JSON Schema.

```bash
npx tsx examples/x12/schema-export/index.ts
```

**Requires:** `@ediflow/x12-004010` package

**Output:**
```
─── Loading X12 004010 850 Structure ────────────────────────
  Standard:        X12
  Version:         004010
  Message Type:    850
  Name:            Purchase Order
  Top-level nodes: 40

─── Key Segments ────────────────────────────────────────────
  BEG    Beginning Segment for Purchase Order ✓ mandatory  (12 elements)
  SE     Transaction Set Trailer             ✓ mandatory  (2 elements)

─── BEG Element Definitions ─────────────────────────────────
  [0] 353    "Transaction Set Purpose Code"  (maxLength: 2, M)
  [1] 92     "Purchase Order Type Code"  (maxLength: 2, M)
  [2] 324    "Purchase Order Number"  (maxLength: 22, M)
  ...

─── JSON Schema Export (BEG segment) ───────────────────────
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "X12 004010 850 Purchase Order",
  ...
}

✅ Schema export example complete!
```

---

### 5. multi-message — Parse Multiple Transaction Types

Parse 850, 810, 856, and 997 in a single run and show a summary table.

```bash
npx tsx examples/x12/multi-message/index.ts
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

