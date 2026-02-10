import type { IValidationService, ValidationContext, IValidationRule } from '../validation';
import { ValidationResult, ValidationError } from '../validation';

// noinspection ParameterNamingConventionJS
/**
 * Composable Validation Service
 *
 * Uses COMPOSITION instead of INHERITANCE!
 * Follows Strategy Pattern + Chain of Responsibility.
 *
 * Benefits:
 * - ✅ Rules can be added/removed at runtime
 * - ✅ Each rule is independently testable
 * - ✅ Format-specific validators can be built using Builder Pattern
 * - ✅ Custom rules can be injected per repository
 *
 * Example:
 * ```typescript
 * const validator = new ComposableValidationService<EDIMessage>();
 * validator.addRule(new UNHMustBeFirstRule());
 * validator.addRule(new CustomRetailerRule());
 * const result = validator.validate(message);
 * ```
 */
export class ComposableValidationService<T> implements IValidationService<T> {
  private rules: IValidationRule<T>[] = [];

  /**
   * Adds a validation rule to this service.
   *
   * @param rule - The validation rule to add
   * @returns This service (for method chaining)
   */
  addRule(rule: IValidationRule<T>): this {
    this.rules.push(rule);
    return this;
  }

  /**
   * Removes a validation rule by its ID.
   *
   * @param ruleId - The ID of the rule to remove
   * @returns This service (for method chaining)
   */
  removeRule(ruleId: string): this {
    this.rules = this.rules.filter(rule => rule.ruleId !== ruleId);
    return this;
  }

  /**
   * Gets all registered rule IDs.
   *
   * @returns Array of rule IDs
   */
  getRuleIds(): string[] {
    return this.rules.map(rule => rule.ruleId);
  }

  /**
   * Validates an entity by applying all registered rules.
   *
   * @param entity - The entity to validate
   * @param _validationContext - Optional validation context (unused in base implementation)
   * @returns Validation result with all errors from all rules
   */
  validate(entity: T, _validationContext?: ValidationContext): ValidationResult {
    const allErrors: ValidationError[] = [];

    // Apply all rules
    for (const rule of this.rules) {
      const ruleErrors = rule.apply(entity);
      allErrors.push(...ruleErrors);
    }

    // Return result
    return allErrors.length === 0
      ? ValidationResult.success()
      : ValidationResult.failure(...allErrors);
  }

  /**
   * Clears all rules from this service.
   */
  clear(): void {
    this.rules = [];
  }
}
