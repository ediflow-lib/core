import type { JSONSchema } from './JSONSchema';
import { ValidationResult } from './ValidationResult';
import { ValidationError } from './ValidationError';

/**
 * BusinessObjectValidator
 *
 * Validates business objects against JSON Schema.
 * Phase 3 Validation: BusinessObject → Schema-based validation
 */
export class BusinessObjectValidator {
  private readonly typeValidators: Record<string, (v: any, s: JSONSchema, p: string, e: ValidationError[]) => void>;

  constructor() {
    this.typeValidators = {
      string: this.validateString.bind(this),
      number: this.validateNumber.bind(this),
      integer: this.validateNumber.bind(this),
      array: this.validateArray.bind(this),
      object: this.validateObject.bind(this)
    };
  }

  validate(businessObject: any, schema: JSONSchema): ValidationResult {
    const errors: ValidationError[] = [];
    this.validateObject(businessObject, schema, '', errors);
    return this.createResult(errors);
  }

  private createResult(errors: ValidationError[]): ValidationResult {
    if (errors.length === 0) {
      return ValidationResult.success();
    }
    return ValidationResult.failure(...errors);
  }

  private validateObject(
    value: any,
    schema: JSONSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    if (schema.type !== 'object') {
      this.validateValue(value, schema, path, errors);
    } else if (!this.isValidObjectType(value)) {
      this.addTypeError(path || 'root', value, 'object', errors);
    } else {
      this.validateRequiredFields(value, schema, path, errors);
      this.validateProperties(value, schema, path, errors);
    }
  }

  private isValidObjectType(value: any): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private validateRequiredFields(
    value: any,
    schema: JSONSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    if (!schema.required) {
      return;
    }

    for (const requiredField of schema.required) {
      if (!(requiredField in value)) {
        const fieldPath = path ? `${path}.${requiredField}` : requiredField;
        errors.push(new ValidationError(fieldPath, 'Required field is missing', 'REQUIRED_FIELD_MISSING'));
      }
    }
  }

  private validateProperties(
    value: any,
    schema: JSONSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    if (!schema.properties) {
      return;
    }

    for (const [propertyName, propertySchema] of Object.entries(schema.properties)) {
      if (propertyName in value) {
        const propertyPath = path ? `${path}.${propertyName}` : propertyName;
        this.validateValue(value[propertyName], propertySchema, propertyPath, errors);
      }
    }
  }

  private validateValue(
    value: any,
    schema: JSONSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    const validator = this.typeValidators[schema.type];
    if (validator) {
      validator(value, schema, path, errors);
    }
  }

  private validateString(
    value: any,
    schema: JSONSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    if (typeof value === 'string') {
      this.validateStringConstraints(value, schema, path, errors);
    } else {
      this.addTypeError(path, value, 'string', errors);
    }
  }

  private validateStringConstraints(
    value: string,
    schema: JSONSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    this.checkMaxLength(value, schema, path, errors);
    this.checkMinLength(value, schema, path, errors);
  }

  private checkMaxLength(value: string, schema: JSONSchema, path: string, errors: ValidationError[]): void {
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push(
        new ValidationError(path, `String length ${value.length} exceeds maxLength ${schema.maxLength}`, 'MAX_LENGTH_EXCEEDED')
      );
    }
  }

  private checkMinLength(value: string, schema: JSONSchema, path: string, errors: ValidationError[]): void {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(
        new ValidationError(path, `String length ${value.length} is less than minLength ${schema.minLength}`, 'MIN_LENGTH_NOT_MET')
      );
    }
  }

  private addTypeError(
    path: string,
    value: any,
    expectedType: string,
    errors: ValidationError[]
  ): void {
    errors.push(
      new ValidationError(
        path,
        `Expected ${expectedType}, got ${typeof value}`,
        'TYPE_MISMATCH'
      )
    );
  }

  private validateNumber(
    value: any,
    schema: JSONSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    if (typeof value !== 'number' || isNaN(value)) {
      this.addTypeError(path, value, 'number', errors);
    } else {
      this.validateNumberConstraints(value, schema, path, errors);
    }
  }

  private validateNumberConstraints(
    value: number,
    schema: JSONSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    this.checkMinimum(value, schema, path, errors);
    this.checkMaximum(value, schema, path, errors);
  }

  private checkMinimum(value: number, schema: JSONSchema, path: string, errors: ValidationError[]): void {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(
        new ValidationError(path, `Value ${value} is less than minimum ${schema.minimum}`, 'MINIMUM_NOT_MET')
      );
    }
  }

  private checkMaximum(value: number, schema: JSONSchema, path: string, errors: ValidationError[]): void {
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(
        new ValidationError(path, `Value ${value} exceeds maximum ${schema.maximum}`, 'MAXIMUM_EXCEEDED')
      );
    }
  }

  private validateArray(
    value: any,
    schema: JSONSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    if (Array.isArray(value)) {
      this.validateArrayConstraints(value, schema, path, errors);
      this.validateArrayItems(value, schema, path, errors);
    } else {
      this.addTypeError(path, value, 'array', errors);
    }
  }

  private validateArrayConstraints(
    value: any[],
    schema: JSONSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    this.checkMaxItems(value, schema, path, errors);
    this.checkMinItems(value, schema, path, errors);
  }

  private checkMaxItems(value: any[], schema: JSONSchema, path: string, errors: ValidationError[]): void {
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(
        new ValidationError(path, `Array length ${value.length} exceeds maxItems ${schema.maxItems}`, 'MAX_ITEMS_EXCEEDED')
      );
    }
  }

  private checkMinItems(value: any[], schema: JSONSchema, path: string, errors: ValidationError[]): void {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(
        new ValidationError(path, `Array length ${value.length} is less than minItems ${schema.minItems}`, 'MIN_ITEMS_NOT_MET')
      );
    }
  }

  private validateArrayItems(
    value: any[],
    schema: JSONSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    if (!schema.items) {
      return;
    }

    for (let i = 0; i < value.length; i++) {
      const itemPath = `${path}[${i}]`;
      this.validateValue(value[i], schema.items, itemPath, errors);
    }
  }
}
