import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ParseEDIUseCase } from './ParseEDIUseCase';
import { ParseEDIInputDTO } from './ParseEDIInputDTO';
import { IMessageParser } from '@application/ports';
import { Standard, EDIMessage, Version, MessageType } from '@domain';
describe('ParseEDIUseCase', () => {
  let useCase: ParseEDIUseCase;
  let mockMessageParser: IMessageParser;
  beforeEach(() => {
    mockMessageParser = {
      parse: vi.fn(),
      getSupportedStandard: vi.fn().mockReturnValue(Standard.EDIFACT),
      canParse: vi.fn().mockReturnValue(true),
    };
    useCase = new ParseEDIUseCase(mockMessageParser);
  });
  describe('execute', () => {
    it('should parse message successfully via IMessageParser', () => {
      const mockMessage = new EDIMessage(Standard.EDIFACT, new Version(Standard.EDIFACT, 'D.96A'), new MessageType(Standard.EDIFACT, 'ORDERS'));
      mockMessageParser.parse = vi.fn().mockReturnValue(mockMessage);
      mockMessageParser.canParse = vi.fn().mockReturnValue(true);
      const input: ParseEDIInputDTO = { message: "UNH+1+ORDERS:D:96A:UN'BGM+220'UNT+3+1'", standard: Standard.EDIFACT };
      const result = useCase.execute(input);
      expect(result.success).toBe(true);
    });
    it('should return error for empty message', () => {
      const input: ParseEDIInputDTO = { message: '', standard: Standard.EDIFACT };
      const result = useCase.execute(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.code).toBe('EMPTY_MESSAGE');
      }
    });
    it('should return error if parser cannot parse', () => {
      mockMessageParser.canParse = vi.fn().mockReturnValue(false);
      const input: ParseEDIInputDTO = { message: 'SOME_MESSAGE', standard: Standard.EDIFACT };
      const result = useCase.execute(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.code).toBe('UNSUPPORTED_FORMAT');
      }
    });
    it('should return error if parsing throws exception', () => {
      mockMessageParser.canParse = vi.fn().mockReturnValue(true);
      mockMessageParser.parse = vi.fn().mockImplementation(() => { throw new Error('Invalid'); });
      const input: ParseEDIInputDTO = { message: 'INVALID', standard: Standard.EDIFACT };
      const result = useCase.execute(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.code).toBe('PARSE_ERROR');
      }
    });
  });
});
