import { ValidationError, Standard } from '@ediflow/core';
import type { IValidationRule, EDIMessage } from '@ediflow/core';

/**
 * EDIFACT Validation Rule: UNB Must Be First
 *
 * Validates that EDIFACT messages start with UNB (Interchange Header) segment.
 * This is mandatory according to EDIFACT standard.
 */
export class UNBMustBeFirstRule implements IValidationRule<EDIMessage> {
  readonly ruleId = 'EDIFACT_UNB_MUST_BE_FIRST';
  readonly description = 'EDIFACT messages must start with UNB (Interchange Header)';

  apply(message: EDIMessage): ValidationError[] {
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
