import { describe, it, expect, beforeEach } from 'vitest';
import { ValidateMessageUseCase } from './ValidateMessageUseCase';
import { EDIMessageValidationService } from '@application/services/EDIMessageValidationService';
import { EDIMessage } from '@domain/entities/EDIMessage';
import { EDISegment } from '@domain/entities/EDISegment';
import { Standard } from '@domain/value-objects/Standard';
import { Version } from '@domain/value-objects/Version';
import { MessageType } from '@domain/value-objects/MessageType';
import { MessageStructure, SegmentNode, SegmentGroupNode } from '@domain/repositories/MessageStructure';

describe('ValidateMessageUseCase - Phase 2 Structure Validation Integration', () => {
  let useCase: ValidateMessageUseCase;
  let validationService: EDIMessageValidationService;

  beforeEach(() => {
    validationService = new EDIMessageValidationService();
    useCase = new ValidateMessageUseCase(validationService);
  });

  const createMessage = (segments: EDISegment[]): EDIMessage => {
    const message = new EDIMessage(
      Standard.EDIFACT,
      new Version(Standard.EDIFACT, 'D.20B'),
      new MessageType(Standard.EDIFACT, 'ORDERS')
    );
    segments.forEach(s => message.addSegment(s));
    return message;
  };

  describe('Phase 1 Only - Syntax Validation (Backward Compatibility)', () => {
    it('should validate syntax only when no MessageStructure provided', () => {
      const message = createMessage([
        new EDISegment('UNH', []),
        new EDISegment('BGM', []),
        new EDISegment('UNT', [])
      ]);

      const result = useCase.execute({
        message,
        strictMode: false
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.validationResult.isValid).toBe(true);
        expect(result.metadata.segmentCount).toBe(3);
      }
    });

    it('should work with existing tests (backward compatible)', () => {
      const message = createMessage([new EDISegment('UNH', [])]);

      const result = useCase.execute({ message });

      expect(result.success).toBe(true);
    });
  });

  describe('Phase 2 - Structure Validation', () => {
    it('should validate against MessageStructure when enabled', () => {
      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order',
        structure: [
          {
            nodeType: 'segment',
            tag: 'UNH',
            name: 'Message header',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: []
          } as SegmentNode,
          {
            nodeType: 'segment',
            tag: 'BGM',
            name: 'Beginning of message',
            mandatory: true,
            maxOccurrences: 1,
            position: 20,
            elements: []
          } as SegmentNode
        ]
      };

      const message = createMessage([
        new EDISegment('UNH', []),
        new EDISegment('BGM', [])
      ]);

      const result = useCase.execute({
        message,
        messageStructure: structure,
        enableStructuralValidation: true
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.validationResult.isValid).toBe(true);
        expect(result.validationResult.errors).toHaveLength(0);
      }
    });

    it('should detect missing mandatory segments', () => {
      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order',
        structure: [
          {
            nodeType: 'segment',
            tag: 'UNH',
            name: 'Message header',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: []
          } as SegmentNode,
          {
            nodeType: 'segment',
            tag: 'BGM',
            name: 'Beginning of message',
            mandatory: true,
            maxOccurrences: 1,
            position: 20,
            elements: []
          } as SegmentNode
        ]
      };

      const message = createMessage([
        new EDISegment('UNH', [])
        // BGM is missing!
      ]);

      const result = useCase.execute({
        message,
        messageStructure: structure,
        enableStructuralValidation: true
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.validationResult.isValid).toBe(false);
        expect(result.validationResult.errors.length).toBeGreaterThan(0);
        expect(result.validationResult.errors[0]?.field).toBe('BGM[0]');
        expect(result.validationResult.errors[0]?.code).toBe('MISSING_MANDATORY_SEGMENT');
      }
    });

    it('should detect max occurrences exceeded', () => {
      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order',
        structure: [
          {
            nodeType: 'segment',
            tag: 'LIN',
            name: 'Line item',
            mandatory: false,
            maxOccurrences: 2,
            position: 10,
            elements: []
          } as SegmentNode
        ]
      };

      const message = createMessage([
        new EDISegment('LIN', []),
        new EDISegment('LIN', []),
        new EDISegment('LIN', []) // 3rd occurrence exceeds max!
      ]);

      const result = useCase.execute({
        message,
        messageStructure: structure,
        enableStructuralValidation: true
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.validationResult.isValid).toBe(false);
        expect(result.validationResult.errors.length).toBeGreaterThan(0);
        expect(result.validationResult.errors[0]?.code).toBe('MAX_OCCURRENCES_EXCEEDED');
      }
    });

    it('should validate segment groups', () => {
      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order',
        structure: [
          {
            nodeType: 'segmentGroup',
            id: 'SG2',
            name: 'Party details',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            triggerSegment: 'NAD',
            children: [
              {
                nodeType: 'segment',
                tag: 'NAD',
                name: 'Name and address',
                mandatory: true,
                maxOccurrences: 1,
                position: 10,
                elements: []
              } as SegmentNode
            ]
          } as SegmentGroupNode
        ]
      };

      const message = createMessage([
        new EDISegment('NAD', [])
      ]);

      const result = useCase.execute({
        message,
        messageStructure: structure,
        enableStructuralValidation: true
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.validationResult.isValid).toBe(true);
        expect(result.validationResult.errors).toHaveLength(0);
      }
    });

    it('should detect missing mandatory groups', () => {
      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order',
        structure: [
          {
            nodeType: 'segmentGroup',
            id: 'SG2',
            name: 'Party details',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            triggerSegment: 'NAD',
            children: [
              {
                nodeType: 'segment',
                tag: 'NAD',
                name: 'Name and address',
                mandatory: true,
                maxOccurrences: 1,
                position: 10,
                elements: []
              } as SegmentNode
            ]
          } as SegmentGroupNode
        ]
      };

      const message = createMessage([]); // Empty - no NAD segment!

      const result = useCase.execute({
        message,
        messageStructure: structure,
        enableStructuralValidation: true
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.validationResult.isValid).toBe(false);
        expect(result.validationResult.errors.length).toBeGreaterThan(0);
        expect(result.validationResult.errors.some(e => e.code === 'MISSING_MANDATORY_GROUP')).toBe(true);
      }
    });
  });

  describe('Strict Mode with Structure Validation', () => {
    it('should stop at syntax errors in strict mode', () => {
      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order',
        structure: [
          {
            nodeType: 'segment',
            tag: 'UNH',
            name: 'Message header',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: []
          } as SegmentNode
        ]
      };

      // Message with 0 segments (invalid syntax)
      const message = createMessage([]);

      const result = useCase.execute({
        message,
        messageStructure: structure,
        enableStructuralValidation: true,
        strictMode: true
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.validationResult.isValid).toBe(false);
        // In strict mode, we stop at syntax validation if it fails
      }
    });
  });

  describe('Combined Syntax + Structure Validation', () => {
    it('should merge errors from both phases', () => {
      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order',
        structure: [
          {
            nodeType: 'segment',
            tag: 'UNH',
            name: 'Message header',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: []
          } as SegmentNode,
          {
            nodeType: 'segment',
            tag: 'BGM',
            name: 'Beginning of message',
            mandatory: true,
            maxOccurrences: 1,
            position: 20,
            elements: []
          } as SegmentNode
        ]
      };

      const message = createMessage([
        new EDISegment('UNH', [])
        // Missing BGM (structure error)
      ]);

      const result = useCase.execute({
        message,
        messageStructure: structure,
        enableStructuralValidation: true,
        strictMode: false
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.validationResult.isValid).toBe(false);
        // Should have structure validation errors
        expect(result.validationResult.errors.length).toBeGreaterThan(0);
      }
    });
  });
});
