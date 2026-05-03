# EDIFlow CLI Examples

> **Runnable examples for all CLI commands and EDI formats.**  
> Clone this repo and run any example from the repository root.

## Prerequisites

```bash
git clone https://github.com/ediflow-lib/core.git
cd core
npm install
cd packages/cli && npm run build && cd ../..
```

All commands below run **from the repository root**.

---

## Directory Structure

Each use case has a clear `input/` and `result/` folder:

```
examples/cli/
  edifact/
    parse/
      input/orders.edi              <- EDI input
      result/orders.json            <- parsed JSON output
    validate/
      input/orders.edi
      result/orders.json            <- validation result
    build/
      input/orders.json             <- JSON input
      result/orders.edi             <- built EDI output
    export-schema/
      result/orders-d20b.json       <- JSON Schema
  x12/
    parse/
      input/purchase-order-850.edi
      result/purchase-order-850.json
    validate/
      input/purchase-order-850.edi
      result/purchase-order-850.json
    export-schema/
      result/850-004010.json
  hipaa/
    parse/
      input/claim-837.edi
      result/claim-837.json
    validate/
      input/claim-837.edi
      result/claim-837.json
  errors/
    invalid.edi                     <- malformed EDI
    random.txt                      <- non-EDI content
```

---

## 1. Parse Command

```
ediflow parse <file> [options]

  -s, --standard <standard>            EDIFACT | X12 (auto-detected)
  -f, --format <format>                json | yaml (default: json)
  -o, --output <file>                  save to file
  --property-parse-mode <mode>         code | name (default: code)
  --codelist-value-parse-mode <mode>   code | name (default: code)
```

> **Smart Output:** When a data package (`@ediflow/edifact-d96a`, `@ediflow/x12-004010` etc.) is installed,
> `parse` returns a Business Object under the `data` key instead of raw segments.
> Raw segments are emitted as fallback with a `_warning` field.

### EDIFACT ORDERS

```bash
node packages/cli/dist/index.js parse examples/cli/edifact/parse/input/orders.edi
```

**Input:** [`edifact/parse/input/orders.edi`](edifact/parse/input/orders.edi)  
**Current result:** [`edifact/parse/result/orders.json`](edifact/parse/result/orders.json)  
**Expected result (after mapping rules):** [`edifact/parse/result/orders-expected.json`](edifact/parse/result/orders-expected.json)

<details>
<summary>Expected Output (click to expand)</summary>

```json
{
  "metadata": {
    "standard": "EDIFACT",
    "version": "D.96A",
    "messageType": "ORDERS",
    "segmentCount": 18,
    "delimiters": { "segment": "'", "element": "+", "component": ":" }
  },
  "data": {
    "documentNumber": "PO-2026-001",
    "orderDate": "2026-02-04T00:00:00.000Z",
    "buyer": { "id": "BUYER123", "name": "ACME Corporation" },
    "supplier": { "id": "SUPP456", "name": "Best Supplier Inc" },
    "currency": "EUR",
    "lineItems": [
      { "lineNumber": "1", "productId": "WIDGET-A", "quantity": 100, "price": 10.50 },
      { "lineNumber": "2", "productId": "GADGET-B", "quantity": 50, "price": 25.00 }
    ]
  }
}
```
</details>

### X12 850 Purchase Order

```bash
node packages/cli/dist/index.js parse examples/cli/x12/parse/input/purchase-order-850.edi
```

**Input:** [`x12/parse/input/purchase-order-850.edi`](x12/parse/input/purchase-order-850.edi)  
**Result:** [`x12/parse/result/purchase-order-850.json`](x12/parse/result/purchase-order-850.json)

### HIPAA 837 Healthcare Claim

```bash
node packages/cli/dist/index.js parse examples/cli/hipaa/parse/input/claim-837.edi
```

**Input:** [`hipaa/parse/input/claim-837.edi`](hipaa/parse/input/claim-837.edi)  
**Result:** [`hipaa/parse/result/claim-837.json`](hipaa/parse/result/claim-837.json)

### Output Options

