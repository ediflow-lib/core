import { Standard } from './Standard';

/**
 * MessageType Value Object
 *
 * Validates EDI message types with format rules per standard.
 * EDIFACT: DESADV | X12: 850 | IDOC: ORDERS05 | VDA: 4905 | HL7v2: ADT | INHOUSE: Custom
 */
export class MessageType {
  private static readonly PATTERNS: Record<Standard, RegExp> = {
    [Standard.EDIFACT]: /^[A-Z]{6}$/,
    [Standard.X12]: /^\d{3}(-[A-Z0-9]+)?$/,  // e.g. 850, 837-Q1, 277-B3
    [Standard.IDOC]: /^[A-Z]+\d{2}$/,
    [Standard.VDA]: /^\d{4}$/,
    [Standard.HL7v2]: /^[A-Z]{3}$/,
    [Standard.INHOUSE]: /^.+$/,  // Flexible: any non-empty string for custom formats
  };

  constructor(
    public readonly standard: Standard,
    public readonly value: string
  ) {
    this.validate();
  }

  static from(value: string, standard?: Standard): MessageType {
    const detectedStandard = standard || this.detectStandard(value);
    return new MessageType(detectedStandard, value);
  }

  private static detectStandard(value: string): Standard {
    for (const [standard, pattern] of Object.entries(this.PATTERNS)) {
      if (pattern.test(value)) {
        return standard as Standard;
      }
    }
    throw new Error(
      `Cannot detect standard for message type "${value}". ` +
      `Please provide standard explicitly or use a recognized format.`
    );
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
      [Standard.X12]: '3 digits with optional qualifier (e.g., 850, 837-Q1, 277-B3)',
      [Standard.IDOC]: 'Uppercase letters + 2 digits (e.g., ORDERS05, INVOIC02)',
      [Standard.VDA]: '4 digits (e.g., 4905, 4906, 4908)',
      [Standard.HL7v2]: '3 uppercase letters (e.g., ADT, ORM, ORU)',
      [Standard.INHOUSE]: 'Custom message type (e.g., CUSTOM_ORDER, PO_2024)',
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
