import { describe, it, expect } from 'vitest';
import { EDIMessageValidationService } from './EDIMessageValidationService';
import { EDIMessage } from '../../domain/entities/EDIMessage';
import { EDISegment } from '../../domain/entities/EDISegment';
import { EDIElement } from '../../domain/entities/EDIElement';
import { Standard } from '../../domain/value-objects/Standard';
import { Version } from '../../domain/value-objects/Version';
import { MessageType } from '../../domain/value-objects/MessageType';

describe('EDIMessageValidationService', () => {
  describe('validate', () => {
    it('should return success for a valid message', () => {
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );
      message.addSegment(new EDISegment('UNH', []));
      message.addSegment(new EDISegment('BGM', []));
      message.addSegment(new EDISegment('UNT', []));

      const validator = new EDIMessageValidationService();
      const result = validator.validate(message);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail if message has no segments', () => {
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );

      const validator = new EDIMessageValidationService();
      const result = validator.validate(message);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toContain('at least one segment');
    });

    it('should fail if standard/version mismatch', () => {
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.X12, '005010'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );
      message.addSegment(new EDISegment('UNH', []));

      const validator = new EDIMessageValidationService();
      const result = validator.validate(message);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.toLowerCase().includes('mismatch') || e.message.includes('does not match'))).toBe(true);
    });

    it('should fail if standard/messageType mismatch', () => {
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.X12, '850')
      );
      message.addSegment(new EDISegment('UNH', []));

      const validator = new EDIMessageValidationService();
      const result = validator.validate(message);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.toLowerCase().includes('mismatch') || e.message.includes('does not match'))).toBe(true);
    });

    it('should collect multiple validation errors', () => {
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.X12, '005010'),
        new MessageType(Standard.X12, '850')
      );
      message.addSegment(new EDISegment('UNH', []));

      const validator = new EDIMessageValidationService();
      const result = validator.validate(message);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('validateSegment', () => {
    it('should return success for a valid segment', () => {
      const segment = new EDISegment('BGM', [
        new EDIElement('220'),
        new EDIElement('DESADV20260121001'),
      ]);

      const validator = new EDIMessageValidationService();
      const result = validator.validateSegment(segment);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail if segment has empty tag', () => {
      const segment = new EDISegment('', []);

      const validator = new EDIMessageValidationService();
      const result = validator.validateSegment(segment);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toContain('tag');
    });

    it('should fail if segment tag has invalid characters', () => {
      const segment = new EDISegment('BG@M', []);

      const validator = new EDIMessageValidationService();
      const result = validator.validateSegment(segment);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]?.message).toContain('alphanumeric');
    });

    it('should fail if segment tag is too long', () => {
      const segment = new EDISegment('TOOLONGTAG', []);

      const validator = new EDIMessageValidationService();
      const result = validator.validateSegment(segment);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]?.message).toContain('length');
    });
  });

  describe('validateElement', () => {
    it('should return success for a valid simple element', () => {
      const element = new EDIElement('220');

      const validator = new EDIMessageValidationService();
      const result = validator.validateElement(element);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return success for a valid composite element', () => {
      const element = new EDIElement('', ['220', 'DESADV']);

      const validator = new EDIMessageValidationService();
      const result = validator.validateElement(element);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail if element value and components are both empty', () => {
      const element = new EDIElement('', []);

      const validator = new EDIMessageValidationService();
      const result = validator.validateElement(element);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toContain('empty');
    });

    it('should fail if composite element has empty components', () => {
      const element = new EDIElement('', ['', '']);

      const validator = new EDIMessageValidationService();
      const result = validator.validateElement(element);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]?.message).toContain('empty components');
    });
  });

  describe('getErrorMessages', () => {
    it('should return array of error messages', () => {
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );

      const validator = new EDIMessageValidationService();
      const result = validator.validate(message);

      const messages = result.getErrorMessages();
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]).toBeTruthy();
    });
  });

  describe('getErrorsByField', () => {
    it('should return errors for specific field', () => {
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.X12, '005010'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );

      const validator = new EDIMessageValidationService();
      const result = validator.validate(message);

      const versionErrors = result.getErrorsByField('version');
      expect(versionErrors.length).toBeGreaterThan(0);
    });
  });
});
