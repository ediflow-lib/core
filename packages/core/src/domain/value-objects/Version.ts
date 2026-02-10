import { Standard } from './Standard';

/**
 * Version Value Object
 *
 * Validates EDI standard versions with format rules per standard.
 * EDIFACT: D.20B | X12: 005010 | IDOC: SAP-ECC | VDA: 4905 | HL7v2: 2.5.1 | INHOUSE: Custom
 */
export class Version {
  private static readonly PATTERNS: Record<Standard, RegExp> = {
    [Standard.EDIFACT]: /^D\.\d{2}[A-Z]$/,
    [Standard.X12]: /^\d{6}$/,
    [Standard.IDOC]: /^.+$/,
    [Standard.VDA]: /^\d{4}$/,
    [Standard.HL7v2]: /^2\.\d+(\.\d+)?$/,
    [Standard.INHOUSE]: /^.+$/,  // Flexible: any non-empty string for custom formats
  };

  constructor(
    public readonly standard: Standard,
    public readonly value: string
  ) {
    this.validate();
  }

  static from(value: string, standard?: Standard): Version {
    const detectedStandard = standard || this.detectStandard(value);
    return new Version(detectedStandard, value);
  }

  private static detectStandard(value: string): Standard {
    for (const [standard, pattern] of Object.entries(this.PATTERNS)) {
      if (pattern.test(value)) {
        return standard as Standard;
      }
    }
    throw new Error(
      `Cannot detect standard for version "${value}". ` +
      `Please provide standard explicitly or use a recognized format.`
    );
  }

  private validate(): void {
    if (!this.value || this.value.trim() === '') {
      throw new Error('Version value cannot be empty');
    }

    const pattern = Version.PATTERNS[this.standard];
    if (!pattern.test(this.value)) {
      throw new Error(
        `Invalid version format for ${this.standard}: "${this.value}". ` +
        `Expected format: ${this.getExpectedFormat()}`
      );
    }
  }

  private getExpectedFormat(): string {
    const formats: Record<Standard, string> = {
      [Standard.EDIFACT]: 'D.##L (e.g., D.20B, D.01B)',
      [Standard.X12]: '6 digits (e.g., 005010, 004010)',
      [Standard.IDOC]: 'SAP release version (e.g., SAP-ECC, SAP-S4HANA)',
      [Standard.VDA]: '4 digits (e.g., 4905, 4906)',
      [Standard.HL7v2]: '2.# or 2.#.# (e.g., 2.3, 2.5.1)',
      [Standard.INHOUSE]: 'Custom version string (e.g., v1.0, 2024-Q1)',
    };
    return formats[this.standard];
  }

  toString(): string {
    return this.value;
  }

  equals(other: Version): boolean {
    return this.standard === other.standard && this.value === other.value;
  }
}
