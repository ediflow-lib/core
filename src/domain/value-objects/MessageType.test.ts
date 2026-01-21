import { describe, it, expect } from 'vitest';
import { MessageType } from './MessageType';
import { Standard } from './Standard';

describe('MessageType', () => {
  describe('constructor', () => {
    it('should create a valid EDIFACT message type', () => {
      // Arrange & Act
      const messageType = new MessageType(Standard.EDIFACT, 'DESADV');

      // Assert
      expect(messageType.standard).toBe(Standard.EDIFACT);
      expect(messageType.value).toBe('DESADV');
    });

    it('should create a valid X12 message type', () => {
      // Arrange & Act
      const messageType = new MessageType(Standard.X12, '850');

      // Assert
      expect(messageType.standard).toBe(Standard.X12);
      expect(messageType.value).toBe('850');
    });

    it('should throw error for empty message type', () => {
      // Act & Assert
      expect(() => new MessageType(Standard.EDIFACT, '')).toThrow('MessageType value cannot be empty');
      expect(() => new MessageType(Standard.EDIFACT, '   ')).toThrow('MessageType value cannot be empty');
    });
  });

  describe('EDIFACT message type validation', () => {
    it('should accept valid EDIFACT message types', () => {
      // Common EDIFACT message types (6 uppercase letters)
      const validTypes = [
        'DESADV',  // Despatch Advice
        'INVOIC',  // Invoice
        'ORDERS',  // Purchase Order
        'ORDRSP',  // Order Response
        'PRICAT',  // Price Catalogue
        'RECADV',  // Receive Advice
        'IFTMIN',  // Freight Instruction
        'IFCSUM',  // Forwarding Summary
        'IFTSTA',  // Status Report
      ];

      validTypes.forEach((value) => {
        expect(() => new MessageType(Standard.EDIFACT, value)).not.toThrow();
      });
    });

    it('should reject invalid EDIFACT message type formats', () => {
      const invalidTypes = [
        'desadv',        // Lowercase
        'DESAD',         // Too short
        'DESADVX',       // Too long
        'DESAD1',        // Contains number
        'DES-ADV',       // Contains hyphen
        '850',           // X12 format
      ];

      invalidTypes.forEach((value) => {
        expect(() => new MessageType(Standard.EDIFACT, value)).toThrow(/Invalid message type format/);
      });
    });
  });

  describe('X12 message type validation', () => {
    it('should accept valid X12 transaction set codes', () => {
      // Common X12 transaction sets
      const validTypes = [
        '810',     // Invoice
        '850',     // Purchase Order
        '856',     // Ship Notice
        '204',     // Motor Carrier Load Tender
        '837',     // Healthcare Claim
        '835',     // Healthcare Claim Payment
        '270',     // Health Care Eligibility Inquiry
        '271',     // Health Care Eligibility Response
        '997',     // Functional Acknowledgment
      ];

      validTypes.forEach((value) => {
        expect(() => new MessageType(Standard.X12, value)).not.toThrow();
      });
    });

    it('should reject invalid X12 transaction set formats', () => {
      const invalidTypes = [
        '85',            // Too short
        '8500',          // Too long
        'ABC',           // Letters
        'DESADV',        // EDIFACT format
        'ORDERS05',      // IDOC format
      ];

      invalidTypes.forEach((value) => {
        expect(() => new MessageType(Standard.X12, value)).toThrow(/Invalid message type format/);
      });
    });
  });

  describe('IDOC message type validation', () => {
    it('should accept valid IDOC types', () => {
      // Common IDOC types
      const validTypes = [
        'ORDERS05',      // Sales Order
        'INVOIC02',      // Invoice
        'MATMAS05',      // Material Master
        'DEBMAS06',      // Customer Master
        'CREMAS03',      // Vendor Master
        'DELFOR03',      // Delivery Forecast
        'DELVRY03',      // Delivery
      ];

      validTypes.forEach((value) => {
        expect(() => new MessageType(Standard.IDOC, value)).not.toThrow();
      });
    });

    it('should reject invalid IDOC type formats', () => {
      const invalidTypes = [
        'orders',        // Lowercase
        'ORDER',         // No version number
        'DESADV',        // EDIFACT format (wrong pattern)
        '850',           // X12 format
      ];

      invalidTypes.forEach((value) => {
        expect(() => new MessageType(Standard.IDOC, value)).toThrow(/Invalid message type format/);
      });
    });
  });

  describe('VDA message type validation', () => {
    it('should accept valid VDA message types', () => {
      // Common VDA message types (4 digits)
      const validTypes = [
        '4905',          // Delivery Call-off
        '4906',          // Delivery Note
        '4908',          // Dispatch Advice
        '4913',          // Transport Planning
        '4920',          // Warehouse Stock Information
      ];

      validTypes.forEach((value) => {
        expect(() => new MessageType(Standard.VDA, value)).not.toThrow();
      });
    });

    it('should reject invalid VDA message type formats', () => {
      const invalidTypes = [
        '905',           // Too short
        '49050',         // Too long
        'DESADV',        // EDIFACT format
        '490A',          // Contains letter
      ];

      invalidTypes.forEach((value) => {
        expect(() => new MessageType(Standard.VDA, value)).toThrow(/Invalid message type format/);
      });
    });
  });

  describe('HL7v2 message type validation', () => {
    it('should accept valid HL7v2 message types', () => {
      // Common HL7v2 message types (3 uppercase letters)
      const validTypes = [
        'ADT',           // Admit, Discharge, Transfer
        'ORM',           // Order Message
        'ORU',           // Observation Result
        'MDM',           // Medical Document Management
        'SIU',           // Scheduling Information
        'BAR',           // Billing Account Record
        'DFT',           // Detail Financial Transaction
      ];

      validTypes.forEach((value) => {
        expect(() => new MessageType(Standard.HL7v2, value)).not.toThrow();
      });
    });

    it('should reject invalid HL7v2 message type formats', () => {
      const invalidTypes = [
        'ad',            // Too short
        'adt',           // Lowercase
        'ADTX',          // Too long
        'AD1',           // Contains number
        'DESADV',        // EDIFACT format
        '850',           // X12 format
      ];

      invalidTypes.forEach((value) => {
        expect(() => new MessageType(Standard.HL7v2, value)).toThrow(/Invalid message type format/);
      });
    });
  });

  describe('toString', () => {
    it('should return the message type value', () => {
      const messageType = new MessageType(Standard.EDIFACT, 'DESADV');
      expect(messageType.toString()).toBe('DESADV');
    });
  });

  describe('equals', () => {
    it('should return true for equal message types', () => {
      const type1 = new MessageType(Standard.EDIFACT, 'DESADV');
      const type2 = new MessageType(Standard.EDIFACT, 'DESADV');

      expect(type1.equals(type2)).toBe(true);
    });

    it('should return false for different values', () => {
      const type1 = new MessageType(Standard.EDIFACT, 'DESADV');
      const type2 = new MessageType(Standard.EDIFACT, 'INVOIC');

      expect(type1.equals(type2)).toBe(false);
    });

    it('should return false for different standards', () => {
      const type1 = new MessageType(Standard.EDIFACT, 'DESADV');
      const type2 = new MessageType(Standard.X12, '850'); // Use valid X12 format

      expect(type1.equals(type2)).toBe(false);
    });
  });
});
