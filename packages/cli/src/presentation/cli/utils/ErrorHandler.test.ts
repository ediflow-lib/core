import { describe, it, expect } from 'vitest';
import { ErrorHandler } from './ErrorHandler';
import { DefinitionNotFoundError } from '@ediflow/core';
import { Standard } from '@ediflow/core';
import { Version } from '@ediflow/core';
import { MessageType } from '@ediflow/core';

describe('ErrorHandler', () => {
  describe('format', () => {
    it('should format generic Error with message', () => {
      const error = new Error('Something went wrong');
      const result = ErrorHandler.format(error);

      expect(result).toContain('❌ Error:');
      expect(result).toContain('Something went wrong');
    });

    it('should format unknown error', () => {
      const error = 'string error';
      const result = ErrorHandler.format(error);

      expect(result).toContain('❌ Error:');
      expect(result).toContain('string error');
    });

    it('should format DefinitionNotFoundError with installation instructions', () => {
      const error = new DefinitionNotFoundError(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.96A'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      const result = ErrorHandler.format(error);

      // Should contain all important information
      expect(result).toContain('❌ Message Definition Not Found');
      expect(result).toContain('Standard:     EDIFACT');
      expect(result).toContain('Version:      D.96A');
      expect(result).toContain('Message Type: ORDERS');

      // Should contain installation instructions
      expect(result).toContain('npm install @ediflow/edifact-d96a');
      expect(result).toContain('📦 The required data package is not installed');

      // Should list available packages
      expect(result).toContain('@ediflow/edifact-d96a');
      expect(result).toContain('@ediflow/edifact-d01b');
      expect(result).toContain('@ediflow/edifact-d20b');
    });

    it('should map version D.01B to correct package name', () => {
      const error = new DefinitionNotFoundError(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.01B'),
        new MessageType(Standard.EDIFACT, 'INVOIC')
      );

      const result = ErrorHandler.format(error);

      expect(result).toContain('npm install @ediflow/edifact-d01b');
      expect(result).toContain('Version:      D.01B');
    });

    it('should map version D.20B to correct package name', () => {
      const error = new DefinitionNotFoundError(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );

      const result = ErrorHandler.format(error);

      expect(result).toContain('npm install @ediflow/edifact-d20b');
      expect(result).toContain('Version:      D.20B');
    });
  });

  describe('formatMultiple', () => {
    it('should format array of errors', () => {
      const errors = [
        { code: 'E001', message: 'First error', field: 'field1' },
        { code: 'E002', message: 'Second error' },
      ];

      const result = ErrorHandler.formatMultiple(errors);

      expect(result).toContain('❌ Errors found:');
      expect(result).toContain('1. [E001] (field1) First error');
      expect(result).toContain('2. [E002] Second error');
    });

    it('should handle errors without field', () => {
      const errors = [
        { code: 'E001', message: 'Error without field' },
      ];

      const result = ErrorHandler.formatMultiple(errors);

      expect(result).toContain('[E001]');
      expect(result).toContain('Error without field');
      expect(result).not.toContain('()');
    });
  });

  describe('formatValidation', () => {
    it('should format validation errors', () => {
      const errors = [
        { code: 'VAL001', message: 'Validation failed', field: 'UNH' },
        { message: 'Missing segment' },
      ];

      const result = ErrorHandler.formatValidation(errors);

      expect(result).toContain('❌ Validation errors found:');
      expect(result).toContain('1. [VAL001] (UNH) Validation failed');
      expect(result).toContain('2. [VALIDATION_ERROR] Missing segment');
    });

    it('should use default code when code is missing', () => {
      const errors = [
        { message: 'Error without code' },
      ];

      const result = ErrorHandler.formatValidation(errors);

      expect(result).toContain('[VALIDATION_ERROR]');
      expect(result).toContain('Error without code');
    });
  });
});
