# Integration Test Fixtures

This directory contains **real EDIFACT samples** for integration testing.

## 📁 Directory Structure

```
fixtures/
├── edifact/
│   ├── happy-path/          ✅ Valid messages
│   ├── negative/            ❌ Invalid messages (for error testing)
│   └── performance/         ⚡ Large messages (for performance testing)
└── x12/                     🔜 Future
```

## ✅ Happy Path Fixtures (Valid Messages)

### `orders-valid-d96a.edi`
- **Standard:** EDIFACT
- **Version:** D.96A
- **Message Type:** ORDERS (Purchase Order)
- **Segments:** 11
- **Purpose:** Test basic parsing, validation, and building

**Structure:**
```
UNB - Interchange Header
UNH - Message Header (ORDERS D.96A)
BGM - Beginning of Message
DTM - Date/Time
NAD - Name and Address (Buyer)
NAD - Name and Address (Supplier)
LIN - Line Item
QTY - Quantity
PRI - Price
UNT - Message Trailer
UNZ - Interchange Trailer
```

### `invoic-valid-d01b.edi`
- **Standard:** EDIFACT
- **Version:** D.01B
- **Message Type:** INVOIC (Invoice)
- **Segments:** 13
- **Purpose:** Test different version and message type

### `desadv-valid-d96a.edi`
- **Standard:** EDIFACT
- **Version:** D.96A
- **Message Type:** DESADV (Despatch Advice)
- **Segments:** 11
- **Purpose:** Test dispatch advice messages

---

## ❌ Negative Fixtures (Invalid Messages)

### `missing-unh.edi`
- **Error:** Missing mandatory UNH segment
- **Purpose:** Test error handling for missing message header
- **Expected:** Parse should fail with "Missing UNH" error

### `missing-unb.edi`
- **Error:** Missing UNB interchange header
- **Purpose:** Test validation rule: UNB must be first
- **Expected:** Validation should fail

### `invalid-segment-order.edi`
- **Error:** UNZ (trailer) before UNT (should be last)
- **Purpose:** Test segment order validation
- **Expected:** Validation should fail with "Invalid segment order"

---

## ⚡ Performance Fixtures

### (To be generated in tests)
- **1000 segments:** Test parsing/validation/building speed
- **5000 segments:** Stress testing

---

## 🔧 Usage in Tests

```typescript
import { readFileSync } from 'fs';
import { join } from 'path';

// Helper function
function loadFixture(filename: string): string {
  const fixturePath = join(__dirname, '../fixtures/edifact/happy-path', filename);
  return readFileSync(fixturePath, 'utf-8');
}

// In tests
describe('Integration Test', () => {
  it('should parse valid ORDERS', () => {
    const edi = loadFixture('orders-valid-d96a.edi');
    const result = parseMessage(edi);
    
    expect(result.messageType.value).toBe('ORDERS');
  });
});
```

---

## 📝 Notes

- **Real-world samples:** These are simplified but follow EDIFACT standards
- **No sensitive data:** All identifiers are dummy values
- **Line breaks:** Removed for compact storage (real EDIFACT has no line breaks)
- **Segment terminator:** Single quote (') as per EDIFACT standard

---

## 🔍 Validation

All happy-path fixtures should:
- ✅ Parse successfully
- ✅ Pass validation with EDIFACT rules
- ✅ Build back to equivalent EDI string
- ✅ Maintain data integrity in roundtrip

All negative fixtures should:
- ❌ Fail parsing OR validation
- ✅ Produce clear error messages
- ✅ Not crash the application

---

**Maintained by:** Integration Test Suite  
**Last Updated:** 24.01.2026
