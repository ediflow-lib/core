import type { IValidationRule } from '@domain';
import type { EDIMessage } from '@domain';
import { ValidationError } from '@domain';

/**
 * Basic Validation Rules for EDI Messages
 *
 * These are GENERIC rules that apply to all EDI standards.
 * Format-specific rules (EDIFACT, X12) should be in separate files.
 */

/**
 * Rule: Message must have at least one segment
 */
export class MessageMustHaveSegmentsRule implements IValidationRule<EDIMessage> {
  readonly ruleId = 'MESSAGE_MUST_HAVE_SEGMENTS';
  readonly description = 'Message must contain at least one segment';

  apply(message: EDIMessage): ValidationError[] {
    if (!message.isValid()) {
      return [
        new ValidationError(
          'segments',
          'Message must have at least one segment',
          'EMPTY_MESSAGE'
        )
      ];
    }
    return [];
  }
}

/**
 * Rule: Version standard must match message standard
 */
export class VersionStandardMustMatchRule implements IValidationRule<EDIMessage> {
  readonly ruleId = 'VERSION_STANDARD_MUST_MATCH';
  readonly description = 'Version standard must match message standard';

  apply(message: EDIMessage): ValidationError[] {
    if (message.standard !== message.version.standard) {
      return [
        new ValidationError(
          'version',
          `Version standard (${message.version.standard}) does not match message standard (${message.standard})`,
          'STANDARD_MISMATCH'
        )
      ];
    }
    return [];
  }
}

/**
 * Rule: MessageType standard must match message standard
 */
export class MessageTypeStandardMustMatchRule implements IValidationRule<EDIMessage> {
  readonly ruleId = 'MESSAGE_TYPE_STANDARD_MUST_MATCH';
  readonly description = 'MessageType standard must match message standard';

  apply(message: EDIMessage): ValidationError[] {
    if (message.standard !== message.messageType.standard) {
      return [
        new ValidationError(
          'messageType',
          `MessageType standard (${message.messageType.standard}) does not match message standard (${message.standard})`,
          'STANDARD_MISMATCH'
        )
      ];
    }
    return [];
  }
}
