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
  validate(businessObject: any, schema: JSONSchema): ValidationResult {
    const errors: ValidationError[] = [];

    this.validateObject(businessObject, schema, '', errors);

    return errors.length > 0
      ? ValidationResult.failure(...errors)
      : ValidationResult.success();
  }

  private validateObject(
    value: any,
    schema: JSONSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    if (schema.type === 'object') {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        errors.push(
          new ValidationError(
            path || 'root',
            `Expected object, got ${typeof value}`,
            'TYPE_MISMATCH'
          )
        );
        return;
      }

      if (schema.required) {
        for (const requiredField of schema.required) {
          if (!(requiredField in value)) {
            errors.push(
              new ValidationError(
                path ? `${path}.${requiredField}` : requiredField,
                `Required field is missing`,
                'REQUIRED_FIELD_MISSING'
              )
            );
          }
        }
      }

      if (schema.properties) {
        for (const [propertyName, propertySchema] of Object.entries(schema.properties)) {
          if (propertyName in value) {
            const propertyPath = path ? `${path}.${propertyName}` : propertyName;
            this.validateValue(value[propertyName], propertySchema, propertyPath, errors);
          }
        }
      }
    } else {
      this.validateValue(value, schema, path, errors);
    }
  }

  private validateValue(
    value: any,
    schema: JSONSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    if (schema.type === 'string') {
      this.validateString(value, schema, path, errors);
    } else if (schema.type === 'number' || schema.type === 'integer') {
      this.validateNumber(value, schema, path, errors);
    } else if (schema.type === 'array') {
      this.validateArray(value, schema, path, errors);
    } else if (schema.type === 'object') {
      this.validateObject(value, schema, path, errors);
    }
  }

  private validateString(
    value: any,
    schema: JSONSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    if (typeof value !== 'string') {
      errors.push(
        new ValidationError(
          path,
          `Expected string, got ${typeof value}`,
          'TYPE_MISMATCH'
        )
      );
      return;
    }

    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push(
        new ValidationError(
          path,
          `String length ${value.length} exceeds maxLength ${schema.maxLength}`,
          'MAX_LENGTH_EXCEEDED'
        )
      );
    }

    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(
        new ValidationError(
          path,
          `String length ${value.length} is less than minLength ${schema.minLength}`,
          'MIN_LENGTH_NOT_MET'
        )
      );
    }
  }

  private validateNumber(
    value: any,
    schema: JSONSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    if (typeof value !== 'number' || isNaN(value)) {
      errors.push(
        new ValidationError(
          path,
          `Expected number, got ${typeof value}`,
          'TYPE_MISMATCH'
        )
      );
      return;
    }

    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(
        new ValidationError(
          path,
          `Value ${value} is less than minimum ${schema.minimum}`,
          'MINIMUM_NOT_MET'
        )
      );
    }

    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(
        new ValidationError(
          path,
          `Value ${value} exceeds maximum ${schema.maximum}`,
          'MAXIMUM_EXCEEDED'
        )
      );
    }
  }

  private validateArray(
    value: any,
    schema: JSONSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    if (!Array.isArray(value)) {
      errors.push(
        new ValidationError(
          path,
          `Expected array, got ${typeof value}`,
          'TYPE_MISMATCH'
        )
      );
      return;
    }

    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(
        new ValidationError(
          path,
          `Array length ${value.length} exceeds maxItems ${schema.maxItems}`,
          'MAX_ITEMS_EXCEEDED'
        )
      );
    }

    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(
        new ValidationError(
          path,
          `Array length ${value.length} is less than minItems ${schema.minItems}`,
          'MIN_ITEMS_NOT_MET'
        )
      );
    }

    if (schema.items) {
      for (let i = 0; i < value.length; i++) {
        const itemPath = `${path}[${i}]`;
        this.validateValue(value[i], schema.items, itemPath, errors);
      }
    }
  }
}
