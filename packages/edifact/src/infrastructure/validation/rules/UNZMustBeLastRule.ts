import { ValidationError, Standard } from '@ediflow/core';
import type { IValidationRule, EDIMessage } from '@ediflow/core';

/**
 * EDIFACT Validation Rule: UNZ Must Be Last
 *
 * Validates that EDIFACT messages end with UNZ (Interchange Trailer) segment.
 * This is mandatory according to EDIFACT standard.
 */
export class UNZMustBeLastRule implements IValidationRule<EDIMessage> {
  readonly ruleId = 'EDIFACT_UNZ_MUST_BE_LAST';
  readonly description = 'EDIFACT messages must end with UNZ (Interchange Trailer)';

  apply(message: EDIMessage): ValidationError[] {
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