```bash
# YAML output
node packages/cli/dist/index.js parse examples/cli/edifact/parse/input/orders.edi -f yaml

# Explicit standard
node packages/cli/dist/index.js parse examples/cli/x12/parse/input/purchase-order-850.edi -s X12

# Property names instead of codes
node packages/cli/dist/index.js parse examples/cli/edifact/parse/input/orders.edi \
  --property-parse-mode name --codelist-value-parse-mode name
```

---

## 2. Validate Command

```
ediflow validate <file> [options]

  -s, --standard <standard>    EDIFACT | X12 (auto-detected)
  -f, --format <format>        json | text | table (default: json)
  -o, --output <file>          save to file
  --strict                     strict validation mode
```

### EDIFACT Validation

```bash
# JSON result
node packages/cli/dist/index.js validate examples/cli/edifact/validate/input/orders.edi

# Human-readable text
node packages/cli/dist/index.js validate examples/cli/edifact/validate/input/orders.edi -f text
```

**Input:** [`edifact/validate/input/orders.edi`](edifact/validate/input/orders.edi)  
**Result:** [`edifact/validate/result/orders.json`](edifact/validate/result/orders.json)

**Expected text output:**
```
✓ Valid EDIFACT D.96A ORDERS message
  - 0 errors
  - 0 warnings
```

### X12 Validation

```bash
node packages/cli/dist/index.js validate examples/cli/x12/validate/input/purchase-order-850.edi -f text
```

**Input:** [`x12/validate/input/purchase-order-850.edi`](x12/validate/input/purchase-order-850.edi)  
**Result:** [`x12/validate/result/purchase-order-850.json`](x12/validate/result/purchase-order-850.json)

**Expected text output:**
```
✓ Valid X12 005010 850 message
  - 0 errors
  - 0 warnings
```

### HIPAA Validation

```bash
node packages/cli/dist/index.js validate examples/cli/hipaa/validate/input/claim-837.edi -f text
```

**Input:** [`hipaa/validate/input/claim-837.edi`](hipaa/validate/input/claim-837.edi)  
**Result:** [`hipaa/validate/result/claim-837.json`](hipaa/validate/result/claim-837.json)

### Output Format Comparison

```bash
# JSON (machine-readable)
node packages/cli/dist/index.js validate examples/cli/edifact/validate/input/orders.edi -f json

# Text (human-readable)
node packages/cli/dist/index.js validate examples/cli/edifact/validate/input/orders.edi -f text

# Table (error details)
node packages/cli/dist/index.js validate examples/cli/edifact/validate/input/orders.edi -f table

# Strict mode
node packages/cli/dist/index.js validate examples/cli/x12/validate/input/purchase-order-850.edi --strict
```

---

## 3. Build Command

```
ediflow build <file> [options]

  -s, --standard <standard>    EDIFACT | X12 (from JSON if omitted)
  -o, --output <file>          save to .edi file
```

> **Note:** Currently supported for EDIFACT. X12 builder coming soon.

### EDIFACT Build

```bash
# Build to stdout
node packages/cli/dist/index.js build examples/cli/edifact/build/input/orders.json

# Build to file
node packages/cli/dist/index.js build examples/cli/edifact/build/input/orders.json \
  -o examples/cli/edifact/build/result/orders.edi
```

**Input:** [`edifact/build/input/orders.json`](edifact/build/input/orders.json)  
**Result:** [`edifact/build/result/orders.edi`](edifact/build/result/orders.edi)

---

## 4. Export Schema Command

```
ediflow export-schema [options]

  -m, --message <type>         message type (e.g. 850, ORDERS)
  -s, --standard <standard>    EDIFACT | X12 (default: EDIFACT)
  -v, --version <version>      version (default: D.20B)
  -f, --format <format>        json | yml (default: json)
  --all                        export all message types
```

### EDIFACT Schemas

```bash
node packages/cli/dist/index.js export-schema -m ORDERS -s EDIFACT -v D.20B
node packages/cli/dist/index.js export-schema -m INVOIC -s EDIFACT -v D.96A
node packages/cli/dist/index.js export-schema -m DESADV -s EDIFACT -v D.20B -f yml
```

