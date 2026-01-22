import { describe, it, expect, beforeEach } from 'vitest';
import { ValidateMessageUseCase } from './ValidateMessageUseCase';
import { EDIMessage, Standard, Version, MessageType, EDISegment } from '../../../domain';

describe('ValidateMessageUseCase', () => {
  let useCase: ValidateMessageUseCase;

  const createMessage = (standard: Standard, versionValue: string, messageTypeValue: string): EDIMessage => {
    return new EDIMessage(
      standard,
      new Version(standard, versionValue),
      new MessageType(standard, messageTypeValue)
    );
  };

  const createValidMessage = (standard: Standard, versionValue: string, messageTypeValue: string): EDIMessage => {
    const message = createMessage(standard, versionValue, messageTypeValue);
    message.addSegment(new EDISegment('TEST1', []));
    message.addSegment(new EDISegment('TEST2', []));
    return message;
  };

  beforeEach(() => {
    useCase = new ValidateMessageUseCase();
  });

  describe('execute', () => {
    describe('EDIFACT messages', () => {
      it('should validate a valid EDIFACT message successfully', () => {
        const message = createValidMessage(Standard.EDIFACT, 'D.96A', 'DESADV');

        const result = useCase.execute({ message });

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return validation errors for invalid EDIFACT message', () => {
        const message = createMessage(Standard.EDIFACT, 'D.96A', 'DESADV');

        const result = useCase.execute({ message });

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]?.code).toBeDefined();
        expect(result.errors[0]?.message).toBeDefined();
      });
    });

    describe('X12 messages', () => {
      it('should validate a valid X12 message successfully', () => {
        const message = createValidMessage(Standard.X12, '005010', '850');

        const result = useCase.execute({ message });

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return validation errors for invalid X12 message', () => {
        const message = createMessage(Standard.X12, '005010', '850');

        const result = useCase.execute({ message });

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('IDOC messages', () => {
      it('should validate a valid IDOC message successfully', () => {
        const message = createValidMessage(Standard.IDOC, 'SAP-ECC', 'ORDERS05');

        const result = useCase.execute({ message });

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return validation errors for invalid IDOC message', () => {
        const message = createMessage(Standard.IDOC, 'SAP-ECC', 'ORDERS05');

        const result = useCase.execute({ message });

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('VDA messages', () => {
      it('should validate a valid VDA message successfully', () => {
        const message = createValidMessage(Standard.VDA, '4905', '4905');

        const result = useCase.execute({ message });

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return validation errors for invalid VDA message', () => {
        const message = createMessage(Standard.VDA, '4905', '4905');

        const result = useCase.execute({ message });

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('HL7v2 messages', () => {
      it('should validate a valid HL7v2 message successfully', () => {
        const message = createValidMessage(Standard.HL7v2, '2.5', 'ADT');

        const result = useCase.execute({ message });

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return validation errors for invalid HL7v2 message', () => {
        const message = createMessage(Standard.HL7v2, '2.5', 'ADT');

        const result = useCase.execute({ message });

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('validation modes', () => {
      it('should collect warnings in non-strict mode', () => {
        const message = createMessage(Standard.EDIFACT, 'D.96A', 'DESADV');
        message.addSegment(new EDISegment('UNH', []));

        const result = useCase.execute({ message, strictMode: false });

        expect(result.warnings).toBeDefined();
      });

      it('should fail fast in strict mode', () => {
        const message = createMessage(Standard.EDIFACT, 'D.96A', 'DESADV');

        const result = useCase.execute({ message, strictMode: true });

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('error details', () => {
      it('should provide detailed error information', () => {
        const message = createMessage(Standard.EDIFACT, 'D.96A', 'DESADV');

        const result = useCase.execute({ message });

        expect(result.isValid).toBe(false);
        expect(result.errors[0]?.field).toBeDefined();
        expect(result.errors[0]?.code).toBeDefined();
        expect(result.errors[0]?.message).toBeDefined();
      });
    });
  });
});
