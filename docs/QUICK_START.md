# Quick Start Guide - EDIFlow

Get started with EDIFlow in **5 minutes**! This guide shows you how to parse, validate, and build EDIFACT messages.

---

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **TypeScript** >= 5.3.0 (optional, but recommended)
- Basic knowledge of EDIFACT (helpful, but not required)

---

## 🚀 Installation

### Step 1: Install Core Library

```bash
npm install @ediflow/core
```

### Step 2: Install EDIFACT Standard(s)

Choose the EDIFACT version you need:

```bash
# Latest standard (recommended for new projects)
npm install @ediflow/edifact-d20b

# OR: Full coverage (196 message types)
npm install @ediflow/edifact-d12a

# OR: Legacy systems
npm install @ediflow/edifact-d01b
npm install @ediflow/edifact-d96a
```

**💡 Tip:** Most projects need only **core + one standard**. You can always add more later!

---

## 📖 Example: Parse an EDIFACT Message

### Sample EDIFACT Message

Let's parse a simple ORDERS (Purchase Order) message:

```edifact
UNB+UNOC:3+SENDER:14+RECEIVER:14+20260129:1200+1234567'
UNH+1+ORDERS:D:20B:UN'
BGM+220+PO12345+9'
DTM+137:20260129:102'
NAD+BY+BUYER123::92'
NAD+SU+SUPPLIER456::92'
LIN+1++PRODUCT001:SA'
QTY+21:100'
UNT+8+1'
UNZ+1+1234567'
```

### TypeScript Code

```typescript
import { DIContainer } from '@ediflow/core';

// Get DIContainer instance
const container = DIContainer.getInstance();

// Resolve ParseEDIUseCase
const parseUseCase = container.resolve('ParseEDIUseCase');

// Your EDIFACT message
const edifactString = `UNB+UNOC:3+SENDER:14+RECEIVER:14+20260129:1200+1234567'
UNH+1+ORDERS:D:20B:UN'
BGM+220+PO12345+9'
DTM+137:20260129:102'
NAD+BY+BUYER123::92'
NAD+SU+SUPPLIER456::92'
LIN+1++PRODUCT001:SA'
QTY+21:100'
UNT+8+1'
UNZ+1+1234567'`;

// Parse the message
const result = parseUseCase.execute({
  message: edifactString,
  standard: 'EDIFACT'
});

// Check result
if (result.success) {
  console.log('✅ Parsing successful!');
  console.log('Message Type:', result.message.header?.tag); // UNH
  console.log('Segments:', result.message.segments.length);
  
  // Access specific segments
  const bgm = result.message.segments.find(s => s.tag === 'BGM');
  console.log('Document Number:', bgm?.elements[1]?.value); // PO12345
} else {
  console.error('❌ Parsing failed:', result.errors);
}
```

**Expected Output:**
```
✅ Parsing successful!
Message Type: UNH
Segments: 6
Document Number: PO12345
```

---

## ✅ Example: Validate a Message

Validation ensures your message follows EDIFACT structure rules:

```typescript
import { DIContainer } from '@ediflow/core';

const container = DIContainer.getInstance();
const validateUseCase = container.resolve('ValidateMessageUseCase');

// Validate the parsed message
const validation = validateUseCase.execute({
  message: result.message,
  messageType: 'ORDERS',
  version: 'D20B',
  repositoryPath: './node_modules/@ediflow/edifact-d20b/data'
});

if (validation.success) {
  console.log('✅ Message is valid!');
  console.log('Validated against:', validation.messageStructure?.name);
} else {
  console.log('❌ Validation errors:');
  validation.errors?.forEach(error => {
    console.log(`  - ${error.message} (at ${error.path})`);
  });
}
```

**What gets validated:**
- ✅ **Syntax** - Correct EDIFACT syntax (delimiters, escaping)
- ✅ **Structure** - Required segments, correct order, cardinality
- ✅ **Business Rules** - Data element formats, code lists

---

## 🔨 Example: Build an EDIFACT Message

Create EDIFACT messages programmatically:

```typescript
import { DIContainer, EDIMessage, EDISegment, EDIElement } from '@ediflow/core';

