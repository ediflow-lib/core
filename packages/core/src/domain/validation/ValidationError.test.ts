import { describe, it, expect } from 'vitest';
import { ValidationError } from './ValidationError';

describe('ValidationError', () => {
  describe('constructor', () => {
    it('should create error with field and message', () => {
      const error = new ValidationError('field1', 'Error message');

      expect(error.field).toBe('field1');
      expect(error.message).toBe('Error message');
      expect(error.code).toBeUndefined();
    });

    it('should create error with optional code', () => {
      const error = new ValidationError('field1', 'Error message', 'ERR_001');

      expect(error.field).toBe('field1');
      expect(error.message).toBe('Error message');
      expect(error.code).toBe('ERR_001');
    });
  });

  describe('toString', () => {
    it('should format error without code', () => {
      const error = new ValidationError('field1', 'Error message');

      expect(error.toString()).toBe('field1: Error message');
    });

    it('should format error with code', () => {
      const error = new ValidationError('field1', 'Error message', 'ERR_001');

      expect(error.toString()).toBe('[ERR_001] field1: Error message');
    });
  });
});
