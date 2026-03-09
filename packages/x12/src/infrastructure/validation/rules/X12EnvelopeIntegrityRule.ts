import { ValidationError, Standard } from '@ediflow/core';
import type { IValidationRule, EDIMessage } from '@ediflow/core';

export class X12EnvelopeIntegrityRule implements IValidationRule<EDIMessage> {
  readonly ruleId = 'X12_ENVELOPE_INTEGRITY';
  readonly description = 'X12 ISA control number must match IEA control number';

  apply(message: EDIMessage): ValidationError[] {
    if (message.standard !== Standard.X12) {
      return [];
    }

    const isaSegment = message.segments.find(s => s.tag === 'ISA');
    const ieaSegment = message.segments.find(s => s.tag === 'IEA');

    if (!isaSegment || !ieaSegment) {
      return [];
    }

    // ISA element 13 (index 12) = interchange control number
    // IEA element 2 (index 1) = interchange control number
    const isaControlNumber = isaSegment.elements[12]?.value;
    const ieaControlNumber = ieaSegment.elements[1]?.value;

    if (isaControlNumber && ieaControlNumber && isaControlNumber.trim() !== ieaControlNumber.trim()) {
      return [
        new ValidationError(
          'envelope.controlNumber',
          `ISA/IEA control number mismatch: ISA="${isaControlNumber.trim()}" IEA="${ieaControlNumber.trim()}"`,
          'ENVELOPE_CONTROL_NUMBER_MISMATCH'
        )
      ];
    }

    return [];
  }
}

