import { Standard } from './Standard';

/**
 * MessageType Value Object
 *
 * Validates EDI message types with format rules per standard.
 * EDIFACT: DESADV | X12: 850 | IDOC: ORDERS05 | VDA: 4905 | HL7v2: ADT
 */
export class MessageType {
  private static readonly PATTERNS: Record<Standard, RegExp> = {
    [Standard.EDIFACT]: /^[A-Z]{6}$/,
    [Standard.X12]: /^\d{3}$/,
    [Standard.IDOC]: /^[A-Z]+\d{2}$/,
    [Standard.VDA]: /^\d{4}$/,
    [Standard.HL7v2]: /^[A-Z]{3}$/,
  };

  constructor(
    public readonly standard: Standard,
    public readonly value: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.value || this.value.trim() === '') {
      throw new Error('MessageType value cannot be empty');
    }

    const pattern = MessageType.PATTERNS[this.standard];
    if (!pattern.test(this.value)) {
      throw new Error(
        `Invalid message type format for ${this.standard}: "${this.value}". ` +
        `Expected format: ${this.getExpectedFormat()}`
      );
    }
  }

  private getExpectedFormat(): string {
    const formats: Record<Standard, string> = {
      [Standard.EDIFACT]: '6 uppercase letters (e.g., DESADV, INVOIC)',
      [Standard.X12]: '3 digits (e.g., 850, 810, 856)',
      [Standard.IDOC]: 'Uppercase letters + 2 digits (e.g., ORDERS05, INVOIC02)',
      [Standard.VDA]: '4 digits (e.g., 4905, 4906, 4908)',
      [Standard.HL7v2]: '3 uppercase letters (e.g., ADT, ORM, ORU)',
    };
    return formats[this.standard];
  }

  toString(): string {
    return this.value;
  }

  equals(other: MessageType): boolean {
    return this.standard === other.standard && this.value === other.value;
  }
}
