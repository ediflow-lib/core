/**
 * Domain Layer Exports
 *
 * Pure business logic - no external dependencies.
 * Contains entities, value objects - no technical services.
 */

// Entities
export * from './entities/EDIMessage';

// Value Objects
export * from './value-objects/Standard';
export * from './value-objects/Version';
export * from './value-objects/MessageType';
export * from './value-objects/Delimiters';
export * from './value-objects/EDISegment';
export * from './value-objects/EDIElement';

