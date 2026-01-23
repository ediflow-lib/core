import type { ValidationError } from '../validation';

/**
 * Validation Rule Interface
 *
 * Represents a single validation rule that can be applied to an entity.
 * Follows Single Responsibility Principle - each rule checks ONE thing.
 *
 * Example Rules:
 * - SegmentOrderRule (EDIFACT: UNH must be first)
 * - MandatorySegmentRule (BGM is required in ORDERS)
 * - CustomerSpecificRule (Retailer X requires additional fields)
 */
export interface IValidationRule<T> {
  /**
   * The unique identifier for this rule.
   * Used for enabling/disabling specific rules.
   */
  readonly ruleId: string;

  /**
   * Human-readable description of what this rule validates.
   */
  readonly description: string;

  /**
   * Applies the validation rule to an entity.
   *
   * @param entity - The entity to validate
   * @returns Array of validation errors (empty if valid)
   */
  apply(entity: T): ValidationError[];
}
