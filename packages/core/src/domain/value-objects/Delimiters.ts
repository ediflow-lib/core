interface DelimitersConfig {
  component: string;
  element: string;
  decimal: string;
  escape: string;
  segment: string;
  repetition?: string;
}

export class Delimiters {
  readonly component: string;
  readonly element: string;
  readonly decimal: string;
  readonly escape: string;
  readonly segment: string;
  readonly repetition?: string;

  private constructor(config: DelimitersConfig) {
    this.component = config.component;
    this.element = config.element;
    this.decimal = config.decimal;
    this.escape = config.escape;
    this.segment = config.segment;
    this.repetition = config.repetition;

    this.validate();
  }

  static custom(config: DelimitersConfig): Delimiters {
    return new Delimiters(config);
  }

  equals(other: Delimiters): boolean {
    const coreMatches = [
      this.component === other.component,
      this.element === other.element,
      this.decimal === other.decimal,
      this.escape === other.escape,
      this.segment === other.segment,
      this.repetition === other.repetition
    ];
    return coreMatches.every(match => match);
  }

  hasEscape(): boolean {
    return this.escape !== '';
  }

  toUNA(): string {
    return `UNA${this.component}${this.element}${this.decimal}${this.escape} ${this.segment}`;
  }

  private validate(): void {
    this.validateMandatoryDelimiters();
    this.validateSingleCharacter();
    this.validateUniqueness();
    this.validateRepetition();
  }

  private validateMandatoryDelimiters(): void {
    if (!this.element || !this.segment) {
      throw new Error('Element and segment delimiters must be defined');
    }
  }

  private validateSingleCharacter(): void {
    const coreDelimiters = [this.component, this.element, this.decimal, this.escape, this.segment]
      .filter(d => d && d.length > 0);

    const invalidDelimiter = coreDelimiters.find(d => d.length !== 1);
    if (invalidDelimiter) {
      throw new Error(`Delimiter must be a single character, got: "${invalidDelimiter}"`);
    }
  }

  private validateUniqueness(): void {
    const nonEmptyDelimiters = [this.component, this.element, this.decimal, this.escape, this.segment]
      .filter(d => d && d.length > 0);

    const uniqueDelimiters = new Set(nonEmptyDelimiters);
    if (uniqueDelimiters.size !== nonEmptyDelimiters.length) {
      throw new Error('All delimiters must be unique');
    }
  }

  private validateRepetition(): void {
    if (this.repetition && this.repetition.length !== 1) {
      throw new Error(`Repetition separator must be a single character, got: "${this.repetition}"`);
    }
  }
}
