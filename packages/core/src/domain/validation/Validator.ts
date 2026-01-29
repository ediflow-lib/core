import { ValidationResult } from './ValidationResult';

/**
 * Validator Interface
 *
 * Base interface for all validators.
 */
export interface Validator<T> {
  validate(value: T): ValidationResult;
}