const container = DIContainer.getInstance();
const buildUseCase = container.resolve('BuildEDIUseCase');

// Create message structure
const message = new EDIMessage({
  standard: 'EDIFACT',
  version: 'D20B',
  messageType: 'ORDERS',
  segments: [
    new EDISegment({
      tag: 'BGM',
      elements: [
        new EDIElement({ value: '220' }),        // Document type: Order
        new EDIElement({ value: 'PO12345' }),    // Document number
        new EDIElement({ value: '9' })           // Message function: Original
      ]
    }),
    new EDISegment({
      tag: 'DTM',
      elements: [
        new EDIElement({
          components: [
            { value: '137' },              // Date/time qualifier: Document date
            { value: '20260129' },         // Date
            { value: '102' }               // Format: CCYYMMDD
          ]
        })
      ]
    }),
    new EDISegment({
      tag: 'NAD',
      elements: [
        new EDIElement({ value: 'BY' }),   // Party qualifier: Buyer
        new EDIElement({
          components: [
            { value: 'BUYER123' },         // Party ID
            { value: '' },
            { value: '92' }                // Code list: Assigned by buyer
          ]
        })
      ]
    })
  ]
});

// Build EDIFACT string
const ediString = buildUseCase.execute({
  message,
  standard: 'EDIFACT'
});

console.log('📄 Generated EDIFACT:');
console.log(ediString);
```

**Expected Output:**
```edifact
BGM+220+PO12345+9'
DTM+137:20260129:102'
NAD+BY+BUYER123::92'
```

---

## 🔒 Example: Build with Envelopes

Add UNH/UNT/UNB/UNZ headers and trailers automatically:

```typescript
const buildUseCase = container.resolve('BuildEDIUseCase');

const ediString = buildUseCase.execute({
  message,
  standard: 'EDIFACT',
  envelope: {
    sender: {
      id: 'SENDER123',
      qualifier: '14'
    },
    receiver: {
      id: 'RECEIVER456',
      qualifier: '14'
    },
    messageType: 'ORDERS',
    version: 'D20B',
    controlRef: '1234567',
    messageRef: '1'
  }
});

console.log(ediString);
```

**Expected Output:**
```edifact
UNB+UNOC:3+SENDER123:14+RECEIVER456:14+20260129:1200+1234567'
UNH+1+ORDERS:D:20B:UN'
BGM+220+PO12345+9'
DTM+137:20260129:102'
NAD+BY+BUYER123::92'
UNT+5+1'
UNZ+1+1234567'
```

---

## 🎯 Common Use Cases

### Use Case 1: Parse Incoming EDI

```typescript
// Receive EDIFACT from partner
const incomingEDI = receiveFromPartner();

// Parse
const parseResult = parseUseCase.execute({
  message: incomingEDI,
  standard: 'EDIFACT'
});

// Validate
const validation = validateUseCase.execute({
  message: parseResult.message,
  messageType: 'ORDERS',
  version: 'D20B',
  repositoryPath: './node_modules/@ediflow/edifact-d20b/data'
});

if (validation.success) {
  // Process order
  processOrder(parseResult.message);
}
```

### Use Case 2: Generate EDI Response

```typescript
// Build ORDRSP (Order Response)
const response = new EDIMessage({
  standard: 'EDIFACT',
  messageType: 'ORDRSP',
  segments: [
    // ... your segments
  ]
});

// Build with envelope
const responseEDI = buildUseCase.execute({
  message: response,
  standard: 'EDIFACT',
  envelope: {
    sender: { id: 'MYCOMPANY', qualifier: '14' },
    receiver: { id: 'PARTNER', qualifier: '14' }
  }
});

// Send to partner
sendToPartner(responseEDI);
```

### Use Case 3: Transform EDI to JSON

```typescript
// Parse EDIFACT
const parsed = parseUseCase.execute({
  message: edifactString,
  standard: 'EDIFACT'
});

