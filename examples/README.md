# EDIFlow Examples

Runnable examples demonstrating **EDIFlow** features across all supported EDI standards and interfaces.

## 📂 Example Categories

| Folder | Type | Description |
|--------|------|-------------|
| **[x12/](x12/README.md)** | Programmatic (TypeScript) | X12 850, 837, multi-message, schema export |
| **[edifact/](edifact/README.md)** | Programmatic (TypeScript) | EDIFACT INVOIC, ORDERS, DESADV |
| **[eancom/](eancom/README.md)** | Programmatic (TypeScript) | EANCOM 2002 DESADV (GS1 GLN + EAN-13) |
| **[hipaa/](hipaa/README.md)** | Programmatic (TypeScript) | HIPAA 837P, 835 with validation |
| **[cli/](cli/README.md)** | CLI commands | `parse`, `validate`, `build`, `export-schema` for all formats |

---

## 🚀 Run All Examples

```bash
# Prerequisites: install and build from repo root
npm install

# ── X12 ──────────────────────────────────────────────────────────
npx tsx examples/x12/build-850/index.ts
npx tsx examples/x12/parse-850/index.ts
npx tsx examples/x12/validate-837/index.ts
npx tsx examples/x12/schema-export/index.ts
npx tsx examples/x12/multi-message/index.ts

# ── EDIFACT ──────────────────────────────────────────────────────
npx tsx examples/edifact/build-invoic/index.ts
npx tsx examples/edifact/parse-orders/index.ts
npx tsx examples/edifact/validate-desadv/index.ts

# ── EANCOM ───────────────────────────────────────────────────────
npx tsx examples/eancom/parse-desadv/index.ts
npx tsx examples/eancom/validate-desadv/index.ts

# ── HIPAA ────────────────────────────────────────────────────────
npx tsx examples/hipaa/parse-837/index.ts
npx tsx examples/hipaa/validate-835/index.ts
```

---

## 🏗️ Structure

```
examples/
  README.md                   ← this file
  x12/
    README.md                 ← X12 example overview + outputs
    build-850/index.ts        ← Build 850 Purchase Order + round-trip
    parse-850/index.ts        ← Parse 850 Purchase Order
    validate-837/index.ts     ← Validate 837 Healthcare Claim
    schema-export/index.ts    ← Load X12 004010 schema definitions
    multi-message/index.ts    ← Parse 850 + 810 + 856 + 997 in one run
  edifact/
    README.md                 ← EDIFACT example overview + outputs
    build-invoic/index.ts     ← Build INVOIC + round-trip
    parse-orders/index.ts     ← Parse ORDERS (Level 1 + Level 2)
    validate-desadv/index.ts  ← Validate DESADV
  eancom/
    README.md                 ← EANCOM example overview + outputs
    parse-desadv/index.ts     ← Parse DESADV (GLN parties, EAN-13 products)
    validate-desadv/index.ts  ← Validate DESADV
  hipaa/
    README.md                 ← HIPAA example overview + outputs
    parse-837/index.ts        ← Parse 837P Professional Claim
    validate-835/index.ts     ← Validate 835 Remittance Advice
  cli/
    README.md                 ← CLI command examples with input/result files
    edifact/parse/input/
    edifact/build/input/
    x12/parse/result/
    hipaa/build/result/
    ...
```

---

## 📚 Learn More

- [Quick Start Guide](../docs/QUICK_START.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)
- [Developer Guide](../docs/DEVELOPER_GUIDE.md)




