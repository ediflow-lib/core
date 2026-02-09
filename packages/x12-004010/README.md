# @ediflow/x12-004010

X12 004010 Standard Definitions

## 📦 Package Contents

This package contains X12 004010 (Version 4010) standard definitions for common transaction sets.

### Included Transaction Sets

- **850** - Purchase Order
- **810** - Invoice
- **856** - Ship Notice/Manifest (ASN)
- **997** - Functional Acknowledgment

## 🚀 Usage

```typescript
import { FileBasedMessageStructureRepository } from '@ediflow/infrastructure-shared';
import { Standard } from '@ediflow/core';

const repository = new FileBasedMessageStructureRepository('./node_modules/@ediflow');

// Get 850 Purchase Order structure
const structure = await repository.getMessageDefinition(
  Standard.X12,
  '004010',
  '850'
);
```

## 📋 Message Definitions

Each transaction set includes:
- Segment definitions
- Element definitions
- Message structure (segment sequences)
- Validation rules

## 📦 Installation

```bash
npm install @ediflow/x12-004010
```

## 🔗 Related Packages

- `@ediflow/core` - Core EDI parsing functionality
- `@ediflow/x12` - X12 parser implementation
- `@ediflow/x12-005010` - X12 005010 definitions

## 📝 License

MIT

