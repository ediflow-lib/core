import { describe, it, expect } from 'vitest';
import { Version } from './Version';
import { Standard } from './Standard';

describe('Version', () => {
  describe('constructor', () => {
    it('should create a valid EDIFACT version', () => {
      // Arrange & Act
      const version = new Version(Standard.EDIFACT, 'D.20B');

      // Assert
      expect(version.standard).toBe(Standard.EDIFACT);
      expect(version.value).toBe('D.20B');
    });

    it('should create a valid X12 version', () => {
      // Arrange & Act
      const version = new Version(Standard.X12, '005010');

      // Assert
      expect(version.standard).toBe(Standard.X12);
      expect(version.value).toBe('005010');
    });

    it('should throw error for empty version', () => {
      // Act & Assert
      expect(() => new Version(Standard.EDIFACT, '')).toThrow('Version value cannot be empty');
      expect(() => new Version(Standard.EDIFACT, '   ')).toThrow('Version value cannot be empty');
    });
  });

  describe('EDIFACT version validation', () => {
    it('should accept valid EDIFACT version formats', () => {
      // Valid formats: D.96A, D.01B, D.20B, D.23A
      const validVersions = ['D.96A', 'D.01B', 'D.20B', 'D.23A', 'D.99Z'];

      validVersions.forEach((value) => {
        expect(() => new Version(Standard.EDIFACT, value)).not.toThrow();
      });
    });

    it('should reject invalid EDIFACT version formats', () => {
      const invalidVersions = [
        '20B',           // Missing D.
        'D20B',          // Missing dot
        'd.20B',         // Lowercase D
        'D.20b',         // Lowercase letter
        'D.2B',          // Single digit
        'D.200B',        // Three digits
        'D.20BB',        // Two letters
        '005010',        // X12 format
      ];

      invalidVersions.forEach((value) => {
        expect(() => new Version(Standard.EDIFACT, value)).toThrow(/Invalid version format/);
      });
    });
  });

  describe('X12 version validation', () => {
    it('should accept valid X12 version formats', () => {
      // Valid formats: 004010, 005010, 008020
      const validVersions = ['004010', '005010', '008020', '003070'];

      validVersions.forEach((value) => {
        expect(() => new Version(Standard.X12, value)).not.toThrow();
      });
    });

    it('should reject invalid X12 version formats', () => {
      const invalidVersions = [
        '5010',          // Too short
        '0050100',       // Too long
        'D.20B',         // EDIFACT format
        '00501A',        // Contains letter
        'SAP-ECC',       // IDOC format
      ];

      invalidVersions.forEach((value) => {
        expect(() => new Version(Standard.X12, value)).toThrow(/Invalid version format/);
      });
    });
  });

  describe('IDOC version validation', () => {
    it('should accept valid IDOC version formats', () => {
      // IDOC versions are flexible (SAP release versions)
      const validVersions = ['SAP-ECC', 'SAP-S4HANA', 'ECC-6.0', 'S4HANA-2021'];

      validVersions.forEach((value) => {
        expect(() => new Version(Standard.IDOC, value)).not.toThrow();
      });
    });

    it('should only reject empty IDOC versions', () => {
      // IDOC versions are very flexible, only empty is invalid
      expect(() => new Version(Standard.IDOC, '')).toThrow('Version value cannot be empty');
      expect(() => new Version(Standard.IDOC, 'ANY-FORMAT')).not.toThrow();
    });
  });

  describe('VDA version validation', () => {
    it('should accept valid VDA version formats', () => {
      // Valid formats: 4905, 4906, 4908, 4913
      const validVersions = ['4905', '4906', '4908', '4913', '4920'];

      validVersions.forEach((value) => {
        expect(() => new Version(Standard.VDA, value)).not.toThrow();
      });
    });

    it('should reject invalid VDA version formats', () => {
      const invalidVersions = [
        '905',           // Too short
        '49050',         // Too long
        'D.20B',         // EDIFACT format
        '490A',          // Contains letter
      ];

      invalidVersions.forEach((value) => {
        expect(() => new Version(Standard.VDA, value)).toThrow(/Invalid version format/);
      });
    });
  });

  describe('HL7v2 version validation', () => {
    it('should accept valid HL7v2 version formats', () => {
      // Valid formats: 2.3, 2.5.1, 2.7
      const validVersions = ['2.3', '2.4', '2.5', '2.5.1', '2.6', '2.7', '2.8'];

      validVersions.forEach((value) => {
        expect(() => new Version(Standard.HL7v2, value)).not.toThrow();
      });
    });

    it('should reject invalid HL7v2 version formats', () => {
      const invalidVersions = [
        '2',             // No minor version
        '2.a',           // Letter in minor
        '3.0',           // Wrong major version
        'v2.5',          // Prefix
        'D.20B',         // EDIFACT format
      ];

      invalidVersions.forEach((value) => {
        expect(() => new Version(Standard.HL7v2, value)).toThrow(/Invalid version format/);
      });
    });
  });

  describe('toString', () => {
    it('should return the version value', () => {
      const version = new Version(Standard.EDIFACT, 'D.20B');
      expect(version.toString()).toBe('D.20B');
    });
  });

  describe('equals', () => {
    it('should return true for equal versions', () => {
      const version1 = new Version(Standard.EDIFACT, 'D.20B');
      const version2 = new Version(Standard.EDIFACT, 'D.20B');

      expect(version1.equals(version2)).toBe(true);
    });

    it('should return false for different values', () => {
      const version1 = new Version(Standard.EDIFACT, 'D.20B');
      const version2 = new Version(Standard.EDIFACT, 'D.01B');

      expect(version1.equals(version2)).toBe(false);
    });

    it('should return false for different standards', () => {
      const version1 = new Version(Standard.EDIFACT, 'D.20B');
      const version2 = new Version(Standard.X12, '005010'); // Use valid X12 format

      expect(version1.equals(version2)).toBe(false);
    });
  });
});
