/**
 * MappingKeyStrategy
 *
 * Defines how keys are named in the objects produced by StructureMappingService.
 * The same strategy must be used for both map() and unmap() — it is the contract
 * between producer and consumer (like a serialisation format).
 *
 * | Strategy   | Segment key          | Element key         | Example                              |
 * |------------|----------------------|---------------------|--------------------------------------|
 * | code       | BGM                  | 1004                | { "BGM": { "1004": "PO-001" } }      |
 * | name       | Beginning of message | Document identifier | { "Beginning of message": { … } }    |
 * | camelCase  | beginningOfMessage   | documentIdentifier  | { "beginningOfMessage": { … } }      |
 * | snake_case | beginning_of_message | document_identifier | { "beginning_of_message": { … } }    |
 * | kebab-case | beginning-of-message | document-identifier | { "beginning-of-message": { … } }    |
 */
export type MappingKeyStrategy = 'code' | 'name' | 'camelCase' | 'snake_case' | 'kebab-case';

export const DEFAULT_MAPPING_KEY_STRATEGY: MappingKeyStrategy = 'code';

/** @deprecated Use MappingKeyStrategy */
export type OutputKeyStrategy = MappingKeyStrategy;
/** @deprecated Use DEFAULT_MAPPING_KEY_STRATEGY */
export const DEFAULT_OUTPUT_KEY_STRATEGY = DEFAULT_MAPPING_KEY_STRATEGY;
