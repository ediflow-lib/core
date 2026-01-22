import { describe, it, expect, beforeEach } from 'vitest';
import { ValidateMessageUseCase } from './ValidateMessageUseCase';
import { ValidateMessageInputDTO } from './ValidateMessageInputDTO';
import { EDIMessage, Standard, Version, MessageType, EDISegment } from '../../../domain';

describe('ValidateMessageUseCase', () => {
  let useCase: ValidateMessageUseCase;

  beforeEach(() => {
    useCase = new ValidateMessageUseCase();
  });

  describe('execute', () => {
    it('should validate a valid EDIFACT message successfully', () => {
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.96A'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );
      message.addSegment(new EDISegment('UNH', []));
      message.addSegment(new EDISegment('UNT', []));

      const input: ValidateMessageInputDTO = {
        message,
      };

      const result = useCase.execute(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return validation errors for invalid message', () => {
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.96A'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );

      const input: ValidateMessageInputDTO = {
        message,
      };

      const result = useCase.execute(input);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBeDefined();
      expect(result.errors[0]?.message).toBeDefined();
    });

    it('should validate all EDI standards', () => {
      const standards = [
        Standard.EDIFACT,
        Standard.X12,
        Standard.IDOC,
        Standard.VDA,
        Standard.HL7v2,
      ];

      standards.forEach((standard) => {
        const version = standard === Standard.EDIFACT ? 'D.96A' :
                       standard === Standard.X12 ? '005010' :
                       standard === Standard.IDOC ? 'SAP-ECC' :
                       standard === Standard.VDA ? '4905' : '2.5';

        const messageType = standard === Standard.EDIFACT ? 'DESADV' :
                           standard === Standard.X12 ? '850' :
                           standard === Standard.IDOC ? 'ORDERS05' :
                           standard === Standard.VDA ? '4905' : 'ADT';

        const message = new EDIMessage(
          standard,
          new Version(standard, version),
          new MessageType(standard, messageType)
        );
        message.addSegment(new EDISegment('TEST', []));

        const result = useCase.execute({ message });

        expect(result).toBeDefined();
        expect(result.isValid).toBeDefined();
      });
    });

    it('should collect warnings in non-strict mode', () => {
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.96A'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );
      message.addSegment(new EDISegment('UNH', []));

      const input: ValidateMessageInputDTO = {
        message,
        strictMode: false,
      };

      const result = useCase.execute(input);

      expect(result.warnings).toBeDefined();
    });
  });
});
