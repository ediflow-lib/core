/**
 * EDIFlow Domain Layer
 *
 * Public API for domain entities, value objects, and validation.
 */

// Entities
export { EDIMessage } from './entities/EDIMessage';
export { EDISegment } from './entities/EDISegment';
export { EDIElement } from './entities/EDIElement';

// Value Objects
export { Standard } from './value-objects/Standard';
export { Version } from './value-objects/Version';
export { MessageType } from './value-objects/MessageType';

// Validation
export * from './validation';
