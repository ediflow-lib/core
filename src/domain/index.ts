/**
 * EDIFlow Domain Layer
 *
 * Public API for domain entities, value objects, and rules.
 */

// Entities
export { EDIMessage } from './entities/EDIMessage';
export { EDISegment } from './entities/EDISegment';
export { EDIElement } from './entities/EDIElement';

// Value Objects
export { Standard } from './value-objects/Standard';
export { Version } from './value-objects/Version';
export { MessageType } from './value-objects/MessageType';

// Validation Rules
export { ValidationRule } from './rules/ValidationRule';
export { MandatoryRule } from './rules/MandatoryRule';
export { LengthRule } from './rules/LengthRule';
export { TypeRule } from './rules/TypeRule';

// Errors
export { EDIError } from './errors/EDIError';
export { ValidationError } from './errors/ValidationError';
