
/**
 * Delimiters Value Object
 *
 * Represents delimiter configuration for EDI standards.
 * Immutable and validated.
 *
 * Domain Layer - Pure Value Object
 */
export class Delimiters {
  readonly component: string;
  readonly element: string;
  readonly decimal: string;
  readonly escape: string;
  readonly segment: string;
  readonly repetition?: string;

  private constructor(
    component: string,
    element: string,
    decimal: string,
    escape: string,
    segment: string,
    repetition?: string
  ) {
    this.component = component;
    this.element = element;
    this.decimal = decimal;
    this.escape = escape;
    this.segment = segment;
    this.repetition = repetition;

    this.validate();
  }

  private validate(): void {
    // Check that core delimiters are defined (element and segment are mandatory)
    if (!this.element || !this.segment) {
      throw new Error('Element and segment delimiters must be defined');
    }

    // Check delimiter length (must be single character if defined)
    const delimiters = [this.component, this.element, this.decimal, this.escape, this.segment].filter(
      (d) => d && d.length > 0
    );

    for (const delimiter of delimiters) {
      if (delimiter.length !== 1) {
        throw new Error(`Delimiter must be a single character, got: "${delimiter}"`);
      }
    }

    // Check uniqueness (all non-empty delimiters must be different)
    const nonEmptyDelimiters = [this.component, this.element, this.decimal, this.escape, this.segment].filter(
      (d) => d && d.length > 0
    );
    const uniqueDelimiters = new Set(nonEmptyDelimiters);
    if (uniqueDelimiters.size !== nonEmptyDelimiters.length) {
      throw new Error('All delimiters must be unique');
    }

    // Check repetition if present
    if (this.repetition && this.repetition.length !== 1) {
      throw new Error(`Repetition separator must be a single character, got: "${this.repetition}"`);
    }
  }

  /**
   * Create custom delimiters
   */
  static custom(config: {
    component: string;
    element: string;
    decimal: string;
    escape: string;
    segment: string;
    repetition?: string;
  }): Delimiters {
    return new Delimiters(
      config.component,
      config.element,
      config.decimal,
      config.escape,
      config.segment,
      config.repetition
    );
  }

  /**
   * Check if delimiters match standard for given standard
   *
   * Note: This requires standard configuration to be passed in
   */
  equals(other: Delimiters): boolean {
    return (
      this.component === other.component &&
      this.element === other.element &&
      this.decimal === other.decimal &&
      this.escape === other.escape &&
      this.segment === other.segment &&
      this.repetition === other.repetition
    );
  }

  /**
   * Check if escape character exists
   */
  hasEscape(): boolean {
    return this.escape !== '';
  }

  /**
   * String representation (UNA format for EDIFACT)
   */
  toUNA(): string {
    return `UNA${this.component}${this.element}${this.decimal}${this.escape} ${this.segment}`;
  }
}