**Result:** [`edifact/export-schema/result/orders-d20b.json`](edifact/export-schema/result/orders-d20b.json)

**Available versions:** `D.96A` (126 msgs), `D.01B`, `D.12A`, `D.20B` (195 msgs)

### X12 Schemas

```bash
node packages/cli/dist/index.js export-schema -m 850 -s X12 -v 004010
node packages/cli/dist/index.js export-schema -m 810 -s X12 -v 006040
node packages/cli/dist/index.js export-schema -m 856 -s X12 -v 004010
```

**Result:** [`x12/export-schema/result/850-004010.json`](x12/export-schema/result/850-004010.json)

**Available versions:** `004010` (293 msgs), `006040` (319 msgs)

### Export All

```bash
# All EDIFACT D.20B schemas (195 messages)
node packages/cli/dist/index.js export-schema -s EDIFACT -v D.20B --all

# All X12 004010 schemas (293 messages)
node packages/cli/dist/index.js export-schema -s X12 -v 004010 --all

# YAML format
node packages/cli/dist/index.js export-schema -m 850 -s X12 -v 004010 -f yml
```

---

## 5. Roundtrip (Parse → Build → Parse)

```bash
# 1. Parse EDI → JSON
node packages/cli/dist/index.js parse examples/cli/edifact/parse/input/orders.edi \
  -o /tmp/orders-parsed.json

# 2. Build JSON → EDI
node packages/cli/dist/index.js build /tmp/orders-parsed.json \
  -o /tmp/orders-rebuilt.edi

# 3. Validate rebuilt EDI
node packages/cli/dist/index.js validate /tmp/orders-rebuilt.edi -f text
# ✓ Valid EDIFACT D.96A ORDERS message
```

---

## 6. Error Handling

```bash
# File not found
node packages/cli/dist/index.js parse nonexistent.edi
# Error: File not found: nonexistent.edi

# Unknown format
node packages/cli/dist/index.js parse examples/cli/errors/random.txt
# Error: Unable to detect EDI standard. Please specify with --standard flag.

# Invalid EDI
node packages/cli/dist/index.js validate examples/cli/errors/invalid.edi -f text
```

**Error files:** [`errors/invalid.edi`](errors/invalid.edi), [`errors/random.txt`](errors/random.txt)

---

## 7. Scripting & Automation

```bash
# Extract segment tags with jq
node packages/cli/dist/index.js parse examples/cli/x12/parse/input/purchase-order-850.edi \
  | jq '[.segments[].tag]'

# CI/CD validation (exit code 0 = valid, 1 = invalid)
node packages/cli/dist/index.js validate examples/cli/x12/validate/input/purchase-order-850.edi \
  && echo "VALID" || echo "INVALID"

# Batch validate all .edi files
for f in examples/cli/*/parse/input/*.edi; do
  echo "--- $f ---"
  node packages/cli/dist/index.js validate "$f" -f text 2>&1
done

# Generate schemas for API projects
node packages/cli/dist/index.js export-schema -m 850 -s X12 -v 004010 > schemas/x12-850.json
```

---

## Supported Standards & Versions

| Standard | Package | Version | Messages |
|----------|---------|---------|----------|
| EDIFACT | `@ediflow/edifact-d96a` | D.96A | 126 |
| EDIFACT | `@ediflow/edifact-d01b` | D.01B | — |
| EDIFACT | `@ediflow/edifact-d12a` | D.12A | — |
| EDIFACT | `@ediflow/edifact-d20b` | D.20B | 195 |
| X12 | `@ediflow/x12-004010` | 004010 | 293 |
| X12 | `@ediflow/x12-006040` | 006040 | 319 |
| HIPAA | `@ediflow/hipaa-x12-005010` | 005010 | 14 |
| EANCOM | `@ediflow/eancom-2002` | EANCOM2002 | 49 |

---

## More Resources

- [Quick Start Guide](../../docs/QUICK_START.md)
- [Architecture](../../docs/ARCHITECTURE.md)
- [X12 Examples (programmatic)](../x12/README.md)
- [EDIFACT Examples (programmatic)](../edifact/README.md)
- [HIPAA Examples (programmatic)](../hipaa/README.md)
