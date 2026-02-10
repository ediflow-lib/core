# @ediflow/infrastructure-shared

> Shared infrastructure utilities for EDIFlow packages (EDIFACT, X12)

## 📦 What's This Package?

This package provides **shared infrastructure components** used by multiple EDIFlow format packages (EDIFACT, X12).

```typescript
import { 
  LRUCacheManager,
  FileBasedMessageStructureRepository,
  CachedDefinitionLoader
} from '@ediflow/infrastructure-shared';

// EDIFACT Package uses these
// X12 Package uses these
// No code duplication!
```

## 🎯 Why a Separate Package?

**DRY Principle**: Don't Repeat Yourself
- EDIFACT and X12 both need cache, repositories, loaders
- Instead of duplicating code, share it!
- Bug fix in one place → benefits all packages

## 📋 What's Included?

### Cache Implementations
- `LRUCacheManager` - LRU cache for fast lookups

### Repositories
- `FileBasedMessageStructureRepository` - Loads definitions from JSON files
- `InMemoryMessageStructureRepository` - For testing

### Loaders
- `CachedDefinitionLoader` - Loads definitions with caching

## 🚀 Usage

```typescript
// EDIFACT Package
import { LRUCacheManager, FileBasedMessageStructureRepository, CachedDefinitionLoader } from '@ediflow/infrastructure-shared';

const repo = new FileBasedMessageStructureRepository('./data/edifact');
const loader = new CachedDefinitionLoader(repoManager, 100); // LRU cache size 100
```

## 📝 License

MIT
