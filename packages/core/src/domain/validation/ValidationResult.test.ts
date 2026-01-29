import { describe, it, expect } from 'vitest';
import { ValidationResult } from './ValidationResult';
import { ValidationError } from './ValidationError';

describe('ValidationResult', () => {
  describe('success', () => {
    it('should create successful result', () => {
      const result = ValidationResult.success();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.hasErrors()).toBe(false);
    });
  });

  describe('failure', () => {
    it('should create failed result with errors', () => {
      const error1 = new ValidationError('field1', 'Error 1');
      const error2 = new ValidationError('field2', 'Error 2');

      const result = ValidationResult.failure(error1, error2);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.hasErrors()).toBe(true);
    });

    it('should create failed result with single error', () => {
      const error = new ValidationError('field1', 'Error message');

      const result = ValidationResult.failure(error);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe(error);
    });
  });

  describe('addError', () => {
    it('should add error to result', () => {
      const result = ValidationResult.success();
      const error = new ValidationError('field1', 'Error message');

      result.addError(error);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe(error);
    });

    it('should add multiple errors', () => {
      const result = ValidationResult.success();

      result.addError(new ValidationError('field1', 'Error 1'));
      result.addError(new ValidationError('field2', 'Error 2'));

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('hasErrors', () => {
    it('should return false for success result', () => {
      const result = ValidationResult.success();

      expect(result.hasErrors()).toBe(false);
    });

    it('should return true for failure result', () => {
      const result = ValidationResult.failure(new ValidationError('field1', 'Error'));

      expect(result.hasErrors()).toBe(true);
    });
  });

  describe('getErrorMessages', () => {
    it('should return array of error messages', () => {
      const result = ValidationResult.failure(
        new ValidationError('field1', 'Error 1'),
        new ValidationError('field2', 'Error 2')
      );

      const messages = result.getErrorMessages();

      expect(messages).toHaveLength(2);
      expect(messages[0]).toBe('Error 1');
      expect(messages[1]).toBe('Error 2');
    });

    it('should return empty array for success result', () => {
      const result = ValidationResult.success();

      expect(result.getErrorMessages()).toHaveLength(0);
    });
  });

  describe('getErrorsByField', () => {
    it('should return errors for specific field', () => {
      const error1 = new ValidationError('field1', 'Error 1');
      const error2 = new ValidationError('field2', 'Error 2');
      const error3 = new ValidationError('field1', 'Error 3');

      const result = ValidationResult.failure(error1, error2, error3);

      const field1Errors = result.getErrorsByField('field1');

      expect(field1Errors).toHaveLength(2);
      expect(field1Errors[0]).toBe(error1);
      expect(field1Errors[1]).toBe(error3);
    });

    it('should return empty array if no errors for field', () => {
      const result = ValidationResult.failure(new ValidationError('field1', 'Error'));

      const field2Errors = result.getErrorsByField('field2');

      expect(field2Errors).toHaveLength(0);
    });
  });
});
