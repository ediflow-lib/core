import { Standard } from './Standard';

/**
 * Version Value Object
 *
 * Represents an EDI standard version (e.g., D.20B for EDIFACT, 005010 for X12)
 *
 * @example
 * const version = new Version(Standard.EDIFACT, 'D.20B');
 */
export class Version {
  constructor(
    public readonly standard: Standard,
    public readonly value: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.value || this.value.trim() === '') {
      throw new Error('Version value cannot be empty');
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: Version): boolean {
    return this.standard === other.standard && this.value === other.value;
  }
}
