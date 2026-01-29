import { describe, it, expect } from 'vitest';
import { ValidateMessageUseCase } from '@application/use-cases/validate/ValidateMessageUseCase';
import { EDIMessageValidationService } from '@application/services/EDIMessageValidationService';
import { Standard, Version, MessageType, EDIMessage, EDISegment, EDIElement } from '@domain';

describe('Integration: ValidateMessageUseCase (Application Layer)', () => {
  function createUseCase(): ValidateMessageUseCase {
    // Real validation service (not mocked!)
    const validationService = new EDIMessageValidationService();
    return new ValidateMessageUseCase(validationService);
  }

  describe('Happy Path', () => {
    it('should validate a valid EDIFACT message', () => {
      // GIVEN: Valid EDIFACT message
      const useCase = createUseCase();
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.96A'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      // Add valid segments
      message.addSegment(
        new EDISegment('UNH', [
          new EDIElement('1'),
          new EDIElement('ORDERS:D:96A:UN')
        ])
      );
      message.addSegment(
        new EDISegment('BGM', [
          new EDIElement('220'),
          new EDIElement('ORDER123')
        ])
      );
      message.addSegment(
        new EDISegment('UNT', [
          new EDIElement('3'),
          new EDIElement('1')
        ])
      );

      // WHEN: Execute via Application Layer Use Case
      const result = useCase.execute({ message });

      // THEN: Result indicates success
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.validationResult.isValid).toBe(true);
        expect(result.validationResult.errors).toHaveLength(0);
      }
    });

    it('should return metadata with validation details', () => {
      // GIVEN
      const useCase = createUseCase();
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.96A'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      message.addSegment(new EDISegment('UNH', [new EDIElement('1')]));
      message.addSegment(new EDISegment('BGM', [new EDIElement('220')]));
      message.addSegment(new EDISegment('UNT', [new EDIElement('2'), new EDIElement('1')]));

      // WHEN
      const result = useCase.execute({ message });

      // THEN: Metadata is complete
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.metadata).toBeDefined();
        expect(result.metadata.standard).toBe(Standard.EDIFACT);
        expect(result.metadata.messageType.value).toBe('ORDERS');
        expect(result.metadata.version.value).toBe('D.96A');
        expect(result.metadata.segmentCount).toBe(3);
      }
    });
  });

  describe('Validation Failures', () => {

    it('should detect empty messages', () => {
      // GIVEN: Empty message
      const useCase = createUseCase();
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.96A'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      // No segments added

      // WHEN
      const result = useCase.execute({ message });

      // THEN: Validation should fail
      expect(result.success).toBe(true); // Use case succeeds
      if (result.success) {
        expect(result.validationResult.isValid).toBe(false);
        expect(result.validationResult.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle validation service errors gracefully', () => {
      // GIVEN: Use case with real service
      const useCase = createUseCase();
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.96A'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      // WHEN: Execute validation
      const result = useCase.execute({ message });

      // THEN: Should always return a result (never throw)
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });
  });
});
