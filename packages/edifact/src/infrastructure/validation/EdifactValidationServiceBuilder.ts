import {
  ComposableValidationService,
  MessageMustHaveSegmentsRule,
  VersionStandardMustMatchRule,
  MessageTypeStandardMustMatchRule,
  type IValidationRule,
  type EDIMessage
} from '@ediflow/core';
import { UNBMustBeFirstRule } from './rules/UNBMustBeFirstRule';
import { UNZMustBeLastRule } from './rules/UNZMustBeLastRule';
import { EDIFACTSegmentTagFormatRule } from './rules/EDIFACTSegmentTagFormatRule';

/**
 * EDIFACT Validation Service Builder
 *
 * Creates validation services for EDIFACT messages with format-specific rules.
 *
 * Uses BUILDER PATTERN for flexible validator composition.
 *
 * Benefits:
 * - ✅ EDIFACT-specific rules in EDIFACT package
 * - ✅ Core remains format-agnostic
 * - ✅ Tree-shakeable (only load EDIFACT rules when needed)
 * - ✅ Easy to customize validators per use case
 *
 * Example:
 * ```typescript
 * // Quick factory for standard EDIFACT validation
 * const validator = EdifactValidationServiceBuilder.forEDIFACT();
 *
 * // Custom validator with additional rules
 * const validator = EdifactValidationServiceBuilder.custom()
 *   .withBasicRules()
 *   .withEDIFACTRules()
 *   .withCustomRule(new MyCustomRule())
 *   .build();
 * ```
 */
export class EdifactValidationServiceBuilder {
  private service = new ComposableValidationService<EDIMessage>();

  /**
   * Adds basic validation rules that apply to all EDI standards.
   * These rules are imported from @ediflow/core.
   */
  withBasicRules(): this {
    this.service.addRule(new MessageMustHaveSegmentsRule());
    this.service.addRule(new VersionStandardMustMatchRule());
    this.service.addRule(new MessageTypeStandardMustMatchRule());
    return this;
  }

  /**
   * Adds EDIFACT-specific validation rules.
   * These rules check EDIFACT format requirements (UNB/UNZ segments, tag format).
   */
  withEDIFACTRules(): this {
    this.service.addRule(new UNBMustBeFirstRule());
    this.service.addRule(new UNZMustBeLastRule());
    this.service.addRule(new EDIFACTSegmentTagFormatRule());
    return this;
  }

  /**
   * Adds a custom validation rule.
   *
   * @param rule - Custom validation rule (e.g., customer-specific business rules)
   */
  withCustomRule(rule: IValidationRule<EDIMessage>): this {
    this.service.addRule(rule);
    return this;
  }

  /**
   * Builds and returns the validation service.
   */
  build(): ComposableValidationService<EDIMessage> {
    return this.service;
  }

  /**
   * Factory: Creates a complete validator for EDIFACT messages.
   * Includes both basic and EDIFACT-specific rules.
   */
  static forEDIFACT(): ComposableValidationService<EDIMessage> {
    return new EdifactValidationServiceBuilder()
      .withBasicRules()
      .withEDIFACTRules()
      .build();
  }

  /**
   * Factory: Creates an empty builder for custom validators.
   * Use this when you want full control over which rules to include.
   */
  static custom(): EdifactValidationServiceBuilder {
    return new EdifactValidationServiceBuilder();
  }
}
