# 🚀 Quick Start Guide - EDIFlow

Get started with **EDIFlow** in 5 minutes! Learn how to work with **type-safe TypeScript objects** instead of raw EDIFACT segments.

> **💡 What makes EDIFlow different?**  
> Most libraries only parse EDIFACT to generic segments. EDIFlow maps directly to **type-safe TypeScript objects** and generates **JSON Schema** for validation!

---

## 📦 Installation

### Step 1: Install Core Library

```bash
npm install @ediflow/core
```

### Step 2: Install EDIFACT Standard(s)

```bash
# Community Packages (MIT License)
npm install @ediflow/edifact-d96a  # D.96A - 89 messages
npm install @ediflow/edifact-d01b  # D.01B - 155 messages  
npm install @ediflow/edifact-d20b  # D.20B - 178 messages
```

**💡 Tip:** Install only what you need. Each package is ~5-15 MB.

---

## 🎯 Killer Feature #1: Business Object Mapping

### Why This Matters

**Other Libraries:**
```typescript
// ❌ Generic segments - no type safety!
const bgm = message.segments.find(s => s.tag === 'BGM');
const docNumber = bgm?.elements[1]?.value;  // What is element[1]? 🤷
```

**EDIFlow:**
```typescript
// ✅ Type-safe TypeScript objects!
const order = mapper.mapToBusinessObject(message);
console.log(order.documentNumber);  // IntelliSense works! 🎉
console.log(order.parties.buyer.id);
console.log(order.lineItems[0].productId);
```

### Example: EDIFACT → TypeScript Object

```typescript
import { DIContainer, StructureMapper } from '@ediflow/core';

const container = DIContainer.getInstance();
const parseUseCase = container.resolve('ParseEDIUseCase');

const edifact = `UNB+UNOC:3+SENDER:14+RECEIVER:14+20260129:1200+1'
UNH+1+ORDERS:D:20B:UN'
BGM+220+PO12345+9'
DTM+137:20260129:102'
NAD+BY+BUYER123::92'
NAD+SU+SUPPLIER456::92'
LIN+1++PRODUCT001:SA'
QTY+21:100:PCE'
PRI+AAA:49.99:EUR'
UNT+9+1'
UNZ+1+1'`;

const result = parseUseCase.execute({
  message: edifact,
  standard: 'EDIFACT'
});

// Map to Business Object
const mapper = new StructureMapper();
const order = mapper.mapToBusinessObject(result.message);

// ✅ Work with type-safe objects!
console.log('📦 Order Details:');
console.log('  Order Number:', order.documentNumber);        // PO12345
console.log('  Order Date:', order.orderDate);               // 2026-01-29
console.log('  Buyer:', order.parties.buyer.id);            // BUYER123
console.log('  Supplier:', order.parties.supplier.id);      // SUPPLIER456

console.log('\n📋 Line Items:');
order.lineItems.forEach((item, idx) => {
  console.log(`  ${idx + 1}. ${item.productId}`);
  console.log(`     Quantity: ${item.quantity} ${item.quantityUnit}`);
  console.log(`     Price: ${item.price} ${item.currency}`);
});
```

**Output:**
```
📦 Order Details:
  Order Number: PO12345
  Order Date: 2026-01-29
  Buyer: BUYER123
  Supplier: SUPPLIER456

📋 Line Items:
  1. PRODUCT001
     Quantity: 100 PCE
     Price: 49.99 EUR
```

### Example: TypeScript Object → EDIFACT

```typescript
// Your business object (from database, API, etc.)
const order = {
  documentNumber: 'PO12345',
  documentType: '220',
  messageFunction: '9',
  orderDate: new Date('2026-01-29'),
  parties: {
    buyer: { id: 'BUYER123', qualifier: '92' },
    supplier: { id: 'SUPPLIER456', qualifier: '92' }
  },
  lineItems: [
    {
      lineNumber: 1,
      productId: 'PRODUCT001',
      productIdType: 'SA',
      quantity: 100,
      quantityUnit: 'PCE',
      price: 49.99,
      currency: 'EUR'
    }
  ]
};

// Map to EDI Message
const ediMessage = mapper.mapFromBusinessObject(order, {
  standard: 'EDIFACT',
  version: 'D20B',
  messageType: 'ORDERS'
});

// Build EDIFACT string
const buildUseCase = container.resolve('BuildEDIUseCase');
const edifactString = buildUseCase.execute({
  message: ediMessage,
  standard: 'EDIFACT',
  envelope: {
    sender: { id: 'MYCOMPANY', qualifier: '14' },
    receiver: { id: 'PARTNER', qualifier: '14' }
  }
});

