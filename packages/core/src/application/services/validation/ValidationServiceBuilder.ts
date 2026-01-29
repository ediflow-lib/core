import { ComposableValidationService } from '@application/services';
import type { EDIMessage } from '@domain';
import { Standard } from '@domain';
import {
  MessageMustHaveSegmentsRule,
  VersionStandardMustMatchRule,
  MessageTypeStandardMustMatchRule
} from '@application/services';
import {
  UNBMustBeFirstRule,
  UNZMustBeLastRule,
  EDIFACTSegmentTagFormatRule
} from '@application/services';

/**
 * Validator Builder for different EDI standards
 *
 * Uses BUILDER PATTERN instead of INHERITANCE!
 *
 * Benefits:
 * - ✅ Format-specific rules are clearly separated
 * - ✅ Easy to add new standards (X12, IDOC, etc.)
 * - ✅ Can customize validators per use case
 *
 * Example:
 * ```typescript
 * // For EDIFACT
 * const validator = ValidationServiceBuilder.forEDIFACT();
 *
 * // For X12
 * const validator = ValidationServiceBuilder.forX12();
 *
 * // Custom
 * const validator = ValidationServiceBuilder.custom()
 *   .withBasicRules()
 *   .withCustomRule(new MyCustomRule())
 *   .build();
 * ```
 */
export class ValidationServiceBuilder {
  private service = new ComposableValidationService<EDIMessage>();

  /**
   * Creates a validator with basic rules that apply to all standards.
   */
  withBasicRules(): this {
    this.service.addRule(new MessageMustHaveSegmentsRule());
    this.service.addRule(new VersionStandardMustMatchRule());
    this.service.addRule(new MessageTypeStandardMustMatchRule());
    return this;
  }

  /**
   * Adds EDIFACT-specific validation rules.
   */
  withEDIFACTRules(): this {
    this.service.addRule(new UNBMustBeFirstRule());
    this.service.addRule(new UNZMustBeLastRule());
    this.service.addRule(new EDIFACTSegmentTagFormatRule());
    return this;
  }

  /**
   * Adds X12-specific validation rules.
   * TODO: Implement X12 rules
   */
  withX12Rules(): this {
    // TODO: Add X12-specific rules when implemented
    // this.service.addRule(new ISAMustBeFirstRule());
    // this.service.addRule(new IEAMustBeLastRule());
    return this;
  }

  /**
   * Adds a custom validation rule.
   *
   * @param rule - Custom validation rule (e.g., customer-specific)
   */
  withCustomRule(rule: import('../../../domain').IValidationRule<EDIMessage>): this {
    this.service.addRule(rule);
    return this;
  }

  /**
   * Builds the validation service.
   */
  build(): ComposableValidationService<EDIMessage> {
    return this.service;
  }

  /**
   * Factory: Creates a validator for EDIFACT messages.
   */
  static forEDIFACT(): ComposableValidationService<EDIMessage> {
    return new ValidationServiceBuilder()
      .withBasicRules()
      .withEDIFACTRules()
      .build();
  }

  /**
   * Factory: Creates a validator for X12 messages.
   */
  static forX12(): ComposableValidationService<EDIMessage> {
    return new ValidationServiceBuilder()
      .withBasicRules()
      .withX12Rules()
      .build();
  }

  /**
   * Factory: Creates a validator for a specific standard.
   */
  static forStandard(standard: Standard): ComposableValidationService<EDIMessage> {
    const builder = new ValidationServiceBuilder().withBasicRules();

    switch (standard) {
      case Standard.EDIFACT:
        return builder.withEDIFACTRules().build();
      case Standard.X12:
        return builder.withX12Rules().build();
      default:
        // Other standards: only basic rules for now
        return builder.build();
    }
  }

  /**
   * Factory: Creates an empty builder for custom validators.
   */
  static custom(): ValidationServiceBuilder {
    return new ValidationServiceBuilder();
  }
}
