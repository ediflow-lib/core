import { ValidationError, Standard } from '@ediflow/core';
import type { IValidationRule, EDIMessage } from '@ediflow/core';

export class ISAMustBeFirstRule implements IValidationRule<EDIMessage> {
  readonly ruleId = 'X12_ISA_MUST_BE_FIRST';
  readonly description = 'X12 messages must start with ISA (Interchange Control Header)';

  apply(message: EDIMessage): ValidationError[] {
    if (message.standard !== Standard.X12) {
      return [];
    }

    const segments = message.segments;
    if (segments.length === 0) {
      return [];
    }

    const firstSegment = segments[0];
    if (!firstSegment || firstSegment.tag !== 'ISA') {
      return [
        new ValidationError(
          'segments[0]',
          'X12 messages must start with ISA segment',
          'INVALID_FIRST_SEGMENT'
        )
      ];
    }

    return [];
  }
}

