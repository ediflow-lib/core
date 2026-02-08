import { ValidationError, Standard } from '@ediflow/core';
import type { IValidationRule, EDIMessage } from '@ediflow/core';

/**
 * EDIFACT Validation Rule: Segment Tag Format
 *
 * Validates that EDIFACT segment tags are exactly 3 uppercase letters.
 * Examples: UNB, UNH, BGM, NAD, LIN, etc.
 */
export class EDIFACTSegmentTagFormatRule implements IValidationRule<EDIMessage> {
  readonly ruleId = 'EDIFACT_SEGMENT_TAG_FORMAT';
  readonly description = 'EDIFACT segment tags must be 3 uppercase letters';

  private static readonly SEGMENT_TAG_PATTERN = /^[A-Z]{3}$/;

  apply(message: EDIMessage): ValidationError[] {
    if (message.standard !== Standard.EDIFACT) {
      return [];
    }

    const errors: ValidationError[] = [];
    const segments = message.segments;

    segments.forEach((segment, index) => {
      if (!EDIFACTSegmentTagFormatRule.SEGMENT_TAG_PATTERN.test(segment.tag)) {
        errors.push(
          new ValidationError(
            `segments[${index}].tag`,
            `EDIFACT segment tag must be 3 uppercase letters, got: "${segment.tag}"`,
            'INVALID_SEGMENT_TAG'
          )
        );
      }
    });

    return errors;
  }
}
