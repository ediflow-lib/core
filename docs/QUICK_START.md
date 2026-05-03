# 🚀 Quick Start Guide - EDIFlow

Get started with **EDIFlow** in 5 minutes! Learn how to parse **EDIFACT** and **X12** messages with type-safe TypeScript objects.

> **💡 What makes EDIFlow different?**  
> Most libraries only parse EDI to generic segments. EDIFlow maps directly to **type-safe TypeScript objects** and generates **JSON Schema** for validation!

---

## 📦 Installation

### EDIFACT Stack

```bash
# Core + EDIFACT parser + shared infrastructure
npm install @ediflow/core @ediflow/edifact @ediflow/infrastructure-shared

# Data package(s) - install the versions you need
npm install @ediflow/edifact-d96a  # D.96A - 89 messages
npm install @ediflow/edifact-d01b  # D.01B - 155 messages  
npm install @ediflow/edifact-d20b  # D.20B - 178 messages (latest)
npm install @ediflow/edifact-d12a  # D.12A - 196 messages (most complete)
```

### X12 Stack (USA / Healthcare / Retail)

```bash
# Core + X12 parser + shared infrastructure
npm install @ediflow/core @ediflow/x12 @ediflow/infrastructure-shared

# Data package(s) - install the versions you need
npm install @ediflow/x12-004010    # X12 version 004010
```

### CLI (Optional)

```bash
npm install --global @ediflow/cli
```

**💡 Tip:** Install only what you need. Each data package is ~5-15 MB.

---

## 📦 Package Overview (v0.3.0)

**Core Packages** (required):
- `@ediflow/core` - Domain entities, use cases, interfaces
- `@ediflow/infrastructure-shared` - Repositories, loaders, cache

**Format Packages** (install one or both):
- `@ediflow/edifact` - EDIFACT parsers, builders, validation
- `@ediflow/x12` - X12 parsers, validation (850, 810, 837, 856, ...)

**Data Packages — EDIFACT** (install versions you need):
- `@ediflow/edifact-d96a` - D.96A standard definitions
- `@ediflow/edifact-d01b` - D.01B standard definitions
- `@ediflow/edifact-d12a` - D.12A standard definitions
- `@ediflow/edifact-d20b` - D.20B standard definitions

**Data Packages — X12** (install versions you need):
- `@ediflow/x12-004010` - X12 version 004010 definitions

**Optional**:
- `@ediflow/cli` - Command-line interface


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
import {
  EdifactMessageParser,
  EdifactDelimiterDetector,
  EdifactTokenizer,
  EdifactSegmentParser,
} from '@ediflow/edifact';
import { StructureMappingService } from '@ediflow/core';
import { FileBasedMessageStructureRepository } from '@ediflow/infrastructure-shared';

// 1. Parse EDIFACT string → EDIMessage
const parser = new EdifactMessageParser(
  new EdifactDelimiterDetector(), new EdifactTokenizer(), new EdifactSegmentParser(),
);
const message = parser.parse(edifact);

// 2. Load schema + map to Business Object
const repository = new FileBasedMessageStructureRepository('./node_modules');
const structure  = await repository.getMessageStructure('EDIFACT', 'D.20B', 'ORDERS');
const mapper     = new StructureMappingService();
const order      = mapper.map(message, structure!, 'camelCase');

// ✅ Work with named properties!
console.log('📦 Order Details:');
console.log('  Message type:', message.messageType.value);     // ORDERS
console.log('  Version:',      message.version.value);          // D.20B
console.log('  Segments:',     message.segments.length);
```

### Example: TypeScript Object → EDIFACT

```typescript
import {
  EdifactMessageBuilder,
  EdifactEnvelopeBuilder,
} from '@ediflow/edifact';
import { StructureMappingService } from '@ediflow/core';

// Map Business Object back to EDIMessage, then build to string
const mapper    = new StructureMappingService();
const ediMsg    = mapper.unmap(yourBusinessObject, structure!, 'camelCase');
const envelope  = new EdifactEnvelopeBuilder();
const wrapped   = envelope.wrapMessage(ediMsg, { messageRef: '1', messageType: ediMsg.messageType, version: ediMsg.version });
const builder   = new EdifactMessageBuilder();
const edifactStr = builder.build(wrapped);
console.log(edifactStr);  // Ready to send!
```

### Complete Roundtrip

```typescript
// 1️⃣ Parse incoming EDIFACT
const message = parser.parse(incomingEDI);

// 2️⃣ Map to Business Object (schema-aware)
const structure = await repository.getMessageStructure('EDIFACT', 'D.20B', 'ORDERS');
const order     = mapper.map(message, structure!, 'camelCase');

// 3️⃣ Modify ...
// order is a plain object — modify as needed

// 4️⃣ Map back and build
const ediMsg    = mapper.unmap(order, structure!, 'camelCase');
const wrapped   = envelopeBuilder.wrapMessage(ediMsg, {...});
const outgoing  = builder.build(wrapped);
await sendToPartner(outgoing);
```

---

## 🎯 Killer Feature #2: Schema Export

### Generate JSON Schema

```typescript
import { ExportSchemaUseCase } from '@ediflow/core';
import { FileBasedMessageStructureRepository } from '@ediflow/infrastructure-shared';

const repository = new FileBasedMessageStructureRepository('./node_modules');
const exportSchemaUseCase = new ExportSchemaUseCase(repository);

const schema = await exportSchemaUseCase.execute({
  standard: 'EDIFACT',
  version: 'D.20B',
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
const tsSchema = await exportSchemaUseCase.execute({
  standard: 'EDIFACT',
  version: 'D.20B',
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
import { EdifactMessageParser, EdifactDelimiterDetector, EdifactTokenizer, EdifactSegmentParser } from '@ediflow/edifact';
const parser  = new EdifactMessageParser(new EdifactDelimiterDetector(), new EdifactTokenizer(), new EdifactSegmentParser());
const message = parser.parse(edifact);
```

### Validate

```typescript
import { EdifactValidationServiceBuilder } from '@ediflow/edifact';
const validator = EdifactValidationServiceBuilder.forEDIFACT();
const result    = validator.validate(message);
```

### Build

```typescript
import { EdifactMessageBuilder, EdifactEnvelopeBuilder } from '@ediflow/edifact';
const builder   = new EdifactMessageBuilder();
const envelope  = new EdifactEnvelopeBuilder();
const wrapped   = envelope.wrapMessage(msg, { messageRef: '1', messageType: msg.messageType, version: msg.version });
const edifact   = builder.build(wrapped);
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
- [Examples](https://github.com/ediflow-lib/core/tree/main/examples)

---

## 🤝 Need Help?

- [GitHub Issues](https://github.com/ediflow/ediflow/issues)
- [Discussions](https://github.com/ediflow/ediflow/discussions)
- Email: hello.ediflow@gmail.com

---

**Ready for more?** Check out the [Architecture Guide](ARCHITECTURE.md)! 🚀
