import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidateMessageUseCase } from '@application';
import { EDIMessage, Standard, Version, MessageType, EDISegment } from '@domain';
import { EDIMessageFactory } from '@application/factories';
import type { IValidationService } from '@application/ports';
import { ValidationResult, ValidationError } from '@application/validation';

describe('ValidateMessageUseCase', () => {
  let useCase: ValidateMessageUseCase;
  let mockValidationService: IValidationService<EDIMessage>;

  const createMessage = (standard: Standard, versionValue: string, messageTypeValue: string): EDIMessage => {
    const message = EDIMessageFactory.create({
      standard,
      version: new Version(standard, versionValue),
      messageType: new MessageType(standard, messageTypeValue)
    });
    message.addSegment(new EDISegment('TEST', []));
    return message;
  };

  beforeEach(() => {
    mockValidationService = {
      validate: vi.fn(),
    };
    useCase = new ValidateMessageUseCase(mockValidationService);
  });

  describe('execute', () => {
    it('should return success with validation result for valid message', () => {
      // GIVEN: Mock service returns valid result
      const message = createMessage(Standard.EDIFACT, 'D.96A', 'ORDERS');
      const validResult = ValidationResult.success();
      mockValidationService.validate = vi.fn().mockReturnValue(validResult);

      // WHEN
      const result = useCase.execute({ message });

      // THEN: Discriminated union success branch
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.validationResult).toBe(validResult);
        expect(result.metadata.standard).toBe(Standard.EDIFACT);
        expect(result.metadata.segmentCount).toBe(1);
      }
    });

    it('should return success with validation errors when message has validation issues', () => {
      // GIVEN: Mock service returns invalid result
      const message = createMessage(Standard.EDIFACT, 'D.96A', 'ORDERS');
      const error = new ValidationError('TEST_ERROR', 'Test error', 'test');
      const invalidResult = ValidationResult.failure(error);
      mockValidationService.validate = vi.fn().mockReturnValue(invalidResult);

      // WHEN
      const result = useCase.execute({ message });

      // THEN: Still success (validation ran), but result shows errors
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.validationResult.isValid).toBe(false);
        expect(result.validationResult.errors.length).toBeGreaterThan(0);
      }
    });

    it('should return failure when validation service throws error', () => {
      // GIVEN: Mock service throws
      const message = createMessage(Standard.EDIFACT, 'D.96A', 'ORDERS');
      mockValidationService.validate = vi.fn().mockImplementation(() => {
        throw new Error('Service error');
      });

      // WHEN
      const result = useCase.execute({ message });

      // THEN: Discriminated union failure branch
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]?.code).toBe('VALIDATION_SERVICE_ERROR');
      }
    });

    it('should call validation service with correct message', () => {
      // GIVEN
      const message = createMessage(Standard.EDIFACT, 'D.96A', 'ORDERS');
      mockValidationService.validate = vi.fn().mockReturnValue(ValidationResult.success());

      // WHEN
      useCase.execute({ message });

      // THEN
      expect(mockValidationService.validate).toHaveBeenCalledWith(message);
    });

    it('should include metadata in success result', () => {
      // GIVEN
      const message = createMessage(Standard.X12, '005010', '850');
      mockValidationService.validate = vi.fn().mockReturnValue(ValidationResult.success());

      // WHEN
      const result = useCase.execute({ message });

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.metadata.standard).toBe(Standard.X12);
        expect(result.metadata.version.value).toBe('005010');
        expect(result.metadata.messageType.value).toBe('850');
        expect(result.metadata.segmentCount).toBe(1);
      }
    });
  });
});