// Convert to JSON
const json = JSON.stringify(parsed.message, null, 2);

// Store in database or API
await saveToDatabase(json);
```

---

## 🗂️ Working with Multiple Standards

Install and use multiple EDIFACT versions:

```bash
npm install @ediflow/edifact-d96a
npm install @ediflow/edifact-d20b
npm install @ediflow/edifact-d12a
```

```typescript
import { FileBasedMessageStructureRepository } from '@ediflow/core/infrastructure';

// Load different versions dynamically
const repositories = {
  D96A: new FileBasedMessageStructureRepository(
    './node_modules/@ediflow/edifact-d96a/data'
  ),
  D20B: new FileBasedMessageStructureRepository(
    './node_modules/@ediflow/edifact-d20b/data'
  ),
  D12A: new FileBasedMessageStructureRepository(
    './node_modules/@ediflow/edifact-d12a/data'
  )
};

// Use based on incoming message version
const version = detectVersion(edifactString); // D96A, D20B, etc.
const repo = repositories[version];
```

---

## 🧪 Testing Your Integration

```typescript
import { describe, it, expect } from 'vitest';

describe('EDIFACT Integration', () => {
  it('should parse ORDERS message', () => {
    const result = parseUseCase.execute({
      message: sampleEDIFACT,
      standard: 'EDIFACT'
    });
    
    expect(result.success).toBe(true);
    expect(result.message.segments).toHaveLength(6);
  });
  
  it('should validate ORDERS structure', () => {
    const validation = validateUseCase.execute({
      message: parsedMessage,
      messageType: 'ORDERS',
      version: 'D20B',
      repositoryPath: './node_modules/@ediflow/edifact-d20b/data'
    });
    
    expect(validation.success).toBe(true);
  });
});
```

---

## 📚 Next Steps

Now that you know the basics, explore more:

1. **[Architecture Guide](ARCHITECTURE.md)** - Understand Clean Architecture
2. **[Developer Guide](DEVELOPER_GUIDE.md)** - Contributing and development
3. **[API Reference](API.md)** - Complete API documentation
4. **[Package READMEs](../packages/)** - Detailed package documentation

---

## 🆘 Troubleshooting

### Problem: "Cannot find module '@ediflow/core'"

**Solution:** Make sure you installed the package:
```bash
npm install @ediflow/core
```

### Problem: "Repository path not found"

**Solution:** Ensure you installed the EDIFACT standard package:
```bash
npm install @ediflow/edifact-d20b
```

And use the correct path:
```typescript
repositoryPath: './node_modules/@ediflow/edifact-d20b/data'
```

### Problem: "Parsing failed with syntax error"

**Solution:** Check your EDIFACT syntax:
- Segments end with `'` (segment delimiter)
- Elements separated by `+` (element delimiter)
- Components separated by `:` (component delimiter)
- UNA segment defines delimiters (if present)

### Problem: "Validation errors"

**Solution:** 
1. Check message type matches structure (ORDERS, INVOIC, etc.)
2. Verify EDIFACT version (D96A, D01B, D20B, D12A)
3. Ensure required segments are present
4. Check segment order

---

## 💡 Tips & Best Practices

✅ **Cache repositories** - Load once, reuse multiple times  
✅ **Use TypeScript** - Full type safety and IntelliSense  
✅ **Validate early** - Catch errors before processing  
✅ **Test with real data** - Use actual partner messages  
✅ **Log parsing errors** - Debug issues faster  
✅ **Handle envelopes** - Always include UNH/UNT/UNB/UNZ  

---

## 🤝 Need Help?

- **GitHub Issues:** [Report bugs](https://github.com/ediflow-lib/ediflow/issues)
- **Discussions:** [Ask questions](https://github.com/ediflow-lib/ediflow/discussions)
- **Email:** hello.ediflow@gmail.com

---

**Ready to dive deeper?** Check out the [Developer Guide](DEVELOPER_GUIDE.md) next! 🚀
