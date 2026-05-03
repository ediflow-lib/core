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
  eancom/
    parse/
      input/desadv.edi              <- EANCOM DESADV (Despatch Advice)
      result/desadv.json            <- parsed EDI-message output
      result/desadv-business-object.json <- mapped business object
    validate/
      input/desadv.edi
      result/desadv.json            <- validation result
    export-schema/
      result/desadv-d02b.json       <- JSON Schema
  x12/
    parse/
      input/purchase-order-850.edi
      result/purchase-order-850.json
    validate/
      input/purchase-order-850.edi
      result/purchase-order-850.json
    build/
      input/purchase-order-850.json  <- parsed JSON input
      result/purchase-order-850.edi  <- built X12 output
    export-schema/
      result/850-004010.json
  hipaa/
    parse/
      input/claim-837.edi
      result/claim-837.json
    validate/
      input/claim-837.edi
      result/claim-837.json
    build/
      input/claim-837.json           <- parsed JSON input
      result/claim-837.edi           <- built X12 output
  errors/
    invalid.edi                     <- malformed EDI
    random.txt                      <- non-EDI content
```

---

## 1. Parse Command

```
ediflow parse <file> [options]

  -s, --standard <standard>           EDIFACT | X12 (auto-detected)
  -f, --format <format>               json | yaml (default: json)
  -o, --output <file>                 save to file
  --output-type <type>                edi-message | business-object (default: edi-message)
  --property-parse-mode <mode>        code | name | camelCase | snake_case | kebab-case (default: code)
  --skip-empty [bool]                 remove empty strings, arrays, objects and null values (default: true)
