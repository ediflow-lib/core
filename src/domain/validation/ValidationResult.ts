import { ValidationError } from './ValidationError';

/**
 * ValidationResult
 *
 * Represents the result of a validation with success status and errors.
 */
export class ValidationResult {
  constructor(
    public readonly isValid: boolean,
    public readonly errors: ValidationError[] = []
  ) {}

  static success(): ValidationResult {
    return new ValidationResult(true, []);
  }

  static failure(...errors: ValidationError[]): ValidationResult {
    return new ValidationResult(false, errors);
  }

  addError(error: ValidationError): void {
    (this.errors as ValidationError[]).push(error);
    (this as any).isValid = false;
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrorMessages(): string[] {
    return this.errors.map(e => e.message);
  }

  getErrorsByField(field: string): ValidationError[] {
    return this.errors.filter(e => e.field === field);
  }
}
