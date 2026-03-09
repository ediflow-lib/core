import { ValidationError, Standard } from '@ediflow/core';
import type { IValidationRule, EDIMessage } from '@ediflow/core';

export class IEAMustBeLastRule implements IValidationRule<EDIMessage> {
  readonly ruleId = 'X12_IEA_MUST_BE_LAST';
  readonly description = 'X12 messages must end with IEA (Interchange Control Trailer)';

  apply(message: EDIMessage): ValidationError[] {
    if (message.standard !== Standard.X12) {
      return [];
    }

    const segments = message.segments;
    if (segments.length === 0) {
      return [];
    }

    const lastSegment = segments[segments.length - 1];
    if (!lastSegment || lastSegment.tag !== 'IEA') {
      return [
        new ValidationError(
          `segments[${segments.length - 1}]`,
          'X12 messages must end with IEA segment',
          'INVALID_LAST_SEGMENT'
        )
      ];
    }

    return [];
  }
}

