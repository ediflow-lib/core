/**
 * X12 Envelope Parser
 *
 * Parses X12 envelope structure (ISA/GS/ST/SE/GE/IEA) and validates integrity.
 * Implements hierarchical structure: Interchange → Functional Group → Transaction Set
 *
 * @module X12EnvelopeParser
 * @see Story #48
 */

import { EDISegment } from '@ediflow/core';

export interface X12Interchange {
  isa: EDISegment;
  functionalGroups: X12FunctionalGroup[];
  iea: EDISegment;
}

export interface X12FunctionalGroup {
  gs: EDISegment;
  transactionSets: X12TransactionSet[];
  ge: EDISegment;
}

export interface X12TransactionSet {
  st: EDISegment;
  segments: EDISegment[];
  se: EDISegment;
}

export class X12EnvelopeParser {
  parse(segments: EDISegment[]): X12Interchange {
    this.validateMinimumSegments(segments);

    const isa = this.extractISA(segments);
    const iea = this.extractIEA(segments);
    const functionalGroups = this.extractFunctionalGroups(segments);

    this.validateISAIEAControlNumbers(isa, iea);
    this.validateIEAGroupCount(iea, functionalGroups.length);

    return { isa, functionalGroups, iea };
  }

  private validateMinimumSegments(segments: EDISegment[]): void {
    if (segments.length < 2) {
      throw new Error('Insufficient segments for X12 envelope');
    }
  }

  private extractISA(segments: EDISegment[]): EDISegment {
    const isa = segments[0];
    if (!isa || isa.tag !== 'ISA') {
      throw new Error('ISA segment not found');
    }
    return isa;
  }

  private extractIEA(segments: EDISegment[]): EDISegment {
    const iea = segments[segments.length - 1];
    if (!iea || iea.tag !== 'IEA') {
      throw new Error('IEA segment not found');
    }
    return iea;
  }

  private extractFunctionalGroups(segments: EDISegment[]): X12FunctionalGroup[] {
    const groups: X12FunctionalGroup[] = [];
    let i = 1;

    while (i < segments.length - 1) {
      const segment = segments[i];

      if (segment?.tag === 'GS') {
        const group = this.parseFunctionalGroup(segments, i);
        groups.push(group.functionalGroup);
        i = group.nextIndex;
      } else {
        i++;
      }
    }

    return groups;
  }

  private parseFunctionalGroup(
    segments: EDISegment[],
    startIndex: number
  ): { functionalGroup: X12FunctionalGroup; nextIndex: number } {
    const gs = segments[startIndex];
    if (!gs) {
      throw new Error('GS segment not found');
    }

    const transactionSets: X12TransactionSet[] = [];
    let i = startIndex + 1;

    while (i < segments.length) {
      const segment = segments[i];

      if (segment?.tag === 'ST') {
        const result = this.parseTransactionSet(segments, i);
        transactionSets.push(result.transactionSet);
        i = result.nextIndex;
      } else if (segment?.tag === 'GE') {
        this.validateGSGEControlNumbers(gs, segment);
        this.validateGETransactionSetCount(segment, transactionSets.length);
        return {
          functionalGroup: { gs, transactionSets, ge: segment },
          nextIndex: i + 1,
        };
      } else {
        i++;
      }
    }

    throw new Error('GE segment not found');
  }

  private parseTransactionSet(
    segments: EDISegment[],
    startIndex: number
  ): { transactionSet: X12TransactionSet; nextIndex: number } {
    const st = segments[startIndex];
    if (!st) {
      throw new Error('ST segment not found');
    }

    const transactionSegments: EDISegment[] = [];
    let i = startIndex + 1;

    while (i < segments.length) {
      const segment = segments[i];

      if (segment?.tag === 'SE') {
        this.validateSTSEControlNumbers(st, segment);
        this.validateSESegmentCount(segment, transactionSegments.length + 2);
        return {
          transactionSet: { st, segments: transactionSegments, se: segment },
          nextIndex: i + 1,
        };
      } else if (segment && this.isTransactionSegment(segment)) {
        transactionSegments.push(segment);
        i++;
      } else {
        break;
      }
    }

    throw new Error('SE segment not found');
  }

  private isTransactionSegment(segment: EDISegment): boolean {
    return segment.tag !== 'ST' && segment.tag !== 'GE' && segment.tag !== 'IEA';
  }

  private validateISAIEAControlNumbers(isa: EDISegment, iea: EDISegment): void {
    const isaControlNumber = isa.elements[12]?.value;
    const ieaControlNumber = iea.elements[1]?.value;

    if (isaControlNumber !== ieaControlNumber) {
      throw new Error('ISA/IEA control number mismatch');
    }
  }

  private validateGSGEControlNumbers(gs: EDISegment, ge: EDISegment): void {
    const gsControlNumber = gs.elements[5]?.value;
    const geControlNumber = ge.elements[1]?.value;

    if (gsControlNumber !== geControlNumber) {
      throw new Error('GS/GE control number mismatch');
    }
  }

  private validateSTSEControlNumbers(st: EDISegment, se: EDISegment): void {
    const stControlNumber = st.elements[1]?.value;
    const seControlNumber = se.elements[1]?.value;

    if (stControlNumber !== seControlNumber) {
      throw new Error('ST/SE control number mismatch');
    }
  }

  private validateSESegmentCount(se: EDISegment, actualCount: number): void {
    const expectedCount = parseInt(se.elements[0]?.value || '0', 10);

    if (expectedCount !== actualCount) {
      throw new Error('SE segment count mismatch');
    }
  }

  private validateGETransactionSetCount(ge: EDISegment, actualCount: number): void {
    const expectedCount = parseInt(ge.elements[0]?.value || '0', 10);

    if (expectedCount !== actualCount) {
      throw new Error('GE transaction set count mismatch');
    }
  }

  private validateIEAGroupCount(iea: EDISegment, actualCount: number): void {
    const expectedCount = parseInt(iea.elements[0]?.value || '0', 10);

    if (expectedCount !== actualCount) {
      throw new Error('IEA functional group count mismatch');
    }
  }
}
