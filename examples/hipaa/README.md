# EDIFlow HIPAA Examples

Runnable examples demonstrating **HIPAA X12** message parsing and validation with **@ediflow/x12** and **@ediflow/hipaa-x12-005010**.

## 🚀 Run All Examples

```bash
# From repository root
npx tsx examples/hipaa/parse-837/index.ts
npx tsx examples/hipaa/validate-835/index.ts
```

---

## 📦 Examples

### 1. parse-837 — Parse HIPAA 837P Professional Claim

Parse a HIPAA-compliant 837P claim with subscriber, provider, diagnosis codes (ICD-10), and service lines.

```bash
npx tsx examples/hipaa/parse-837/index.ts
```

**Output:**
```
╔══════════════════════════════════════════╗
║  EDIFlow — Parse HIPAA 837P Example      ║
╚══════════════════════════════════════════╝

📋 Message Info
  Standard:        X12
  Type:            837 (Professional Claim)
  Version:         005010
  Segments:        25

🏥 Claim Header
  Claim ID:        CLAIM-2026-001
  Total Amount:    USD 2050.00
  Service Date:    2026-02-01
  Place of Svc:    11 (Office)

👤 Patient / Subscriber
  Name:            JOHN, DOE
  Member ID:       BCBS123456789
  DOB:             1980-03-15
  Gender:          Male
  Address:         100 Patient Lane
  City/State:      Springfield, IL 62701

🏢 Payer
  Name:            BLUE CROSS BLUE SHIELD
  Payer ID:        BCBS00001

👨‍⚕️  Rendering Provider
  Name:            Dr. SMITH, JANE
  NPI:             1112223334

🔬 Diagnosis Codes (ICD-10)
  J20.9      Acute bronchitis (COVID-19)
  Z87.891    History of tobacco use

💊 Service Lines
  Line 1: 99213    Office Visit (Level 3)     USD 150.00 [mod:25]
  Line 2: 87635    COVID-19 Test (PCR)        USD 75.00
  Line 3: 71046    Chest X-Ray (2 views)      USD 125.00

💰 Claim Summary
  Lines:           3
  Total Billed:    USD 350.00
  BPR Amount:      USD 2050.00

✅ HIPAA 837P parsing complete!
```

---

### 2. validate-835 — Validate HIPAA 835 Remittance Advice

Parse a Healthcare Payment / Remittance Advice (835) and demonstrate both valid and invalid envelope validation scenarios.

```bash
npx tsx examples/hipaa/validate-835/index.ts
```

**Output:**
```
╔══════════════════════════════════════════╗
║  EDIFlow — Validate HIPAA 835 Example    ║
╚══════════════════════════════════════════╝

─── Parse 835 Remittance Advice ─────────────────────────────
  Message Type:    835 (Payment/Remittance Advice)
  Version:         005010
  Check/EFT #:     835-2026-001
  Payment Date:    20260204
  Payment Amt:     USD 350.00

  Payer:           BLUE CROSS BLUE SHIELD (BCBS00001)
  Provider:        CITY MEDICAL CENTER (NPI: 1234567890)

  Claim ID:        CLAIM-2026-001
  Patient:         JOHN, DOE
  Claim Status:    Paid
  Billed:          USD 350.00
  Paid:            USD 350.00

  Service Payments:
    Line 1: 99213    USD 150.00
    Line 2: 87635    USD 75.00
    Line 3: 71046    USD 125.00
  Total Paid:      USD 350.00

─── Validate: Correct Envelope ──────────────────────────────
  Result:   ✅ VALID
  Errors:   0

─── Validate: ISA/IEA Control Number Mismatch ───────────────
  Result:   ❌ INVALID
  Errors:   1
    ⚠  [ENVELOPE_CONTROL_NUMBER_MISMATCH] ISA/IEA control number mismatch: ISA="000000003" IEA="999999999"

✅ Validation HIPAA 835 example complete!
```

---

## 📚 Learn More

- [Architecture Guide](../../docs/ARCHITECTURE.md)
- [Quick Start](../../docs/QUICK_START.md)
- [@ediflow/x12 package](../../packages/x12/README.md)
- [@ediflow/hipaa-x12-005010 definitions](../../packages/hipaa-x12-005010/README.md)

