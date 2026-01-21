/**
 * ValidationError
 *
 * Represents a validation error with field path and error message.
 */
export class ValidationError {
  constructor(
    public readonly field: string,
    public readonly message: string,
    public readonly code?: string
  ) {}

  toString(): string {
    return this.code ? `[${this.code}] ${this.field}: ${this.message}` : `${this.field}: ${this.message}`;
  }
}
