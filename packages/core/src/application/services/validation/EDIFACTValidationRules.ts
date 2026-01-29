import type { IValidationRule, EDIMessage } from '../../../domain';
import { ValidationError, Standard } from '../../../domain';

/**
 * EDIFACT-Specific Validation Rules
 *
 * These rules apply ONLY to EDIFACT messages.
 */

/**
 * Rule: EDIFACT messages must start with UNB segment
 */
export class UNBMustBeFirstRule implements IValidationRule<EDIMessage> {
  readonly ruleId = 'EDIFACT_UNB_MUST_BE_FIRST';
  readonly description = 'EDIFACT messages must start with UNB (Interchange Header)';

  apply(message: EDIMessage): ValidationError[] {
    // Only applies to EDIFACT
    if (message.standard !== Standard.EDIFACT) {
      return [];
    }

    const segments = message.segments;
    if (segments.length === 0) {
      return [];
    }

    const firstSegment = segments[0];
    if (!firstSegment || firstSegment.tag !== 'UNB') {
      return [
        new ValidationError(
          'segments[0]',
          'EDIFACT messages must start with UNB segment',
          'INVALID_FIRST_SEGMENT'
        )
      ];
    }

    return [];
  }
}

/**
 * Rule: EDIFACT messages must end with UNZ segment
 */
export class UNZMustBeLastRule implements IValidationRule<EDIMessage> {
  readonly ruleId = 'EDIFACT_UNZ_MUST_BE_LAST';
  readonly description = 'EDIFACT messages must end with UNZ (Interchange Trailer)';

  apply(message: EDIMessage): ValidationError[] {
    // Only applies to EDIFACT
    if (message.standard !== Standard.EDIFACT) {
      return [];
    }

    const segments = message.segments;
    if (segments.length === 0) {
      return [];
    }

    const lastSegment = segments[segments.length - 1];
    if (!lastSegment || lastSegment.tag !== 'UNZ') {
      return [
        new ValidationError(
          `segments[${segments.length - 1}]`,
          'EDIFACT messages must end with UNZ segment',
          'INVALID_LAST_SEGMENT'
        )
      ];
    }

    return [];
  }
}

/**
 * Rule: EDIFACT segment tags must be 3 uppercase letters
 */
export class EDIFACTSegmentTagFormatRule implements IValidationRule<EDIMessage> {
  readonly ruleId = 'EDIFACT_SEGMENT_TAG_FORMAT';
  readonly description = 'EDIFACT segment tags must be 3 uppercase letters';

  private static readonly SEGMENT_TAG_PATTERN = /^[A-Z]{3}$/;

  apply(message: EDIMessage): ValidationError[] {
    // Only applies to EDIFACT
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
