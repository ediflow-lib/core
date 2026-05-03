# EDIFlow CLI Examples

> **Runnable examples for all CLI commands and EDI formats.**  
> Clone this repo and run any example from the repository root.

## 🚀 Prerequisites

```bash
# Clone the repository
git clone https://github.com/ediflow-lib/core.git
cd core

# Install dependencies
npm install

# Build the CLI
cd packages/cli && npm run build && cd ../..
```

All examples below assume you run them **from the repository root**.

---

## 📖 Table of Contents

1. [Parse Command](#1-parse-command)
   - [EDIFACT ORDERS](#11-edifact-orders)
   - [X12 850 Purchase Order](#12-x12-850-purchase-order)
   - [HIPAA 837 Healthcare Claim](#13-hipaa-837-healthcare-claim)
   - [Output Options](#14-output-options)
2. [Validate Command](#2-validate-command)
   - [EDIFACT Validation](#21-edifact-validation)
   - [X12 Validation](#22-x12-validation)
   - [Output Formats (text, table, json)](#23-output-formats)
3. [Build Command](#3-build-command)
   - [EDIFACT Build](#31-edifact-build)
   - [Build to File](#32-build-to-file)
4. [Export Schema Command](#4-export-schema-command)
   - [EDIFACT Schemas](#41-edifact-schemas)
   - [X12 Schemas](#42-x12-schemas)
   - [HIPAA & EANCOM Schemas](#43-hipaa--eancom-schemas)
   - [Export All & YAML](#44-export-all--yaml)
5. [Roundtrip Examples](#5-roundtrip-examples)
6. [Error Handling](#6-error-handling)
7. [Scripting & Automation](#7-scripting--automation)

---

## 1. Parse Command

Parse EDI files into structured JSON or YAML.

```
ediflow parse <file> [options]

Options:
  -s, --standard <standard>              EDI standard: EDIFACT | X12 (auto-detected)
  -f, --format <format>                  Output format: json | yaml (default: json)
  -o, --output <file>                    Save output to file
  --property-parse-mode <mode>           Property mode: code | name (default: code)
  --codelist-value-parse-mode <mode>     CodeList mode: code | name (default: code)
```

### 1.1 EDIFACT ORDERS

**Sample file:** [`examples/cli/edifact-orders/orders.edi`](edifact-orders/orders.edi)

```bash
# Auto-detect standard (EDIFACT detected from UNB header)
node packages/cli/dist/index.js parse examples/cli/edifact-orders/orders.edi
```

<details>
<summary>📋 Expected Output (click to expand)</summary>

```json
{
  "metadata": {
    "standard": "EDIFACT",
    "version": "D.96A",
    "messageType": "ORDERS",
    "segmentCount": 18,
    "delimiters": {
      "segment": "'",
      "element": "+",
      "component": ":"
    }
  },
  "segments": [
    { "tag": "UNB", "elements": [{ "value": "UNOC", "components": ["UNOC", "3"] }, ...] },
    { "tag": "UNH", "elements": [{ "value": "1" }, { "value": "ORDERS", "components": ["ORDERS", "D", "96A", "UN"] }] },
    { "tag": "BGM", "elements": [{ "value": "220" }, { "value": "PO-2026-001" }, { "value": "9" }] },
    ...
  ]
}
```
</details>

```bash
# Explicit standard
node packages/cli/dist/index.js parse examples/cli/edifact-orders/orders.edi -s EDIFACT

# YAML output
node packages/cli/dist/index.js parse examples/cli/edifact-orders/orders.edi -f yaml

# Save to file
node packages/cli/dist/index.js parse examples/cli/edifact-orders/orders.edi -o examples/cli/edifact-orders/orders-parsed.json
```

### 1.2 X12 850 Purchase Order

**Sample file:** [`examples/cli/x12-850/purchase-order.edi`](x12-850/purchase-order.edi)

```bash
# Auto-detect standard (X12 detected from ISA header)
node packages/cli/dist/index.js parse examples/cli/x12-850/purchase-order.edi
```

<details>
<summary>📋 Expected Output (click to expand)</summary>

```json
{
  "metadata": {
    "standard": "X12",
    "version": "005010",
    "messageType": "850",
    "segmentCount": 12,
    "delimiters": {
      "segment": "~",
      "element": "*",
      "component": ">"
    }
  },
  "segments": [
    { "tag": "ST", "elements": [{ "value": "850" }, { "value": "0001" }] },
    { "tag": "BEG", "elements": [{ "value": "00" }, { "value": "SA" }, { "value": "PO123456" }, { "value": "" }, { "value": "20260204" }] },
    { "tag": "REF", "elements": [{ "value": "DP" }, { "value": "DEPT001" }] },
    { "tag": "DTM", "elements": [{ "value": "002" }, { "value": "20260210" }] },
    { "tag": "N1", "elements": [{ "value": "BY" }, { "value": "ACME Corporation" }, { "value": "92" }, { "value": "BUYER123" }] },
    ...
  ]
}
```
</details>

```bash
# YAML output to file
node packages/cli/dist/index.js parse examples/cli/x12-850/purchase-order.edi -f yaml -o examples/cli/x12-850/parsed.yaml
```

### 1.3 HIPAA 837 Healthcare Claim

**Sample file:** [`examples/cli/hipaa-837/claim.edi`](hipaa-837/claim.edi)

```bash
node packages/cli/dist/index.js parse examples/cli/hipaa-837/claim.edi
```

<details>
<summary>📋 Expected Output (click to expand)</summary>

```json
{
  "metadata": {
    "standard": "X12",
    "version": "005010",
    "messageType": "837",
    "segmentCount": 17,
    "delimiters": {
      "segment": "~",
      "element": "*",
      "component": ":"
    }
  },
  "segments": [
    { "tag": "ST", "elements": [{ "value": "837" }, { "value": "0001" }, { "value": "005010X222A1" }] },
    { "tag": "BHT", "elements": [{ "value": "0019" }, { "value": "00" }, { "value": "CLAIM001" }, { "value": "20260301" }, { "value": "1200" }, { "value": "CH" }] },
    ...
  ]
}
```
</details>

### 1.4 Output Options

```bash
# Property names instead of codes
node packages/cli/dist/index.js parse examples/cli/edifact-orders/orders.edi --property-parse-mode name

# CodeList names instead of codes
node packages/cli/dist/index.js parse examples/cli/edifact-orders/orders.edi --codelist-value-parse-mode name

# Combine all options
node packages/cli/dist/index.js parse examples/cli/edifact-orders/orders.edi \
  -s EDIFACT -f yaml -o output.yaml \
  --property-parse-mode name \
  --codelist-value-parse-mode name
```

---

## 2. Validate Command

Validate EDI messages for structural correctness.

```
ediflow validate <file> [options]

Options:
  -s, --standard <standard>    EDI standard: EDIFACT | X12 (auto-detected)
  -f, --format <format>        Output format: json | text | table (default: json)
  -o, --output <file>          Save output to file
  --strict                     Enable strict validation mode
```

### 2.1 EDIFACT Validation

```bash
# Validate EDIFACT ORDERS
node packages/cli/dist/index.js validate examples/cli/edifact-orders/orders.edi

# Human-readable text output
node packages/cli/dist/index.js validate examples/cli/edifact-orders/orders.edi -f text
```

**Expected Output (text):**
```
✓ Valid EDIFACT D.96A ORDERS message
  - 0 errors
  - 0 warnings
```

### 2.2 X12 Validation

```bash
# Validate X12 850
node packages/cli/dist/index.js validate examples/cli/x12-850/purchase-order.edi -f text
```

**Expected Output:**
```
✓ Valid X12 005010 850 message
  - 0 errors
  - 0 warnings
```

```bash
# Strict validation mode
node packages/cli/dist/index.js validate examples/cli/x12-850/purchase-order.edi --strict -f text

# Validate HIPAA 837
node packages/cli/dist/index.js validate examples/cli/hipaa-837/claim.edi -f text
```

### 2.3 Output Formats

```bash
# JSON (default) — machine-readable
node packages/cli/dist/index.js validate examples/cli/edifact-orders/orders.edi -f json

# Text — human-readable summary
node packages/cli/dist/index.js validate examples/cli/edifact-orders/orders.edi -f text

# Table — error details in tabular format
node packages/cli/dist/index.js validate examples/cli/edifact-orders/orders.edi -f table

# Save validation report
node packages/cli/dist/index.js validate examples/cli/x12-850/purchase-order.edi -o examples/cli/x12-850/validation-result.json
```

---

## 3. Build Command

Build EDI strings from JSON message definitions.

```
ediflow build <file> [options]

Options:
  -s, --standard <standard>    EDI standard: EDIFACT | X12 (from JSON if omitted)
  -o, --output <file>          Save output to .edi file
```

> **Note:** Currently supported for EDIFACT. X12 builder coming soon.

### 3.1 EDIFACT Build

**Sample file:** [`examples/cli/edifact-orders/orders.json`](edifact-orders/orders.json)

```bash
# Build EDIFACT from JSON → stdout
node packages/cli/dist/index.js build examples/cli/edifact-orders/orders.json
```

**Expected Output:**
```
UNB+UNOC:3+ACMECORP:14+SUPPLIER:14+260204:1200+1'UNH+1+ORDERS:D:96A:UN'BGM+220+PO-2026-001+9'DTM+137:20260204:102'...UNZ+1+1'
```

### 3.2 Build to File

```bash
# Build and save to .edi file
node packages/cli/dist/index.js build examples/cli/edifact-orders/orders.json -o examples/cli/edifact-orders/orders-built.edi

# Explicit standard
node packages/cli/dist/index.js build examples/cli/edifact-orders/orders.json -s EDIFACT -o output.edi
```

---

## 4. Export Schema Command

Export JSON Schema (Draft-07) for any EDI message type. Compatible with OpenAPI and Zod.

```
ediflow export-schema [options]

Options:
  -m, --message <type>         Message type (e.g. 850, ORDERS)
  -s, --standard <standard>    EDI standard (default: EDIFACT)
  -v, --version <version>      Standard version (default: D.20B)
  -f, --format <format>        Output format: json | yml (default: json)
  --all                        Export all message types for this standard/version
```

### 4.1 EDIFACT Schemas

```bash
# ORDERS schema (D.20B)
node packages/cli/dist/index.js export-schema -m ORDERS -s EDIFACT -v D.20B

# INVOIC schema (D.96A)
node packages/cli/dist/index.js export-schema -m INVOIC -s EDIFACT -v D.96A

# DESADV schema (D.20B) as YAML
node packages/cli/dist/index.js export-schema -m DESADV -s EDIFACT -v D.20B -f yml

# ORDERS schema (D.01B)
node packages/cli/dist/index.js export-schema -m ORDERS -s EDIFACT -v D.01B

# ORDERS schema (D.12A)
node packages/cli/dist/index.js export-schema -m ORDERS -s EDIFACT -v D.12A
```

**Available EDIFACT versions:** `D.96A` (126 msgs), `D.01B`, `D.12A`, `D.20B` (195 msgs)

### 4.2 X12 Schemas

```bash
# 850 Purchase Order (004010)
node packages/cli/dist/index.js export-schema -m 850 -s X12 -v 004010

# 810 Invoice (006040)
node packages/cli/dist/index.js export-schema -m 810 -s X12 -v 006040

# 856 Ship Notice (004010)
node packages/cli/dist/index.js export-schema -m 856 -s X12 -v 004010

# 997 Functional Acknowledgment (004010)
node packages/cli/dist/index.js export-schema -m 997 -s X12 -v 004010
```

**Available X12 versions:** `004010` (293 msgs), `006040` (319 msgs)

### 4.3 HIPAA & EANCOM Schemas

> **Note:** HIPAA (`hipaa-x12-005010`) and EANCOM (`eancom-2002`) use non-standard package naming.  
> Schema export via CLI currently works for packages matching the `{standard}-{version}` pattern:  
> `edifact-d20b`, `x12-004010`, `x12-006040`, etc.  
> HIPAA and EANCOM schemas can be accessed programmatically — see [examples/hipaa/](../hipaa/) and the `@ediflow/eancom-2002` package.

### 4.4 Export All & YAML

```bash
# Export ALL EDIFACT D.20B schemas (195 messages)
node packages/cli/dist/index.js export-schema -s EDIFACT -v D.20B --all

# Export ALL X12 004010 schemas (293 messages)
node packages/cli/dist/index.js export-schema -s X12 -v 004010 --all

# Export ALL X12 006040 schemas (319 messages)
node packages/cli/dist/index.js export-schema -s X12 -v 006040 --all

# YAML format
node packages/cli/dist/index.js export-schema -m 850 -s X12 -v 004010 -f yml
```

---

## 5. Roundtrip Examples

Parse an EDI file, then build it back and verify the result.

### EDIFACT Roundtrip

```bash
# 1. Parse original EDI → JSON
node packages/cli/dist/index.js parse examples/cli/edifact-orders/orders.edi -o /tmp/orders-parsed.json

# 2. Build JSON → EDI
node packages/cli/dist/index.js build /tmp/orders-parsed.json -o /tmp/orders-rebuilt.edi

# 3. Parse rebuilt EDI → JSON (verify)
node packages/cli/dist/index.js parse /tmp/orders-rebuilt.edi -o /tmp/orders-verify.json

# 4. Validate rebuilt message
node packages/cli/dist/index.js validate /tmp/orders-rebuilt.edi -f text
# ✓ Valid EDIFACT D.96A ORDERS message
```

---

## 6. Error Handling

### File Not Found

```bash
node packages/cli/dist/index.js parse nonexistent.edi
# ✗ Error: File not found: nonexistent.edi
```

### Unknown Standard

```bash
node packages/cli/dist/index.js parse examples/cli/errors/random.txt
# ✗ Error: Unable to detect EDI standard. Please specify with --standard flag.
```

### Invalid Message

```bash
node packages/cli/dist/index.js validate examples/cli/errors/invalid.edi -f text
# ✗ Invalid EDIFACT message
# Errors:
#   1. [MISSING_SEGMENT] Required segment missing
```

---

## 7. Scripting & Automation

### Use with jq (JSON processor)

```bash
# Extract all segment tags
node packages/cli/dist/index.js parse examples/cli/x12-850/purchase-order.edi | jq '[.segments[].tag]'
# ["ST","BEG","REF","DTM","N1","N3","N4","N1","PO1","PO1","CTT","SE"]

# Extract buyer info from N1 segment
node packages/cli/dist/index.js parse examples/cli/x12-850/purchase-order.edi | jq '.segments[] | select(.tag == "N1") | .elements[1].value'
# "ACME Corporation"
# "Best Supplier Inc"

# Count segments
node packages/cli/dist/index.js parse examples/cli/edifact-orders/orders.edi | jq '.metadata.segmentCount'
# 18
```

### Exit Code for CI/CD

```bash
# Use in CI pipeline — exit code 0 = valid, 1 = invalid
node packages/cli/dist/index.js validate examples/cli/x12-850/purchase-order.edi && echo "✅ VALID" || echo "❌ INVALID"
```

### Batch Processing

```bash
# Validate all .edi files in a directory
for f in examples/cli/*/*.edi; do
  echo "--- $f ---"
  node packages/cli/dist/index.js validate "$f" -f text 2>&1
done
```

### Schema Generation for API Projects

```bash
# Generate JSON Schema for OpenAPI integration
node packages/cli/dist/index.js export-schema -m 850 -s X12 -v 004010 > schemas/x12-850.json
node packages/cli/dist/index.js export-schema -m ORDERS -s EDIFACT -v D.20B > schemas/edifact-orders.json
```

---

## 📁 Sample Files

| File | Format | Description |
|------|--------|-------------|
| [`edifact-orders/orders.edi`](edifact-orders/orders.edi) | EDIFACT | Purchase Order (D.96A) |
| [`edifact-orders/orders.json`](edifact-orders/orders.json) | JSON | Purchase Order (for build) |
| [`x12-850/purchase-order.edi`](x12-850/purchase-order.edi) | X12 | 850 Purchase Order (005010) |
| [`x12-850/purchase-order.json`](x12-850/purchase-order.json) | JSON | 850 Purchase Order (for build) |
| [`hipaa-837/claim.edi`](hipaa-837/claim.edi) | HIPAA/X12 | 837P Healthcare Claim (005010) |
| [`errors/invalid.edi`](errors/invalid.edi) | Invalid | Malformed EDI (for error testing) |
| [`errors/random.txt`](errors/random.txt) | Unknown | Non-EDI content (for detection test) |

---

## 📊 Supported Standards & Versions

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

## 📚 More Resources

- [Quick Start Guide](../../docs/QUICK_START.md)
- [Architecture](../../docs/ARCHITECTURE.md)
- [X12 Examples (programmatic)](../x12/README.md)
- [EDIFACT Examples (programmatic)](../edifact/README.md)
- [HIPAA Examples (programmatic)](../hipaa/README.md)

