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