```

> **Output Types:**
> - `edi-message` (default): returns raw segments with metadata — always available.
> - `business-object`: returns a mapped business object under the `data` key when a data package
>   (`@ediflow/edifact-d96a`, `@ediflow/x12-004010` etc.) is installed. Falls back to raw segments
>   with a `_warning` field if no mapping is available.

### EDIFACT ORDERS

```bash
node packages/cli/dist/index.js parse examples/cli/edifact/parse/input/orders.edi
```

**Input:** [`edifact/parse/input/orders.edi`](edifact/parse/input/orders.edi)  
**Result:** [`edifact/parse/result/orders.json`](edifact/parse/result/orders.json)

<details>
<summary>Expected Output (click to expand)</summary>

```json
{
  "standard": "EDIFACT",
  "version": "D.96A",
  "messageType": "ORDERS",
  "segmentCount": 18,
  "delimiters": { "segment": "'", "element": "+", "component": ":" },
  "segments": [
    { "tag": "UNB", "elements": [ { "value": "UNOC:3", "components": ["UNOC","3"] }, { "value": "ACMECORP:14", "components": ["ACMECORP","14"] }, { "value": "SUPPLIER:14", "components": ["SUPPLIER","14"] }, { "value": "260204:1200", "components": ["260204","1200"] }, { "value": "1" } ] },
    { "tag": "UNH", "elements": [ { "value": "1" }, { "value": "ORDERS:D:96A:UN", "components": ["ORDERS","D","96A","UN"] } ] },
    { "tag": "BGM", "elements": [ { "value": "220" }, { "value": "PO-2026-001" }, { "value": "9" } ] },
    { "tag": "DTM", "elements": [ { "value": "137:20260204:102", "components": ["137","20260204","102"] } ] },
    { "tag": "DTM", "elements": [ { "value": "2:20260210:102", "components": ["2","20260210","102"] } ] },
    { "tag": "NAD", "elements": [ { "value": "BY" }, { "value": "BUYER123::92", "components": ["BUYER123","","92"] }, { "value": "" }, { "value": "ACME Corporation" }, { "value": "123 Main Street" }, { "value": "New York" }, { "value": "" }, { "value": "10001" }, { "value": "US" } ] },
    { "tag": "NAD", "elements": [ { "value": "SU" }, { "value": "SUPP456::92", "components": ["SUPP456","","92"] }, { "value": "" }, { "value": "Best Supplier Inc" }, { "value": "456 Industrial Ave" }, { "value": "Chicago" }, { "value": "" }, { "value": "60601" }, { "value": "US" } ] },
    { "tag": "CUX", "elements": [ { "value": "2:EUR:4", "components": ["2","EUR","4"] } ] },
    { "tag": "LIN", "elements": [ { "value": "1" }, { "value": "" }, { "value": "WIDGET-A:SA", "components": ["WIDGET-A","SA"] } ] },
    { "tag": "QTY", "elements": [ { "value": "21:100:PCE", "components": ["21","100","PCE"] } ] },
    { "tag": "PRI", "elements": [ { "value": "AAA:10.50:CA", "components": ["AAA","10.50","CA"] } ] },
    { "tag": "LIN", "elements": [ { "value": "2" }, { "value": "" }, { "value": "GADGET-B:SA", "components": ["GADGET-B","SA"] } ] },
    { "tag": "QTY", "elements": [ { "value": "21:50:PCE", "components": ["21","50","PCE"] } ] },
    { "tag": "PRI", "elements": [ { "value": "AAA:25.00:CA", "components": ["AAA","25.00","CA"] } ] },
    { "tag": "UNS", "elements": [ { "value": "S" } ] },
    { "tag": "CNT", "elements": [ { "value": "2:2", "components": ["2","2"] } ] },
    { "tag": "UNT", "elements": [ { "value": "15" }, { "value": "1" } ] },
    { "tag": "UNZ", "elements": [ { "value": "1" }, { "value": "1" } ] }
  ]
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

> **Note:** The HIPAA 837 subtype is detected via ST03 (`005010X222A1` = 837-Q1 Professional).

### EANCOM DESADV (Despatch Advice / Lieferavis)

```bash
node packages/cli/dist/index.js parse examples/cli/eancom/parse/input/desadv.edi
```

**Input:** [`eancom/parse/input/desadv.edi`](eancom/parse/input/desadv.edi)  
**Result:** [`eancom/parse/result/desadv.json`](eancom/parse/result/desadv.json)

> **Note:** EANCOM 2002 messages use EDIFACT D.02B syntax and are auto-mapped to the `@ediflow/eancom-2002` data package.

### Output Options

```bash
# YAML output
node packages/cli/dist/index.js parse examples/cli/edifact/parse/input/orders.edi -f yaml

# Explicit standard
node packages/cli/dist/index.js parse examples/cli/x12/parse/input/purchase-order-850.edi -s X12

# Business object output (requires data package)
node packages/cli/dist/index.js parse examples/cli/edifact/parse/input/orders.edi --output-type business-object

# Property names instead of codes (for business-object output)
node packages/cli/dist/index.js parse examples/cli/edifact/parse/input/orders.edi \
  --output-type business-object --property-parse-mode name

# Include empty values (default is to skip them)
node packages/cli/dist/index.js parse examples/cli/edifact/parse/input/orders.edi --skip-empty false
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

### EANCOM Validation

```bash
node packages/cli/dist/index.js validate examples/cli/eancom/validate/input/desadv.edi -f text
```

**Input:** [`eancom/validate/input/desadv.edi`](eancom/validate/input/desadv.edi)  
**Result:** [`eancom/validate/result/desadv.json`](eancom/validate/result/desadv.json)

**Expected text output:**
```
✓ Valid EDIFACT D.02B DESADV message
  - 0 errors
  - 0 warnings
```

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

### X12 Build

```bash
# Build to stdout
node packages/cli/dist/index.js build examples/cli/x12/build/input/purchase-order-850.json

# Build to file
node packages/cli/dist/index.js build examples/cli/x12/build/input/purchase-order-850.json \
  -o examples/cli/x12/build/result/purchase-order-850.edi
```

**Input:** [`x12/build/input/purchase-order-850.json`](x12/build/input/purchase-order-850.json)  
**Result:** [`x12/build/result/purchase-order-850.edi`](x12/build/result/purchase-order-850.edi)

### HIPAA Build

```bash
# Build to stdout
node packages/cli/dist/index.js build examples/cli/hipaa/build/input/claim-837.json

# Build to file
node packages/cli/dist/index.js build examples/cli/hipaa/build/input/claim-837.json \
  -o examples/cli/hipaa/build/result/claim-837.edi
```

**Input:** [`hipaa/build/input/claim-837.json`](hipaa/build/input/claim-837.json)  
**Result:** [`hipaa/build/result/claim-837.edi`](hipaa/build/result/claim-837.edi)

> **Note:** HIPAA 837 uses the X12 builder (`~` segment terminator).

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

### EANCOM Schemas

```bash
node packages/cli/dist/index.js export-schema -m DESADV -s EDIFACT -v D.02B
node packages/cli/dist/index.js export-schema -m ORDERS -s EDIFACT -v D.02B
node packages/cli/dist/index.js export-schema -m INVOIC -s EDIFACT -v D.02B -f yml
```

**Result:** [`eancom/export-schema/result/desadv-d02b.json`](eancom/export-schema/result/desadv-d02b.json)

**Available version:** `D.02B` (EANCOM 2002, 49 msgs)

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
| EANCOM | `@ediflow/eancom-2002` | D.02B (EANCOM2002) | 49 |

---

## More Resources

- [Quick Start Guide](../../docs/QUICK_START.md)
- [Architecture](../../docs/ARCHITECTURE.md)
- [X12 Examples (programmatic)](../x12/README.md)
- [EDIFACT Examples (programmatic)](../edifact/README.md)
- [HIPAA Examples (programmatic)](../hipaa/README.md)
