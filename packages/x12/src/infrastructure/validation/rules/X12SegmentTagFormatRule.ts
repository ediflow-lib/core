import { ValidationError, Standard } from '@ediflow/core';
import type { IValidationRule, EDIMessage } from '@ediflow/core';

// X12 segment tags: 2-3 uppercase alphanumeric characters
const X12_SEGMENT_TAG_PATTERN = /^[A-Z0-9]{2,3}$/;

export class X12SegmentTagFormatRule implements IValidationRule<EDIMessage> {
  readonly ruleId = 'X12_SEGMENT_TAG_FORMAT';
  readonly description = 'X12 segment tags must be 2-3 uppercase alphanumeric characters';

  apply(message: EDIMessage): ValidationError[] {
    if (message.standard !== Standard.X12) {
      return [];
    }

    return message.segments
      .filter(segment => !X12_SEGMENT_TAG_PATTERN.test(segment.tag))
      .map(
        (segment, index) =>
          new ValidationError(
            `segments[${index}].tag`,
            `Invalid X12 segment tag format: "${segment.tag}"`,
            'INVALID_SEGMENT_TAG_FORMAT'
          )
      );
  }
}