console.log(edifactString);
```

### Complete Roundtrip

```typescript
// 1️⃣ Parse incoming EDIFACT
const parseResult = parseUseCase.execute({ message: incomingEDI, standard: 'EDIFACT' });

// 2️⃣ Map to Business Object
const order = mapper.mapToBusinessObject(parseResult.message);

// 3️⃣ Modify with type safety! ✨
order.lineItems[0].quantity = 150;
order.lineItems.push({
  lineNumber: 2,
  productId: 'PRODUCT002',
  quantity: 50,
  price: 29.99
});

// 4️⃣ Map back and send
const modified = mapper.mapFromBusinessObject(order, {...});
const outgoing = buildUseCase.execute({ message: modified, ...});
await sendToPartner(outgoing);
```

---

## 🎯 Killer Feature #2: Schema Export

### Generate JSON Schema

```typescript
const exportSchemaUseCase = container.resolve('ExportSchemaUseCase');

const schema = exportSchemaUseCase.execute({
  standard: 'EDIFACT',
  version: 'D20B',
  messageType: 'ORDERS',
  format: 'json-schema'
});

writeFileSync('./schemas/orders.schema.json', JSON.stringify(schema, null, 2));
```

**Generated JSON Schema:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ORDERS - Purchase Order Message",
  "type": "object",
  "required": ["documentNumber", "parties"],
  "properties": {
    "documentNumber": {
      "type": "string",
      "maxLength": 35
    },
    "documentType": {
      "type": "string",
      "enum": ["220", "221", "224"]
    },
    "parties": {
      "type": "object",
      "required": ["buyer"],
      "properties": {
        "buyer": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "qualifier": { "type": "string" }
          }
        }
      }
    },
    "lineItems": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "productId": { "type": "string" },
          "quantity": { "type": "number" },
          "price": { "type": "number" }
        }
      }
    }
  }
}
```

### Generate TypeScript Types

```typescript
const tsSchema = exportSchemaUseCase.execute({
  standard: 'EDIFACT',
  version: 'D20B',
  messageType: 'ORDERS',
  format: 'typescript'
});

writeFileSync('./types/orders.d.ts', tsSchema);
```

**Generated TypeScript:**
```typescript
export interface OrdersMessage {
  documentNumber: string;
  documentType?: '220' | '221' | '224';
  orderDate?: Date;
  parties: {
    buyer: {
      id: string;
      qualifier?: string;
    };
    supplier?: {
      id: string;
    };
  };
  lineItems?: Array<{
    lineNumber: number;
    productId: string;
    quantity: number;
    price?: number;
    currency?: string;
  }>;
}
```

### Validate with Ajv

```typescript
import Ajv from 'ajv';
import ordersSchema from './schemas/orders.schema.json';

const ajv = new Ajv();
const validate = ajv.compile(ordersSchema);

if (!validate(order)) {
  console.error('❌ Validation failed:', validate.errors);
  return;
}

await sendToPartner(buildEDI(order));
```

---

## 🔧 Basic Usage

### Parse

```typescript
const parseUseCase = container.resolve('ParseEDIUseCase');
const result = parseUseCase.execute({ message: edifact, standard: 'EDIFACT' });
```

### Validate

```typescript
const validateUseCase = container.resolve('ValidateMessageUseCase');
const validation = validateUseCase.execute({
  message: result.message,
  enableStructuralValidation: true
});
```

### Build

```typescript
const buildUseCase = container.resolve('BuildEDIUseCase');
const edifact = buildUseCase.execute({
  message: ediMessage,
  envelope: { sender: {...}, receiver: {...} }
});
```

---

## 💡 Key Takeaways

**EDIFlow is different because:**

1. 🎯 **Type-Safe Business Objects** - Work with TypeScript, not segments
2. 📋 **Schema Export** - Generate JSON Schema & TypeScript types
3. 🔄 **Roundtrip** - Parse → Modify → Build with type safety
4. ✅ **Validation** - Validate with Ajv before sending
5. 🧪 **Testable** - Easy to mock business objects

**Other libraries force you to work with raw segments. EDIFlow lets you work with real business objects!**

---

## 📚 Next Steps

- [Architecture Guide](ARCHITECTURE.md)
- [Developer Guide](DEVELOPER_GUIDE.md)
- [API Reference](API.md)

---

## 🤝 Need Help?

- [GitHub Issues](https://github.com/ediflow/ediflow/issues)
- [Discussions](https://github.com/ediflow/ediflow/discussions)
- Email: hello.ediflow@gmail.com

---

**Ready for more?** Check out the [Architecture Guide](ARCHITECTURE.md)! 🚀
